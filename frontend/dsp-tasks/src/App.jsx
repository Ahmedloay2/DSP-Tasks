
import React from 'react';
import { RouterProvider,createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/shared/layout';
import TasksHome from './components/TasksHome';
import { Task1Home, Task1 } from './tasks/task1';
import  Task1ECG  from './tasks/task1/components/ecg/Task1ECG.jsx';
import Task1DopplerShift from './tasks/task1/components/doppler/Task1DopplerShift.jsx';
import Task1SAR from './tasks/task1/components/sar/Task1SAR.jsx';
import Task1EEG from './tasks/task1/components/eeg/Task1EEG.jsx';
import { Task2Home, Task2 } from './tasks/task2';
import Task2ECG from './tasks/task2/components/ecg/Task2ECG.jsx';
import Task2EEG from './tasks/task2/components/eeg/Task2EEG.jsx';
import Task2DopplerShift from './tasks/task2/components/doppler/Task2DopplerShift.jsx';
import Task2SAR from './tasks/task2/components/sar/Task2SAR.jsx';
import Task2Speech from './tasks/task2/components/speech/Task2Speech.jsx';
import { Task3 } from './tasks/task3';
import './App.css';

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
          {path: 'task2', element: <Task2/>,children: [
            {index: true, element: <Task2Home />},
            {path:'ecg', element: <Task2ECG/>},
            {path:'eeg', element: <Task2EEG/>},
            {path:'dopplershift',element:<Task2DopplerShift/>},
            {path:'sar',element:<Task2SAR/>},
            {path:'speech',element:<Task2Speech/>}
          ]},
          {path: 'task3', element: <Task3/>}
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
