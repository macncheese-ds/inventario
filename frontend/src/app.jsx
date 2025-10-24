import React from 'react';
import Login from "./pages/Login.jsx";
import { Routes, Route, Navigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";
import Inventory from './pages/Inventory.jsx';
import Users from './pages/Users.jsx';
import { setAuthToken } from './api.js';

function Protected({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  try {
    const payload = jwtDecode(token);
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      setAuthToken(null);
      return <Navigate to="/login" replace />;
    }
  } catch {
    setAuthToken(null);
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Protected><Inventory /></Protected>} />
      <Route path="/users" element={<Protected><Users /></Protected>} />
    </Routes>
  );
}
