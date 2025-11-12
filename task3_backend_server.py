from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
import os
import sys
import json
import tempfile
import shutil
import time
from pathlib import Path
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
import threading

import numpy as np
import soundfile as sf
from scipy import signal as scipy_signal

# Import the instrument separator
from instruments_separation import InstrumentSeparator

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Configuration
UPLOAD_FOLDER = tempfile.mkdtemp(prefix='dsp_task3_uploads_')
OUTPUT_FOLDER = Path('./output')
CACHE_FOLDER = Path('./cache')
ALLOWED_EXTENSIONS = {'mp3', 'wav', 'flac', 'ogg', 'aac', 'm4a', 'wma'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 200 * 1024 * 1024  # 200MB max
app.config['OUTPUT_FOLDER'] = OUTPUT_FOLDER
app.config['CACHE_FOLDER'] = CACHE_FOLDER

OUTPUT_FOLDER.mkdir(parents=True, exist_ok=True)
CACHE_FOLDER.mkdir(parents=True, exist_ok=True)

# Session storage for processing status
processing_status = {}
processing_lock = threading.Lock()

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def cleanup_old_files():
    """Clean up files older than 1 hour"""
    try:
        current_time = datetime.now()
        
        # Clean output folder
        for item in OUTPUT_FOLDER.iterdir():
            if item.is_dir():
                # Check modification time
                mtime = datetime.fromtimestamp(item.stat().st_mtime)
                if current_time - mtime > timedelta(hours=1):
                    shutil.rmtree(item)
                    print(f"🗑️  Cleaned up old output: {item.name}")
        
        # Clean cache folder
        for item in CACHE_FOLDER.iterdir():
            if item.is_file():
                mtime = datetime.fromtimestamp(item.stat().st_mtime)
                if current_time - mtime > timedelta(hours=1):
                    item.unlink()
                    print(f"🗑️  Cleaned up old cache: {item.name}")
                    
    except Exception as e:
        print(f"⚠️  Cleanup error: {e}")

# Start cleanup thread
def cleanup_thread():
    while True:
        time.sleep(3600)  # Run every hour
        cleanup_old_files()

threading.Thread(target=cleanup_thread, daemon=True).start()

# ============================================================================
# HEALTH & STATUS ENDPOINTS
# ============================================================================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'service': 'dsp-task3-backend',
        'version': '2.0',
        'features': [
            'instrument-separation',
            'audio-processing',
            'equalizer',
            'fft-analysis',
            'spectrogram-generation',
            'file-management'
        ]
    })

@app.route('/status/<session_id>', methods=['GET'])
def get_status(session_id):
    """Get processing status for a session"""
    with processing_lock:
        if session_id in processing_status:
            return jsonify(processing_status[session_id])
        return jsonify({'error': 'Session not found'}), 404

# ============================================================================
# INSTRUMENT SEPARATION ENDPOINTS
# ============================================================================

@app.route('/api/separate', methods=['POST'])
def separate_instruments():
    """
    Separate audio into 6 stems using Demucs AI
    
    Form data:
        - audio: audio file
        - drums, bass, vocals, guitar, piano, other: gain values (0.0-2.0)
        - session_id: optional session identifier
    """

    session_id = request.form.get('session_id', str(int(time.time())))
    
    try:
        # Update status
        with processing_lock:
            processing_status[session_id] = {
                'stage': 'uploading',
                'progress': 0.05,
                'message': 'Uploading file...'
            }
        
        # Validate file
        if 'audio' not in request.files:
            return jsonify({'success': False, 'error': 'No audio file provided'}), 400
        
        file = request.files['audio']
        
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'success': False, 'error': 'Invalid file type'}), 400
        
        # Save uploaded file
        filename = secure_filename(file.filename)
        timestamp = int(time.time())
        upload_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{timestamp}_{filename}")
        file.save(upload_path)
        
        print(f"✅ File uploaded: {upload_path}")
        
        with processing_lock:
            processing_status[session_id] = {
                'stage': 'uploaded',
                'progress': 0.1,
                'message': 'File uploaded successfully'
            }
        
        # Parse gains
        gains = {
            'drums': float(request.form.get('drums', 1.0)),
            'bass': float(request.form.get('bass', 1.0)),
            'vocals': float(request.form.get('vocals', 1.0)),
            'guitar': float(request.form.get('guitar', 1.0)),
            'piano': float(request.form.get('piano', 1.0)),
            'other': float(request.form.get('other', 1.0))
        }
        
        print(f"🎚️ Gains: {gains}")
        
        # Create separator
        separator = InstrumentSeparator(upload_path, str(OUTPUT_FOLDER))
        
        # Update status callback
        def update_progress(stage, progress, message):
            with processing_lock:
                processing_status[session_id] = {
                    'stage': stage,
                    'progress': progress,
                    'message': message
                }
        
        # Process
        with processing_lock:
            processing_status[session_id] = {
                'stage': 'separating',
                'progress': 0.15,
                'message': 'Starting AI separation...'
            }
        
        result = separator.process(
            gains=gains,
            keep_full=True,
            keep_trimmed=True
        )
        
        # Clean up uploaded file
        os.remove(upload_path)
        
        with processing_lock:
            processing_status[session_id] = {
                'stage': 'complete',
                'progress': 1.0,
                'message': 'Processing complete!'
            }
        
        print(f"✅ Separation complete!")
        
        result['session_id'] = session_id
        return jsonify(result)
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        with processing_lock:
            processing_status[session_id] = {
                'stage': 'error',
                'progress': 0,
                'message': str(e)
            }
        
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================================================
# AUDIO PROCESSING ENDPOINTS
# ============================================================================

