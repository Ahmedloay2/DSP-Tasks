/**
 * Task 2 Home Component
 * 
 * Landing page for Task 2 that displays available signal processing tasks.
 * Shows cards for each available signal type with navigation capabilities.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import Task2HomeCard from './Task2HomeCard.jsx';
import { Task2HomeData } from '../data/homeData.js';
import '../styles/Task2Home.css';
import { Helmet } from 'react-helmet';

export default function Task2Home() {
  return (
    <>
    <Helmet>
      <title>Task 2 Home - Signal Viewer</title>
      <meta name="description" content="Welcome to the Signal Viewer! Explore various signal processing tasks including ECG, Doppler Shift, SAR, and EEG visualization." />
      <meta name="keywords" content="Signal Viewer, ECG, Doppler Shift, SAR, EEG, Signal Processing, Digital Signal Processing, DSP Tasks" />
      <meta property="og:title" content="Task 2 Home - Signal Viewer" />
      <meta property="og:description" content="Explore various signal processing tasks including ECG, Doppler Shift, SAR, and EEG visualization." />
      <meta property="og:type" content="website" />
      <link rel="canonical" href="/task2" />
    </Helmet>
    <div className='task2-home'>
      <div className='task2-home-container'>
        {/* Page header with welcome content */}
        <div className='task2-home-header'>
          <div className='task2-header-content'>
            <h1 className='task2-main-title'>Signal Viewer</h1>
            <p className='task2-main-description'>
              Welcome to the Signal Viewer! This tool allows you to visualize and analyze 
              various types of signals in real-time. Choose from different signal processing 
              tasks to explore their characteristics, behavior, and applications in digital 
              signal processing.
            </p>
          </div>
        </div>
        
        {/* Main content area with task cards */}
        <div className='task2-home-content'>
          <h2 className='task2-section-title'>Available Signal Types</h2>
          <div className='task2-cards-grid'>
            {Task2HomeData.map((item, index) => (
              <Task2HomeCard 
                key={`task-${item.path}`} 
                data={item} 
                index={index} 
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Back navigation button */}
      <Link to='/' className='task2-back-btn'>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
        Back to Home
      </Link>
    </div>
    </>
  );
}
