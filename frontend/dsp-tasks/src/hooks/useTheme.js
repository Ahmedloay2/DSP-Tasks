
import { useState, useEffect } from 'react';

/**
 * Custom hook for managing application theme (light/dark mode)
 * 
 * Features:
 * - Persists theme preference in localStorage
 * - Automatically applies theme to document element
 * - Provides toggle functionality
 * - Syncs with system preference on first load
 * 
 * @returns {Object} Theme state and controls
 * @returns {string} theme - Current theme ('light' or 'dark')
 * @returns {Function} toggleTheme - Function to toggle between themes
 * @returns {Function} setTheme - Function to set specific theme
 * 
 * @example
 * ```jsx
 * function MyComponent() {
 *   const { theme, toggleTheme } = useTheme();
 *   
 *   return (
 *     <button onClick={toggleTheme}>
 *       {theme === 'light' ? '🌙' : '☀️'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useTheme() {
  // Initialize theme state with localStorage value or system preference
  const [theme, setThemeState] = useState(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('dsp-tasks-theme');
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      return savedTheme;
    }
    
    // Fall back to system preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    // Default to light theme
    return 'light';
  });

  /**
   * Apply theme to document and save to localStorage
   * @param {string} newTheme - Theme to apply ('light' or 'dark')
   */
  const applyTheme = (newTheme) => {
    // Apply to document element
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Save to localStorage for persistence
    localStorage.setItem('dsp-tasks-theme', newTheme);
    
    // Update state
    setThemeState(newTheme);
  };

  /**
   * Toggle between light and dark themes
   */
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
  };

  /**
   * Set specific theme
   * @param {string} newTheme - Theme to set ('light' or 'dark')
   */
  const setTheme = (newTheme) => {
    if (newTheme === 'light' || newTheme === 'dark') {
      applyTheme(newTheme);
    }
  };

  // Apply theme on initial load and when theme changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Listen for system theme changes (optional enhancement)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleSystemThemeChange = (e) => {
        // Only auto-change if user hasn't manually set a preference
        const savedTheme = localStorage.getItem('dsp-tasks-theme');
        if (!savedTheme) {
          applyTheme(e.matches ? 'dark' : 'light');
        }
      };

      // Add listener for system theme changes
      mediaQuery.addListener(handleSystemThemeChange);
      
      // Cleanup listener on unmount
      return () => {
        mediaQuery.removeListener(handleSystemThemeChange);
      };
    }
  }, []);

  return {
    theme,
    toggleTheme,
    setTheme
  };
}

export default useTheme;