import React from 'react'
import '../Styles/Task1HomeCard.css'
import { Link } from 'react-router-dom'

export default function Task1HomeCard({ data, index }) {
  const getSignalIcon = (title) => {
    const icons = {
      'ECG': '❤️',
      'EEG': '🧠', 
      'Doppler Shift': '📡',
      'Radar': '🎯'
    }
    return icons[title] || '📊'
  }

  return (
    <div 
      className={`task1-home-card`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className='task1-card-image-container'>
        <div className='task1-signal-icon'>
          {getSignalIcon(data.title)}
        </div>
        <div className='task1-card-overlay'></div>
      </div>
      
      <div className='task1-card-content'>
        <div className='task1-card-header'>
          <h3 className='task1-card-title'>{data.title}</h3>
          <div className='task1-title-underline'></div>
        </div>
        
        <p className='task1-card-description'>{data.description}</p>
        
        <div className='task1-card-features'>
          <h4 className='task1-features-title'>Key Features:</h4>
          <ul className='task1-features-list'>
            {data.features.map((feature, index) => (
              <li key={index} className='task1-feature-item'>
                <span className='task1-feature-check'>✓</span>
                <span className='task1-feature-text'>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className='task1-card-footer'>
          <Link
            to={data.path} 
            className={`task1-explore-btn`}
            >
            <span className='task1-btn-text'>
                Explore
            </span>
            <i className='fa fa-arrow-right task1-btn-arrow'></i>
        </Link>
        </div>
      </div>
      
      <div className='task1-card-glow'></div>
    </div>
  )
}
