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

  /* =========================
     RESTORE SESSION
  ========================== */
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const accessToken = localStorage.getItem('accessToken');

    if (storedUser && accessToken) {
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
  }, []);

  /* =========================
     LOGIN
  ========================== */
  const login = async (email, password) => {
    try {
      const response = await ApiService.login(email, password);

      // Backend now returns accessToken + refreshToken
      const userData = {
        id: response.user_id,
        email: response.email,
        username: response.email.split('@')[0],
        role: response.role
      };

      // ApiService already stores tokens internally
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Login failed'
      };
    }
  };

  /* =========================
     REGISTER
  ========================== */
  const register = async (email, password, role = 'user') => {
    try {
      const response = await ApiService.register(email, password, role);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  /* =========================
     LOGOUT
  ========================== */
  const logout = () => {
    ApiService.logout(); // clears tokens + redirects
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
      {!loading && children}
    </AuthContext.Provider>
  );
};
