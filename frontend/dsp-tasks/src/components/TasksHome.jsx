import React from 'react';
import { Link } from 'react-router-dom';
import TaskCard from './TaskCard';
import { allTasksData } from '../data/allTasksData.js';
import '../styles/TasksHome.css';

/**
 * Main Tasks Home Page Component
 * 
 * Displays all available DSP tasks in a modern horizontal card layout.
 * Features a gradient header, task count, and interactive task cards.
 * 
 * @component
 */
export default function TasksHome() {
  return (
    <div className="tasks-home">
      {/* Header Section with Gradient */}
      <div className="tasks-home-header">
        <div className="header-content">
          <h1 className="main-title">Digital Signal Processing Tasks</h1>
          <p className="main-description">
            Explore our collection of DSP tasks implementations.
          </p>
        </div>
      </div>

      {/* Available Tasks Section */}
      <div className="tasks-home-content">
        <div className="tasks-section-header">
          <h2 className="section-title">Available Tasks</h2>
          <div className="tasks-count">
            {allTasksData.length} task{allTasksData.length !== 1 ? 's' : ''} found
          </div>
        </div>

        {/* Tasks Grid */}
        <div className="tasks-grid">
          {allTasksData.map((task, index) => (
            <TaskCard 
              key={`task-${task.id}`}
              task={task}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
}