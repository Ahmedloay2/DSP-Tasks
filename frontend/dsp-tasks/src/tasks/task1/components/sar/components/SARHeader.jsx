import React from 'react';
import { Helmet } from 'react-helmet';
import './SARHeader.css';

/**
 * SAR Header Component - Displays page title, description, and SEO metadata
 * Matches Task1Home design aesthetic with gradient background and animations
 */
export default function SARHeader({ 
    title = "SAR Image Analysis - Synthetic Aperture Radar Processing",
    description = "Professional SAR image analysis with land cover classification, water detection, and AI-powered surface type identification."
}) {
    return (
        <>
            <Helmet>
                <title>{title}</title>
                <meta name="description" content={description} />
                <meta name="keywords" content="SAR, Synthetic Aperture Radar, remote sensing, radar imaging, land cover classification, water detection, earth observation, signal processing" />
                <meta property="og:title" content="SAR Image Analysis" />
                <meta property="og:description" content="Advanced SAR visualization with land cover classification and AI detection" />
                <meta property="og:type" content="application" />
                <link rel="canonical" href="/task1/sar" />
            </Helmet>
            
            <div className='sar-header-wrapper'>
                <div className='sar-header-content'>
                    <h1 className='sar-header-title'>SAR Image Analysis</h1>
                    <p className='sar-header-description'>
                        Synthetic Aperture Radar image analysis and land cover classification tool with advanced
                        signal processing, water detection algorithms, and intelligent surface type identification.
                    </p>
                    <div className='sar-header-features'>
                        <div className='feature-item'>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="4"/>
                                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
                            </svg>
                            <span>Radar Imaging</span>
                        </div>
                        <div className='feature-item'>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                <circle cx="12" cy="10" r="3"/>
                            </svg>
                            <span>Land Classification</span>
                        </div>
                        <div className='feature-item'>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
                            </svg>
                            <span>Water Detection</span>
                        </div>
                        <div className='feature-item'>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                                <line x1="12" y1="22.08" x2="12" y2="12"/>
                            </svg>
                            <span>AI Classification</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
