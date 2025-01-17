import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Templates from './components/Templates';
import SharedFiles from './components/SharedFiles';
import Insights from './components/Insights';
import Users from './components/Users';
import Settings from './components/Settings';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';

function App() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Routes>
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
          <Route path="/shared-files" element={<ProtectedRoute><SharedFiles /></ProtectedRoute>} />
          <Route path="/insights" element={<ProtectedRoute><Insights /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        </Routes>
      </Box>
    </Box>
  );
}

export default App;
