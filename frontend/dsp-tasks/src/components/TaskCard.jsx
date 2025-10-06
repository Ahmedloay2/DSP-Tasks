import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/TaskCard.css';

/**
 * Get appropriate icon and colors for each task
 */
const getTaskVisuals = (taskId) => {
  const visuals = {
    'task1': {
      icon: '📊',
      gradient: 'linear-gradient(135deg, rgb(115, 167, 249) 0%, rgb(161, 152, 244) 100%)',
      description: 'Implementation of signal viewer for 4 different Modes ( Task 1 )'
    },
    /*'task2': {
      icon: '🔄',
      gradient: 'linear-gradient(135deg, rgb(161, 152, 244) 0%, rgb(190, 142, 245) 100%)',
      description: 'Advanced signal processing algorithms ( Task 2 )'
    },
    'task3': {
      icon: '⚡',
      gradient: 'linear-gradient(135deg, rgb(115, 167, 249) 0%, rgb(59, 130, 246) 100%)',
      description: 'Real-time signal analysis tools ( Task 3 )'
    },
    'task4': {
      icon: '🎛️',
      gradient: 'linear-gradient(135deg, rgb(99, 149, 245) 0%, rgb(161, 152, 244) 100%)',
      description: 'Digital filter design and implementation ( Task 4 )'
    },
    'task5': {
      icon: '📡',
      gradient: 'linear-gradient(135deg, rgb(147, 136, 240) 0%, rgb(115, 167, 249) 100%)',
      description: 'Communication signal processing ( Task 5 )'
    },
    'task6': {
      icon: '🔊',
      gradient: 'linear-gradient(135deg, rgb(129, 116, 236) 0%, rgb(147, 136, 240) 100%)',
      description: 'Audio signal processing and analysis ( Task 6 )'
    }*/
  };
  
  return visuals[taskId] || visuals['task1'];
};

/**
 * Individual Task Card Component
 * 
 * @param {Object} props - Component props
 * @param {Object} props.task - Task data object
 * @param {number} props.index - Card index for animation delay
 */
export default function TaskCard({ task, index }) {
  const visuals = getTaskVisuals(task.id);
  
  return (
    <div 
      className="task-card"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Task Icon Section */}
      <div 
        className="task-card-icon"
        style={{ background: visuals.gradient }}
      >
        <div className="task-icon">
          {visuals.icon}
        </div>
        <div className="task-card-overlay"></div>
      </div>

      {/* Task Content */}
      <div className="task-card-content">
        <div className="task-card-header">
          <h3 className="task-title">{task.title}</h3>
          {task.language && (
            <span className="task-language">{task.language}</span>
          )}
        </div>
        
        <p className="task-description">
          {visuals.description}
        </p>

        {/* Key Features */}
        <div className="main-home-task-features">
          <h4 className="main-home-features-title">Key Features</h4>
          <ul className="main-home-features-list">
            {task.features.map((feature, featureIndex) => (
              <li key={`feature-${featureIndex}`} className="main-home-feature-item">
                <span className="main-home-feature-check">✓</span>
                <span className="main-home-feature-text">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Action Section */}
      <div className="task-card-actions">
        <Link
          to={task.path}
          className="explore-btn"
          aria-label={`Explore ${task.title}`}
        >
          <span className="btn-text">Explore Task</span>
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="currentColor"
            className="btn-arrow"
          >
            <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
          </svg>
        </Link>
      </div>

      {/* Hover Glow Effect */}
      <div className="task-card-glow"></div>
    </div>
  );
}