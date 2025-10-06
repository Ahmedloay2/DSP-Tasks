import React from 'react'
import Task1HomeCard from './Components/Task1HomeCard'
import {Task1HomeData} from './Data/Task1HomeData.js'
import './Task1Home.css'
import { Link } from 'react-router-dom'

export default function Task1Home() {
  return (
    <>
    <div className='task1-home'>
      <div className='task1-home-container'>
        <div className='task1-home-header'>
          <div className='task1-header-content'>
            <h1 className='task1-main-title'>Signal Viewer</h1>
            <p className='task1-main-description'>
              Welcome to the Signal Viewer! This tool allows you to visualize and analyze signals in real-time.
              Choose from various signal types to explore their characteristics and behavior.
            </p>
          </div>
        </div>
        
        <div className='task1-home-content'>
          <h2 className='task1-section-title'>Available Signal Types</h2>
          <div className='task1-cards-grid'>
            {Task1HomeData.map((item, index) => (
              <Task1HomeCard key={index} data={item} index={index} />
            ))}
          </div>
        </div>
      </div>
      
      <Link to='/' className='back-btn'>
       <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
        Back
      </Link>
    </div>
    </>
  )
}
