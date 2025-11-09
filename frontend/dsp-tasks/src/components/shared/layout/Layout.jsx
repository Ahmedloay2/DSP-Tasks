import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import './Layout.css';


export default function Layout() {
  return (
    <div className="layout">
      {/* Top navigation */}
      <Navbar />
      
      {/* Main content area - grows to fill available space */}
      <main className="main-content">
        <Outlet />
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}