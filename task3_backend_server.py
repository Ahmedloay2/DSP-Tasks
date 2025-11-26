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
import io
from scipy.io import wavfile

import numpy as np
import soundfile as sf

# Import the instrument separator
from instruments_separation import InstrumentSeparator

# Import the voice separator
from voice_separation import VoiceSeparator

from custom_dsp import FFT

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
    import torch
    
    return jsonify({
        'status': 'ok',
        'service': 'dsp-task3-backend',
        'version': '2.1',
        'features': [
            'instrument-separation',
            'voice-separation',
            'audio-processing',
            'equalizer',
            'fft-analysis',
            'spectrogram-generation',
            'file-management'
        ],
        'gpu_available': torch.cuda.is_available(),
        'device': 'cuda' if torch.cuda.is_available() else 'cpu'
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
                'message': 'Uploading file...',
                'type': 'instrument_separation'
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
                'message': 'File uploaded successfully',
                'type': 'instrument_separation'
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
                    'message': message,
                    'type': 'instrument_separation'
                }
        
        # Process
        with processing_lock:
            processing_status[session_id] = {
                'stage': 'separating',
                'progress': 0.15,
                'message': 'Starting AI separation...',
                'type': 'instrument_separation'
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
                'message': 'Processing complete!',
                'type': 'instrument_separation'
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
                'message': str(e),
                'type': 'instrument_separation'
            }
        
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================================================
# VOICE SEPARATION ENDPOINTS
# ============================================================================

@app.route('/api/separate-voices', methods=['POST'])
def separate_voices():
    """
    Separate audio into individual human voice sources using Multi-Decoder-DPRNN
    
    Form data:
        - audio: audio file
        - source_0, source_1, ...: gain values (0.0-2.0) for each voice
        - session_id: optional session identifier
        - num_sources: expected number of sources (optional, auto-detected)
    
    Returns:
        JSON with separated voice files and metadata
    """
    
    session_id = request.form.get('session_id', str(int(time.time())))
    
    try:
        # Update status
        with processing_lock:
            processing_status[session_id] = {
                'stage': 'uploading',
                'progress': 0.05,
                'message': 'Uploading file...',
                'type': 'voice_separation'
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
                'message': 'File uploaded successfully',
                'type': 'voice_separation'
            }
        
        # Parse gains for sources (if provided)
        gains = {}
        for key in request.form.keys():
            if key.startswith('source_'):
                try:
                    source_idx = int(key.split('_')[1])
                    gain_value = float(request.form.get(key, 1.0))
                    gains[source_idx] = gain_value
                except (ValueError, IndexError):
                    pass
        
        print(f"🎚️ Voice gains: {gains if gains else 'Using defaults'}")
        
        # Create separator
        separator = VoiceSeparator(upload_path, str(OUTPUT_FOLDER))
        
        # Update status callback
        def update_progress(stage, progress, message):
            with processing_lock:
                processing_status[session_id] = {
                    'stage': stage,
                    'progress': progress,
                    'message': message,
                    'type': 'voice_separation'
                }
        
        # Process
        with processing_lock:
            processing_status[session_id] = {
                'stage': 'separating',
                'progress': 0.15,
                'message': 'Starting AI voice separation...',
                'type': 'voice_separation'
            }
        
        result = separator.process(
            gains=gains if gains else None,
            progress_callback=update_progress
        )
        
        # Clean up uploaded file
        os.remove(upload_path)
        
        with processing_lock:
            processing_status[session_id] = {
                'stage': 'complete',
                'progress': 1.0,
                'message': 'Voice separation complete!',
                'type': 'voice_separation'
            }
        
        print(f"✅ Voice separation complete!")
        
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
                'message': str(e),
                'type': 'voice_separation'
            }
        
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/voices/adjust-gains', methods=['POST'])
def adjust_voice_gains():
    """
    Re-mix separated voices with new gain settings without re-separating
    
    JSON body:
        {
            "session_dir": "voices_1234567890",
            "gains": {
                "0": 1.5,
                "1": 0.8,
                "2": 1.0
            }
        }
    
    Returns:
        JSON with new mixed file path
    """
    
    try:
        data = request.get_json()
        
        if not data or 'session_dir' not in data:
            return jsonify({'success': False, 'error': 'session_dir required'}), 400
        
        session_dir = OUTPUT_FOLDER / data['session_dir']
        
        if not session_dir.exists():
            return jsonify({'success': False, 'error': 'Session not found'}), 404
        
        gains = data.get('gains', {})
        
        # Convert string keys to integers
        gains = {int(k): float(v) for k, v in gains.items()}
        
        print(f"🎚️ Adjusting voice gains: {gains}")
        
        # Load all source files
        sources = []
        source_files = sorted(session_dir.glob('voice_*.wav'))
        
        if not source_files:
            return jsonify({'success': False, 'error': 'No voice sources found'}), 404
        
        # Load sources
        for i, source_file in enumerate(source_files):
            audio, sr = sf.read(str(source_file))
            sources.append(audio)
        
        sample_rate = sr
        
        # Mix with new gains
        mixed_audio = np.zeros_like(sources[0])
        
        for i, source in enumerate(sources):
            gain = gains.get(i, 1.0)
            mixed_audio += source * gain
        
        # Normalize to prevent clipping
        max_val = np.abs(mixed_audio).max()
        if max_val > 0.99:
            mixed_audio = mixed_audio * (0.99 / max_val)
        
        # Save new mix
        mixed_path = session_dir / "mixed_adjusted.wav"
        sf.write(
            str(mixed_path),
            mixed_audio,
            sample_rate,
            subtype='PCM_16'
        )
        
        print(f"✅ Saved adjusted mix: {mixed_path}")
        
        return jsonify({
            'success': True,
            'mixed_file': f"{data['session_dir']}/mixed_adjusted.wav",
            'gains': gains
        })
        
    except Exception as e:
        print(f"❌ Error adjusting gains: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/voices/info', methods=['GET'])
def get_voice_info():
    """
    Get information about available voice separation models and capabilities
    
    Returns:
        JSON with model information
    """
    
    try:
        import torch
        
        return jsonify({
            'success': True,
            'model': 'Multi-Decoder-DPRNN',
            'model_id': 'JunzheJosephZhu/MultiDecoderDPRNN',
            'description': 'AI-powered voice separation for multi-speaker audio',
            'capabilities': [
                'Separate multiple human voices from mixed audio',
                'Auto-detect number of speakers',
                'Individual gain control per voice',
                'Re-mixing without re-separation'
            ],
            'supported_formats': list(ALLOWED_EXTENSIONS),
            'cuda_available': torch.cuda.is_available(),
            'device': 'cuda' if torch.cuda.is_available() else 'cpu',
            'max_file_size': '200MB',
            'typical_sources': '2-4 voices',
            'processing_time': 'Varies by audio length (typically 30s-5min)'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/voices/list/<path:session_dir>', methods=['GET'])
def list_voice_sources(session_dir):
    """
    List all voice sources in a session directory
    
    Returns:
        JSON with list of voice files and metadata
    """
    
    try:
        session_path = OUTPUT_FOLDER / session_dir
        
        if not session_path.exists():
            return jsonify({'success': False, 'error': 'Session not found'}), 404
        
        sources = []
        
        # Find all voice files
        for voice_file in sorted(session_path.glob('voice_*.wav')):
            # Get audio info
            info = sf.info(str(voice_file))
            
            sources.append({
                'name': voice_file.stem,
                'file': f"{session_dir}/{voice_file.name}",
                'duration': info.duration,
                'sample_rate': info.samplerate,
                'channels': info.channels
            })
        
        # Check for mixed files
        mixed_files = []
        for mixed_file in session_path.glob('mixed*.wav'):
            info = sf.info(str(mixed_file))
            mixed_files.append({
                'name': mixed_file.stem,
                'file': f"{session_dir}/{mixed_file.name}",
                'duration': info.duration,
                'sample_rate': info.samplerate,
                'channels': info.channels
            })
        
        return jsonify({
            'success': True,
            'session_dir': session_dir,
            'num_sources': len(sources),
            'sources': sources,
            'mixed_files': mixed_files
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

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
def manual_cleanup():
    """Manually trigger cleanup of old files"""
    try:
        cleanup_old_files()
        return jsonify({
            'success': True,
            'message': 'Cleanup completed'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/sessions/list', methods=['GET'])
def list_sessions():
    """List all available session directories"""
    try:
        sessions = []
        
        for item in OUTPUT_FOLDER.iterdir():
            if item.is_dir():
                mtime = datetime.fromtimestamp(item.stat().st_mtime)
                
                # Determine session type
                session_type = 'unknown'
                if item.name.startswith('voices_'):
                    session_type = 'voice_separation'
                elif item.name.startswith('instruments_') or any(item.glob('*drums*.wav')):
                    session_type = 'instrument_separation'
                
                sessions.append({
                    'name': item.name,
                    'type': session_type,
                    'created': mtime.isoformat(),
                    'files': len(list(item.glob('*.wav')))
                })
        
        # Sort by creation time (newest first)
        sessions.sort(key=lambda x: x['created'], reverse=True)
        
        return jsonify({
            'success': True,
            'sessions': sessions,
            'total': len(sessions)
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/sessions/delete/<path:session_dir>', methods=['DELETE'])
def delete_session(session_dir):
    """Delete a session directory and all its files"""
    try:
        session_path = OUTPUT_FOLDER / session_dir
        
        if not session_path.exists():
            return jsonify({'success': False, 'error': 'Session not found'}), 404
        
        # Remove directory and all contents
        shutil.rmtree(session_path)
        
        print(f"🗑️  Deleted session: {session_dir}")
        
        return jsonify({
            'success': True,
            'message': f'Session {session_dir} deleted'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

#===================================================================
# Fast fourier transform
#===================================
@app.route('/upload_wav_and_fft', methods=['POST'])
def upload_wav_and_fft():
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file:
        try:
            # Read the WAV file from the in-memory file object
            samplerate, data = wavfile.read(io.BytesIO(file.read()))

            # If stereo, take only one channel
            if data.ndim > 1:
                data = data[:, 0]

            # Ensure data is float32 as expected by FFT class
            if data.dtype != np.float32:
                data = data.astype(np.float32)

            _fft_instance = FFT()
            real_fft, imag_fft = _fft_instance.fft(data)

            # Convert numpy arrays to lists for JSON serialization
            real_fft_list = real_fft.tolist()
            imag_fft_list = imag_fft.tolist()

            return jsonify({
                "status": "success",
                "fft_real": real_fft_list,
                "fft_imag": imag_fft_list,
                "sample_rate": samplerate,
                "fft_size": len(real_fft)
            })

        except Exception as e:
            return jsonify({"error": f"Processing failed: {str(e)}"}), 500

    return jsonify({"error": "An unexpected error occurred"}), 500

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
    print("   • Instrument Separation (AI-powered, 6 stems)")
    print("   • Voice Separation (AI-powered, multi-speaker)")
    print("   • Audio Processing & Filtering")
    print("   • Parametric Equalizer")
    print("   • Audio Mixing")
    print("   • File Management")
    print("   • Format Conversion")
    print()
    print("⚠️  Requirements:")
    print("   • Virtual environment must be activated")
    print("   • Run: instrument_separation\\Scripts\\activate")
    print("   • Dependencies: torch, torchaudio, asteroid, demucs")
    print()
    print("🔧 Endpoints:")
    print()
    print("   HEALTH & STATUS:")
    print("   GET  /health - Health check")
    print("   GET  /status/<session_id> - Get processing status")
    print()
    print("   INSTRUMENT SEPARATION:")
    print("   POST /api/separate - Separate instruments (6 stems)")
    print()
    print("   VOICE SEPARATION:")
    print("   POST /api/separate-voices - Separate voices (multi-speaker)")
    print("   POST /api/voices/adjust-gains - Adjust voice gains")
    print("   GET  /api/voices/info - Get voice model info")
    print("   GET  /api/voices/list/<session_dir> - List voice sources")
    print()
    print("   FILE MANAGEMENT:")
    print("   GET  /api/download/<file> - Download file")
    print("   POST /api/cleanup - Manual cleanup")
    print("   GET  /api/sessions/list - List all sessions")
    print("   DEL  /api/sessions/delete/<session_dir> - Delete session")
    print()
    print("=" * 80)
    print()
    
    # Check GPU availability
    try:
        import torch
        if torch.cuda.is_available():
            print(f"✅ GPU ENABLED: {torch.cuda.get_device_name(0)}")
            print(f"   VRAM: {torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB")
        else:
            print("⚠️  GPU NOT AVAILABLE - Using CPU (slower processing)")
    except:
        pass
    
    print()
    print("🚀 Starting server...")
    print()
    
    # Run the server
    app.run(host='localhost', port=5001, debug=False, threaded=True)

if __name__ == '__main__':
    # Check dependencies
    try:
        import flask
        import flask_cors
        import soundfile
        import torch
        import torchaudio
    except ImportError as e:
        print(f"❌ Error: Missing dependency - {e}")
        print("📦 Install with:")
        print("   pip install flask flask-cors soundfile torch torchaudio asteroid pytorch-lightning")
        sys.exit(1)
    
    main()
