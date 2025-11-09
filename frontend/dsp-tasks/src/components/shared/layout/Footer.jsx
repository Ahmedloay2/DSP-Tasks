import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

/**
 * Footer navigation links configuration
 * Keep these in sync with main navigation for consistency
 */
const footerLinks = [
  { title: 'Task 1', path: '/task1' },
  { title: 'Task 2', path: '/task2' },
  { title: 'Task 3', path: '/task3' },
  /*{ title: 'Task 4', path: '/task4' },
  { title: 'Task 5', path: '/task5' },
  { title: 'Task 6', path: '/task6' }*/
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          {/* Main footer section with branding */}
          <div className="footer-section footer-brand">
            <h3>DSP Tasks</h3>
            <p>Explore Digital Signal Processing tasks and implementations.</p>
          </div>
          
          {/* Quick navigation links */}
          <div className="footer-section quick-links">
            <h4>Quick Links</h4>
            <ul className="footer-links">
              {footerLinks.map((link) => (
                <li key={link.title}>
                  <Link to={link.path}>{link.title}</Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Social/External links section */}
          <div className="footer-section">
            <h4>Connect</h4>
            <div className="social-links">
              <a 
                href="#" 
                aria-label="GitHub Repository" 
                target="_blank" 
                rel="noopener noreferrer"
                className="social-link"
              >
                <i className="social-icon fab fa-github"></i>
                <span className="social-text">GitHub</span>
              </a>
            </div>
          </div>
        </div>
        
        {/* Copyright and additional info */}
        <div className="footer-bottom">
          <p>Designed by Ahmed Loay</p>
        </div>
      </div>
    </footer>
  );
}