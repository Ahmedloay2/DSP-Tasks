import React from 'react';
import SARImageAnalyzer from './components/SARImageAnalyzer';
import SARHeader from './components/SARHeader';
import './Task2SAR.css';
import { Link } from 'react-router-dom';

/**
 * Task2SAR Component - Synthetic Aperture Radar Signal Analysis
 * 
 * This component demonstrates SAR/Cosmic signal processing and analysis.
 * SAR is used in remote sensing to create high-resolution images of Earth's surface,
 * capable of penetrating clouds and darkness. It's used for:
 * - Land cover classification (water, earth, vegetation)
 * - Topographic mapping
 * - Ocean monitoring
 * - Disaster monitoring
 */
const Task2SAR = () => {
  return (
    <div className="task2-sar-container">
      <Link to="/task1" className="task2-back-link">
                ← Back to Task 2 Home
            </Link>
      <SARHeader />
      
      <div className="task2-sar-content">
        <SARImageAnalyzer />
      </div>

      <div className="task2-sar-info">
        <h2>How SAR Works</h2>
        <div className="task2-info-grid">
          <div className="task2-info-card">
            <h3>Signal Transmission</h3>
            <p>SAR sensors emit microwave pulses toward the Earth's surface</p>
          </div>
          <div className="task2-info-card">
            <h3>Backscatter Analysis</h3>
            <p>Different surfaces reflect signals differently based on roughness, moisture, and structure</p>
          </div>
          <div className="task2-info-card">
            <h3>Image Formation</h3>
            <p>Doppler processing and range-azimuth compression create high-resolution images</p>
          </div>
          <div className="task2-info-card">
            <h3>Classification</h3>
            <p>Machine learning algorithms classify surface types (water, land, vegetation, urban)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Task2SAR;
