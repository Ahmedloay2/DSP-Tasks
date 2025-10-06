import React from 'react';
import { Link } from 'react-router-dom';

const footerLinks = [
  { title: 'Home', path: '/' },
  { title: 'Task 1', path: '/task1' }
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>DSP Tasks</h3>
            <p>Explore Digital Signal Processing tasks and implementations.</p>
          </div>
          
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul className="footer-links">
              {footerLinks.map((link) => (
                <li key={link.title}>
                  <Link to={link.path}>{link.title}</Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Connect</h4>
            <div className="social-links">
              <a href="#" aria-label="GitHub" target="_blank" rel="noopener noreferrer">
                <span>📂</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}