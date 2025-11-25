// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import ApiService from '../../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      // Verify the token is not a mock token
      if (token !== 'mock-jwt-token') {
        ApiService.setToken(token);
        setUser(JSON.parse(userData));
      } else {
        // Clear invalid mock token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      const response = await ApiService.login(email, password);
      
      // Make sure we have a real token, not a mock one
      if (response.token && response.token !== 'mock-jwt-token') {
        const userData = {
          id: response.user_id,
          email: response.email,
          username: response.email.split('@')[0],
          role: response.role
        };
        
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', response.token);
        ApiService.setToken(response.token);
        setUser(userData);
        
        return { success: true, data: response };
      } else {
        return { success: false, error: 'Invalid token received' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (email, password, role = 'user') => {
    try {
      const response = await ApiService.register(email, password, role);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    ApiService.logout();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};