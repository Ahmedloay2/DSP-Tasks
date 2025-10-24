/**
 * Task 2 Home Card Component
 * 
 * Individual card component for displaying signal processing task information.
 * Features hover effects, animations, and clean modern design.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Task2HomeCard.css';

const getSignalIcon = (title) => {
  const icons = {
    'ECG': '❤️',
    'EEG': '🧠', 
    'Doppler Shift': '📡',
    'Speech Recognition': '🎤',
    'SAR Image Analysis': '🛰️',
    'Radar': '🎯'
  };
  return icons[title] || '📊';
};

export default function Task2HomeCard({ data, index }) {
  return (
    <div 
      className="task2-home-card"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Card header with icon */}
      <div className="task2-card-image-container">
        <div className="task2-signal-icon">
          {getSignalIcon(data.title)}
        </div>
        <div className="task2-card-overlay"></div>
      </div>
      
      {/* Main card content */}
      <div className="task2-card-content">
        <div className="task2-card-header">
          <h3 className="task2-card-title">{data.title}</h3>
          <div className="task2-title-underline"></div>
        </div>
        
        <p className="task2-card-description">{data.description}</p>
        
        {/* Features list */}
        <div className="task2-card-features">
          <h4 className="task2-features-title">Key Features:</h4>
          <ul className="task2-features-list">
            {data.features.map((feature, featureIndex) => (
              <li key={`feature-${featureIndex}`} className="task2-feature-item">
                <span className="task2-feature-check">✓</span>
                <span className="task2-feature-text">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Navigation button */}
        <div className="task2-card-footer">
          <Link
            to={data.path} 
            className="task2-explore-btn"
            aria-label={`Explore ${data.title} signal viewer`}
          >
            <span className="task2-btn-text">Explore</span>
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="currentColor"
              className="task2-btn-arrow"
            >
              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
            </svg>
          </Link>
        </div>
      </div>
      
      {/* Hover glow effect */}
      <div className="task2-card-glow"></div>
    </div>
  );
}
