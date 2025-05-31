// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import Home from './components/Home';
import Questions from './components/Questions';
import Settings from './components/Settings';
import Progress from './components/Progress';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';
import PlacementTest from './components/PlacementTest';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route path="/placement" element={<PlacementTest />} />

  {/* protected pages */}
  <Route path="/questions" element={
    <ProtectedRoute><Questions /></ProtectedRoute>
  } />
  <Route path="/settings" element={
    <ProtectedRoute><Settings /></ProtectedRoute>
  } />
  <Route path="/progress" element={
    <ProtectedRoute><Progress /></ProtectedRoute>
  } />
</Routes>
    </BrowserRouter>
  </React.StrictMode>
);
