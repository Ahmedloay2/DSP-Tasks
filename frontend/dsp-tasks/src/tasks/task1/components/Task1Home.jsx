
import React from 'react';
import { Link } from 'react-router-dom';
import Task1HomeCard from './Task1HomeCard';
import { Task1HomeData } from '../data/homeData.js';
import '../styles/Task1Home.css';
import { Helmet } from 'react-helmet';

/**
 * Task 1 Home Page Component
 * 
 * Displays an overview of available signal processing tasks with:
 * - Welcome header with description
 * - Grid of task cards showing available signal types
 * - Navigation back to main site
 * 
 * @component
 * @example
 * import Task1Home from './tasks/task1/components/Task1Home';
 * 
 * // Used in router configuration:
 * <Route path="/task1" element={<Task1Home />} />
 */
export default function Task1Home() {
  return (
    <>
    <Helmet>
      <title>Task 1 Home - Signal Viewer</title>
      <meta name="description" content="Welcome to the Signal Viewer! Explore various signal processing tasks including ECG, Doppler Shift, SAR, and EEG visualization." />
      <meta name="keywords" content="Signal Viewer, ECG, Doppler Shift, SAR, EEG, Signal Processing, Digital Signal Processing, DSP Tasks" />
      <meta property="og:title" content="Task 1 Home - Signal Viewer" />
      <meta property="og:description" content="Explore various signal processing tasks including ECG, Doppler Shift, SAR, and EEG visualization." />
      <meta property="og:type" content="website" />
      <link rel="canonical" href="/task1" />
    </Helmet>
    <div className='task1-home'>
      <div className='task1-home-container'>
        {/* Page header with welcome content */}
        <div className='task1-home-header'>
          <div className='task1-header-content'>
            <h1 className='task1-main-title'>Signal Viewer</h1>
            <p className='task1-main-description'>
              Welcome to the Signal Viewer! This tool allows you to visualize and analyze 
              various types of signals in real-time. Choose from different signal processing 
              tasks to explore their characteristics, behavior, and applications in digital 
              signal processing.
            </p>
          </div>
        </div>
        
        {/* Main content area with task cards */}
        <div className='task1-home-content'>
          <h2 className='task1-section-title'>Available Signal Types</h2>
          <div className='task1-cards-grid'>
            {Task1HomeData.map((item, index) => (
              <Task1HomeCard 
                key={`task-${item.path}`} 
                data={item} 
                index={index} 
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Back navigation button */}
      <Link to='/' className='back-btn'>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
        Back to Home
      </Link>
    </div>
    </>
  );
}