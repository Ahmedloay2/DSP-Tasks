/**
 * Main Application Component
 * 
 * Root component that sets up routing and provides the main application structure.
 * Uses React Router for navigation between different tasks and components.
 * 
 * @author AI Assistant 
 * @version 1.0.0
 */
import React from 'react';
import { RouterProvider,createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/shared/layout';
import TasksHome from './components/TasksHome';
import { Task1Home, Task1 } from './tasks/task1';
import  Task1ECG  from './tasks/task1/components/ecg/Task1ECG.jsx';
import Task1DopplerShift from './tasks/task1/components/doppler/Task1DopplerShift.jsx';
import Task1SAR from './tasks/task1/components/sar/Task1SAR.jsx';
import Task1EEG from './tasks/task1/components/eeg/Task1EEG.jsx';
import './App.css';


/**
 * Main App Component
 * 
 * Sets up the application routing structure:
 * - / shows the main tasks home page with all available DSP tasks
 * - /task1 shows the Task 1 home page with signal processing options
 * - /task1/* handles nested routes for specific signal processing tasks
 * 
 * The Layout component provides consistent navigation, content area, and footer
 * across all pages.
 * 
 * @component
 */
function App() {
  let routers = createBrowserRouter([
      {
        path: '', element: <Layout /> ,children: [
          {
            index: true,element: <TasksHome />
          },
          {path: 'task1', element: <Task1/>,children: [
            {index: true, element: <Task1Home />},
            {path:'ecg', element: <Task1ECG/>},
            {path:'dopplershift',element:<Task1DopplerShift/>},
            {path:'sar',element:<Task1SAR/>},
            {path:'eeg', element: <Task1EEG/>}
          ]},
        ]
      }
    ])
  return (
    <div className='App'>
      <RouterProvider router={routers} />
    </div>
  )
}

export default App;
