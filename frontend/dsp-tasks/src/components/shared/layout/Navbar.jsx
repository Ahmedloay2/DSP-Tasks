import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import './Navbar.css';

/**
 * Navigation menu items configuration
 * Add new items here to extend the navigation
 */
const navLinks = [
  /*{ title: 'Home', path: '/' },*/
  { title: 'Task 1', path: '/task1' },
  /*{ title: 'Task 2', path: '/task2' },
  { title: 'Task 3', path: '/task3' },
  { title: 'Task 4', path: '/task4' },
  { title: 'Task 5', path: '/task5' },
  { title: 'Task 6', path: '/task6' }*/
];

/**
 * Main navigation component
 * 
 * Provides site navigation with theme switching capability.
 * Automatically scrolls to top when route changes for better UX.
 * 
 * @component
 * @example
 * import Navbar from './components/shared/layout/Navbar';
 * 
 * function App() {
 *   return (
 *     <div>
 *       <Navbar />
 *     </div>
 *   );
 * }
 */
export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  /**
   * Scroll to top when location changes
   * This provides better UX when navigating between pages
   */
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });
  }, [location]);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Brand/Logo Section */}
        <div className="navbar-brand">
          <Link to="/" className="brand-link">
            <h1>DSP Tasks</h1>
          </Link>
        </div>
        
        {/* Navigation Menu */}
        <div className="navbar-menu">
          <ul className="navbar-nav">
            {navLinks.map((link) => (
              <li key={link.title}>
                <Link 
                  to={link.path} 
                  className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
                >
                  {link.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Theme Toggle Button */}
        <div className="navbar-actions">
          <button 
            className="theme-toggle" 
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </div>
    </nav>
  );
}