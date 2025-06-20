// src/components/ProtectedRoute.jsx

// Import React and Navigate component for redirecting users
import React from 'react';
import { Navigate } from 'react-router-dom';

// ProtectedRoute ensures that only authenticated users can access certain routes
function ProtectedRoute({ children }) {
  // Retrieve the user's name from localStorage to check login status
  const userName = localStorage.getItem('userName');

  // If no user is logged in, alert and redirect to the login page
  if (!userName) {
    alert('עליך להתחבר קודם'); // "You must log in first"
    return <Navigate to="/login" replace />;
  }

  // If user is authenticated, render the protected component
  return children;
}

// Export the component for use in route definitions
export default ProtectedRoute;