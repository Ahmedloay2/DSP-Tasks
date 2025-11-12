import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Task1HomeCard.css';

/**
 * Get appropriate icon for each signal type
 * @param {string} title - The signal type title
 * @returns {string} The emoji icon for the signal type
 */
const getSignalIcon = (title) => {
  const icons = {
    'ECG': '❤️',
    'EEG': '🧠', 
    'Doppler Shift': '📡',
    'Radar': '🎯'
  };
  return icons[title] || '📊';
};

/**
 * Individual task card component
 * 
 * Displays information about a specific signal processing task including:
 * - Signal type icon and title
 * - Description of the task
 * - List of key features
 * - Navigation link to the task
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.data - Task data object containing title, description, features, path
 * @param {number} props.index - Card index for animation delay
 * 
 * @example
 * const taskData = {
 *   title: 'ECG',
 *   description: 'Signal viewer for ECG signals',
 *   features: ['Real-time monitoring', 'Data visualization'],
 *   path: 'ecg'
 * };
 * 
 * <Task1HomeCard data={taskData} index={0} />
 */
export default function Task1HomeCard({ data, index }) {
  return (
    <div 
      className="task1-home-card"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Card header with icon */}
      <div className="task1-card-image-container">
        <div className="task1-signal-icon">
          {getSignalIcon(data.title)}
        </div>
        <div className="task1-card-overlay"></div>
      </div>
      
      {/* Main card content */}
      <div className="task1-card-content">
        <div className="task1-card-header">
          <h3 className="task1-card-title">{data.title}</h3>
          <div className="task1-title-underline"></div>
        </div>
        
        <p className="task1-card-description">{data.description}</p>
        
        {/* Features list */}
        <div className="task1-card-features">
          <h4 className="task1-features-title">Key Features:</h4>
          <ul className="task1-features-list">
            {data.features.map((feature, featureIndex) => (
              <li key={`feature-${featureIndex}`} className="task1-feature-item">
                <span className="task1-feature-check">✓</span>
                <span className="task1-feature-text">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Navigation button */}
        <div className="task1-card-footer">
          <Link
            to={data.path} 
            className="task1-explore-btn"
            aria-label={`Explore ${data.title} signal viewer`}
          >
            <span className="task1-btn-text">Explore</span>
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="currentColor"
              className="task1-btn-arrow"
            >
              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
            </svg>
          </Link>
        </div>
      </div>
      
      {/* Hover glow effect */}
      <div className="task1-card-glow"></div>
    </div>
  );
}