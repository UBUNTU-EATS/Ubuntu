import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';

import './App.css'
import LandingPage from './pages/LandingPage';
import MapWithDistance from './pages/MapWithDistance';

function App() {
  
  return (
    <Router>
      <Routes>
        <Route path='/' element={<MapWithDistance/>} />
        </Routes>
    </Router>
  )
}

export default App;
