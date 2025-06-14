// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const userName = localStorage.getItem('userName');

  if (!userName) {
    alert('עליך להתחבר קודם');
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
