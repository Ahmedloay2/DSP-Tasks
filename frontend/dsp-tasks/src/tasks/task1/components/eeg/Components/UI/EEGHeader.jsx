import React from 'react';
import { Helmet } from 'react-helmet';
import './EEGHeader.css';

/**
 * EEG Header Component - Displays page title, description, and SEO metadata
 * Matches Task1Home design aesthetic with gradient background and animations
 */
export default function EEGHeader({ 
    title = "12-Channel EEG Signal Viewer - Advanced Brain Wave Analysis",
    description = "Professional multi-channel EEG signal visualization with real-time playback, channel selection, and AI-powered brain wave pattern classification."
}) {
    return (
        <>
            <Helmet>
                <title>{title}</title>
                <meta name="description" content={description} />
                <meta name="keywords" content="EEG, Electroencephalography, brain analysis, brain waves, neural signals, signal processing, medical visualization, neuroscience, 12-channel EEG" />
                <meta property="og:title" content="Multi Channel EEG Signal Viewer" />
                <meta property="og:description" content="Advanced EEG visualization with multi-channel support and AI classification" />
                <meta property="og:type" content="application" />
                <link rel="canonical" href="/task1/eeg" />
            </Helmet>
            
            <div className='eeg-header-wrapper'>
                <div className='eeg-header-content'>
                    <h1 className='eeg-header-title'>Multi-Channel EEG Signal Viewer</h1>
                    <p className='eeg-header-description'>
                        Advanced brain wave signal analysis and visualization tool with real-time playback controls,
                        multi-channel display modes, and intelligent neural signal processing capabilities.
                    </p>
                    <div className='eeg-header-features'>
                        <div className='feature-item'>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3,13H5V11H3M13,21H11V19H13M13,13H11V11H13M13,17H11V15H13M13,9H11V7H13M13,5H11V3H13M21,9H19V7H21M21,5H19V3H21V5M21,13H19V11H21M21,17H19V15H21M3,21V19H5V21H3M5,7V5H7V7H5M7,3H9V5H7V3M9,3V5H11V7H13V5H15V3H13V1H11V3H9M15,5V7H17V5H15M19,7V9H17V11H15V13H17V15H19V17H17V19H15V21H17V19H19V21H21V19H19V17H21V15H19V13H21V11H19V9H21V7H19M15,11V13H13V15H11V17H9V15H7V13H9V11H11V9H13V7H15V9H13V11H15M3,9H5V7H7V9H9V11H7V13H5V15H3V13H5V11H3V9M3,17H5V15H7V17H5V19H3V17Z"/>
                            </svg>
                            <span>Multi-Channel EEG Display</span>
                        </div>
                        <div className='feature-item'>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8,5.14V19.14L19,12.14L8,5.14Z" />
                            </svg>
                            <span>Interactive Playback</span>
                        </div>
                        <div className='feature-item'>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"/>
                            </svg>
                            <span>Real-Time Analysis</span>
                        </div>
                        <div className='feature-item'>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12,2A3,3 0 0,1 15,5A3,3 0 0,1 12,8A3,3 0 0,1 9,5A3,3 0 0,1 12,2M12,9C14.67,9 20,10.34 20,13V16H4V13C4,10.34 9.33,9 12,9M18,17H6V19H18V17M18,20H6A1,1 0 0,0 5,21A1,1 0 0,0 6,22H18A1,1 0 0,0 19,21A1,1 0 0,0 18,20Z"/>
                            </svg>
                            <span>AI Classification</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
