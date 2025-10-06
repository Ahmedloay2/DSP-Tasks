import React from 'react';
import { Helmet } from 'react-helmet';
import './DopplerHeader.css';

/**
 * Doppler Header Component - Displays page title, description, and SEO metadata
 * Matches ECG design aesthetic with gradient background and animations
 */
export default function DopplerHeader({ 
    title = "Doppler Shift Simulator - Sound Wave Analysis",
    description = "Interactive Doppler effect demonstration with real-time audio generation, frequency shift analysis, and physics visualization."
}) {
    return (
        <>
            <Helmet>
                <title>{title}</title>
                <meta name="description" content={description} />
                <meta name="keywords" content="Doppler effect, sound waves, frequency shift, audio analysis, physics simulation, wave propagation, acoustic doppler" />
                <meta property="og:title" content="Doppler Shift Simulator" />
                <meta property="og:description" content="Interactive Doppler effect demonstration with real-time audio generation" />
                <meta property="og:type" content="application" />
                <link rel="canonical" href="/task1/doppler" />
            </Helmet>
            
            <div className='doppler-header-wrapper'>
                <div className='doppler-header-content'>
                    <h1 className='doppler-header-title'>Doppler Shift Simulator</h1>
                    <p className='doppler-header-description'>
                        Interactive sound wave analysis tool demonstrating the Doppler effect with customizable parameters,
                        real-time audio generation, and comprehensive frequency shift visualization.
                    </p>
                    <div className='doppler-header-features'>
                        <div className='feature-item'>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3,9V15H7L12,20V4L7,9H3M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12Z"/>
                            </svg>
                            <span>Audio Generation</span>
                        </div>
                        <div className='feature-item'>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"/>
                            </svg>
                            <span>Frequency Analysis</span>
                        </div>
                        <div className='feature-item'>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M13,9V3.5L22.5,12L13,20.5V15H11L9,13H2V11H9L11,9H13M13,11V13H11V11H13Z"/>
                            </svg>
                            <span>Velocity Control</span>
                        </div>
                        <div className='feature-item'>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"/>
                            </svg>
                            <span>Real-Time Playback</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
