// src/components/auth/signin.js
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import './signin.css';

const SignIn = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Remove the mock social login handlers since they're not implemented
  const handleSocialLogin = (provider) => {
    setError(`${provider} authentication is not available yet`);
  };

  return (
    <div className="signin-container">
      {/* Animated Background */}
      <div className="background-animation">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
        <div className="floating-shape shape-4"></div>
      </div>

      {/* Sign In Card */}
      <div className="signin-card">
        {/* Header */}
        <div className="signin-header">
          <div className="logo">
            <div className="logo-icon">📊</div>
            <h1>STS PLANNING</h1>
          </div>
          <h2 className="welcome-text">Welcome Back</h2>
          <p className="subtitle">Sign in to continue to your dashboard</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="signin-form">
          {/* Email Input */}
          <div className="form-group">
            <div className="input-container">
          
              <input
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="form-input"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="form-group">
            <div className="input-container">
              
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="form-input"
                required
                disabled={loading}
              />
              <button 
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          {/* Form Options */}
          <div className="form-options">
            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="checkbox-input"
                disabled={loading}
              />
              <span className="checkmark"></span>
              Remember me
            </label>
            <Link to="/forgot-password" className="forgot-link">
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className={`submit-btn ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Signing In...
              </>
            ) : (
              <>
                <span>🚀</span>
                Sign In
              </>
            )}
          </button>
        </form>

        {/* Sign Up Link */}
        <div className="signup-link">
          Don't have an account?{' '}
          <Link to="/register" className="link">
            Sign up
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="signin-footer">
        © 2024 TaskFlow. All rights reserved.
      </div>
    </div>
  );
};

export default SignIn;
