import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import WorkflowEditor from './pages/WorkflowEditor';
import NodeGenerator from './components/NodeGenerator';
import Settings from './pages/Settings';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Private routes */}
            <Route path="/dashboard" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
            
            <Route path="/workflow/:id" element={
              <PrivateRoute>
                <WorkflowEditor />
              </PrivateRoute>
            } />
            
            <Route path="/workflow/new" element={
              <PrivateRoute>
                <WorkflowEditor />
              </PrivateRoute>
            } />
            
            <Route path="/node-generator" element={
              <PrivateRoute>
                <NodeGenerator />
              </PrivateRoute>
            } />
            
            <Route path="/settings" element={
              <PrivateRoute>
                <Settings />
              </PrivateRoute>
            } />
            
            
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;