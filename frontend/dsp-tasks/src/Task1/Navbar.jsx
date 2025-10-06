import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from './useTheme';

const navLinks = [
  { title: 'Home', path: '/' },
  { title: 'Task 1', path: '/task1' }
];

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/" className="brand-link">
            <h1>DSP Tasks</h1>
          </Link>
        </div>
        
        <div className="navbar-menu">
          <ul className="navbar-nav">
            {navLinks.map((link) => (
              <li key={link.title}>
                <Link to={link.path} className="nav-link">
                  {link.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="navbar-actions">
          <button 
            className="theme-toggle" 
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </div>
    </nav>
  );
}