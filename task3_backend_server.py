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
        import soundfile
    except ImportError as e:
        print(f"❌ Error: Missing dependency - {e}")
        print("📦 Install with: pip install flask flask-cors soundfile")
        sys.exit(1)
    
    main()