@app.route('/api/audio/load', methods=['POST'])
def load_audio():
    """
    Load audio file and return basic info + waveform data
    
    Form data:
        - audio: audio file
        - max_samples: optional, max samples to return (default: 1M)
    """
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        
        file = request.files['audio']
        max_samples = int(request.form.get('max_samples', 1000000))
        
        # Save temporarily
        filename = secure_filename(file.filename)
        temp_path = os.path.join(tempfile.gettempdir(), filename)
        file.save(temp_path)
        
        # Load audio
        audio, sr = librosa.load(temp_path, sr=None, mono=True)
        
        # Downsample if needed
        if len(audio) > max_samples:
            downsample_ratio = len(audio) // max_samples
            audio = audio[::downsample_ratio]
            sr = sr // downsample_ratio
        
        # Clean up
        os.remove(temp_path)
        
        return jsonify({
            'success': True,
            'sample_rate': int(sr),
            'duration': float(len(audio) / sr),
            'samples': len(audio),
            'waveform': audio.tolist()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/audio/filter', methods=['POST'])
def apply_filter():
    """
    Apply filter to audio
    
    JSON body:
        - audio: array of audio samples
        - sample_rate: sampling rate
        - filter_type: 'lowpass', 'highpass', 'bandpass', 'bandstop'
        - cutoff: cutoff frequency (or [low, high] for bandpass/bandstop)
        - order: filter order (optional, default: 5)
    """
    try:
        data = request.get_json()
        audio = np.array(data['audio'])
        sr = data['sample_rate']
        filter_type = data['filter_type']
        cutoff = data['cutoff']
        order = data.get('order', 5)
        
        # Normalize cutoff frequency
        if isinstance(cutoff, list):
            cutoff_norm = [c / (sr / 2) for c in cutoff]
        else:
            cutoff_norm = cutoff / (sr / 2)
        
        # Design filter
        b, a = scipy_signal.butter(order, cutoff_norm, btype=filter_type)
        
        # Apply filter
        filtered = scipy_signal.filtfilt(b, a, audio)
        
        return jsonify({
            'success': True,
            'filtered_audio': filtered.tolist()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/audio/equalizer', methods=['POST'])
def apply_equalizer():
    """
    Apply parametric equalizer
    
    JSON body:
        - audio: array of audio samples
        - sample_rate: sampling rate
        - bands: list of {freq, gain, q} objects
    """
    try:
        data = request.get_json()
        audio = np.array(data['audio'])
        sr = data['sample_rate']
        bands = data['bands']
        
        processed = audio.copy()
        
        # Apply each band
        for band in bands:
            freq = band['freq']
            gain_db = band['gain']
            q = band.get('q', 1.0)
            
            if gain_db == 0:
                continue
            
            # Design peaking EQ filter
            gain_linear = 10 ** (gain_db / 20)
            w0 = 2 * np.pi * freq / sr
            alpha = np.sin(w0) / (2 * q)
            
            A = gain_linear
            b0 = 1 + alpha * A
            b1 = -2 * np.cos(w0)
            b2 = 1 - alpha * A
            a0 = 1 + alpha / A
            a1 = -2 * np.cos(w0)
            a2 = 1 - alpha / A
            
            b = [b0/a0, b1/a0, b2/a0]
            a = [1, a1/a0, a2/a0]
            
            # Apply filter
            processed = scipy_signal.lfilter(b, a, processed)
        
        return jsonify({
            'success': True,
            'processed_audio': processed.tolist()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/audio/mix', methods=['POST'])
def mix_audio():
    """
    Mix multiple audio tracks with gains
    
    JSON body:
        - tracks: list of {audio: [], gain: float} objects
        - normalize: boolean (optional, default: true)
    """
    try:
        data = request.get_json()
        tracks = data['tracks']
        normalize = data.get('normalize', True)
        
        # Find max length
        max_len = max(len(track['audio']) for track in tracks)
        
        # Mix tracks
        mixed = np.zeros(max_len)
        for track in tracks:
            audio = np.array(track['audio'])
            gain = track['gain']
            
            # Pad if needed
            if len(audio) < max_len:
                audio = np.pad(audio, (0, max_len - len(audio)))
            
            mixed += audio * gain
        
        # Normalize
        if normalize:
            max_val = np.max(np.abs(mixed))
            if max_val > 0:
                mixed = mixed / max_val * 0.95
        
        return jsonify({
            'success': True,
            'mixed_audio': mixed.tolist()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# FILE MANAGEMENT ENDPOINTS
# ============================================================================

@app.route('/api/download/<path:filename>', methods=['GET'])
def download_file(filename):
    """Download a file from the output directory"""
    try:
        file_path = OUTPUT_FOLDER / filename
        if file_path.exists():
            return send_file(str(file_path), as_attachment=True)
        else:
            return jsonify({'error': 'File not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/cleanup', methods=['POST'])
def cleanup():
    """Clean up old output files"""
    try:
        data = request.get_json() if request.is_json else {}
        output_dir = data.get('output_dir')
        
        if output_dir:
            dir_path = OUTPUT_FOLDER / output_dir
            if dir_path.exists() and dir_path.is_dir():
                shutil.rmtree(dir_path)
                return jsonify({'success': True, 'message': f'Cleaned up {output_dir}'})
            return jsonify({'success': False, 'error': 'Directory not found'}), 404
        else:
            # Clean up all old files
            cleanup_old_files()
            return jsonify({'success': True, 'message': 'Cleaned up old files'})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/files/list', methods=['GET'])
def list_files():
    """List all output files"""
    try:
        files = []
        for item in OUTPUT_FOLDER.iterdir():
            if item.is_dir():
                files.append({
                    'name': item.name,
                    'type': 'directory',
                    'modified': datetime.fromtimestamp(item.stat().st_mtime).isoformat()
                })
        
        return jsonify({'success': True, 'files': files})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# UTILITY ENDPOINTS
# ============================================================================

@app.route('/api/audio/convert', methods=['POST'])
def convert_audio():
    """
    Convert audio between formats
    
    Form data:
        - audio: audio file
        - output_format: 'wav', 'mp3', 'flac', etc.
        - sample_rate: optional target sample rate
        - bit_depth: optional bit depth (16, 24, 32)
    """
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        
        file = request.files['audio']
        output_format = request.form.get('output_format', 'wav')
        target_sr = int(request.form.get('sample_rate', 0))
        bit_depth = int(request.form.get('bit_depth', 16))
        
        # Load audio
        temp_path = os.path.join(tempfile.gettempdir(), secure_filename(file.filename))
        file.save(temp_path)
        
        audio, sr = librosa.load(temp_path, sr=None if target_sr == 0 else target_sr, mono=False)
        os.remove(temp_path)
        
        # Save in new format
        timestamp = int(time.time())
        output_filename = f'converted_{timestamp}.{output_format}'
        output_path = CACHE_FOLDER / output_filename
        
        # Map bit depth to subtype
        subtype_map = {
            16: 'PCM_16',
            24: 'PCM_24',
            32: 'PCM_32'
        }
        subtype = subtype_map.get(bit_depth, 'PCM_16')
        
        sf.write(str(output_path), audio.T if audio.ndim > 1 else audio, sr, subtype=subtype)
        
        return send_file(str(output_path), as_attachment=True, download_name=output_filename)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# MAIN
# ============================================================================

def main():
    """Start the server"""
    print("=" * 80)
    print("🎵 DSP TASK 3 - COMPREHENSIVE BACKEND SERVER")
    print("=" * 80)
    print()
    print("📡 Server URL: http://localhost:5001")
    print("🔗 Frontend should connect to this URL")
    print()
    print("✨ Available Features:")
    print("   • Instrument Separation (AI-powered)")
    print("   • Audio Processing & Filtering")
    print("   • Parametric Equalizer")
    print("   • Audio Mixing")
    print("   • File Management")
    print("   • Format Conversion")
    print()
    print("⚠️  Requirements:")
    print("   • Virtual environment must be activated")
    print("   • Run: instrument_separation\\Scripts\\activate")
    print()
    print("🔧 Endpoints:")
    print("   GET  /health - Health check")
    print("   POST /api/separate - Separate instruments")
    print("   POST /api/audio/load - Load audio file")
    print("   POST /api/audio/filter - Apply filter")
    print("   POST /api/audio/equalizer - Apply EQ")
    print("   POST /api/audio/mix - Mix tracks")
    print("   POST /api/audio/convert - Convert format")
    print("   GET  /api/download/<file> - Download file")
    print("   POST /api/cleanup - Clean up files")
    print()
    print("=" * 80)
    print()
    
    # Run the server
    app.run(host='localhost', port=5001, debug=False, threaded=True)

if __name__ == '__main__':
    # Check dependencies
    try:
        import flask
        import flask_cors
        import librosa
        import soundfile
        import scipy
    except ImportError as e:
        print(f"❌ Error: Missing dependency - {e}")
        print("📦 Install with: pip install flask flask-cors librosa soundfile scipy")
        sys.exit(1)
    
    main()
