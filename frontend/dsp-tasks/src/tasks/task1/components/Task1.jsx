import React from 'react';
import { Outlet } from 'react-router-dom';

/**
 * Task 1 Main Component
 * 
 * Simple wrapper component that renders the current Task 1 route.
 * This allows for easy nested routing structure where:
 * - /task1 renders the Task1Home component
 * - /task1/ecg renders the ECG viewer
 * - /task1/dopplershift renders the Doppler Shift component
 * - etc.
 * 
 * @component
 * @example
 * // Router configuration:
 * <Route path="/task1" element={<Task1 />}>
 *   <Route index element={<Task1Home />} />
 *   <Route path="ecg" element={<Task1ECG />} />
 *   <Route path="dopplershift" element={<Task1DopplerShift />} />
 * </Route>
 */
export default function Task1() {
  return <Outlet />;
}