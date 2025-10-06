import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import './Layout.css';

/**
 * Main layout wrapper component
 * 
 * Provides consistent structure for all pages:
 * - Fixed navbar at top
 * - Main content area that grows to fill available space
 * - Footer at bottom
 * 
 * Uses React Router's Outlet component to render the current route's content
 * in the main content area.
 * 
 * @component
 * @example
 * import Layout from './components/shared/layout/Layout';
 * import { Routes, Route } from 'react-router-dom';
 * 
 * function App() {
 *   return (
 *     <Routes>
 *       <Route path="/" element={<Layout />}>
 *         <Route index element={<HomePage />} />
 *         <Route path="task1" element={<Task1Page />} />
 *       </Route>
 *     </Routes>
 *   );
 * }
 */
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