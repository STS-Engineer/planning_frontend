// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import './App.css';
import SignIn from './components/auth/signin';
import SignUp from './components/auth/signup';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import ProjectView from './pages/ProjectView';
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">

          <ToastContainer
            position="top-center"  // Changed from "top-right" to "top-center"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<SignIn />} />
            <Route path="/register" element={<SignUp />} />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/projects/:projectId" element={<ProtectedRoute><ProjectView/></ProtectedRoute>} />
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
