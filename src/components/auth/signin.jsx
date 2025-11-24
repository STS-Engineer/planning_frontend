// src/components/auth/SignIn.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./signin.css";

export default function SignIn() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const response = await axios.post("http://localhost:4000/ajouter/login", formData);
      
      if (response.status === 200) {
        // Store user data
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("role", response.data.role);
        localStorage.setItem("user_id", response.data.user_id);
        
        if (rememberMe) {
          localStorage.setItem("rememberMe", "true");
          localStorage.setItem("savedEmail", formData.email);
        }
        
        // Show success message
        setTimeout(() => {
          navigate('/');
        }, 1000);
      }
    } catch (error) {
      setErrors({ 
        submit: error.response?.data?.message || "Invalid email or password. Please try again." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load saved email if remember me was checked
  useState(() => {
    const savedEmail = localStorage.getItem("savedEmail");
    const savedRememberMe = localStorage.getItem("rememberMe");
    
    if (savedRememberMe && savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="signin-container">
      {/* Animated Background */}
      <div className="background-animation">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
        <div className="floating-shape shape-4"></div>
      </div>

      <div className="signin-card">
        {/* Header */}
        <div className="signin-header">
          <div className="logo">
            <div className="logo-icon">🎯</div>
            <h1>STS Planning</h1>
          </div>
          <h2 className="welcome-text">Welcome Back!</h2>
          <p className="subtitle">Sign in to continue to your workspace</p>
        </div>

        {/* Error Message */}
        {errors.submit && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {errors.submit}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="signin-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <div className="input-container">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="Enter your email"
              />
              <span className="input-icon">📧</span>
            </div>
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="Enter your password"
              />
              <span className="input-icon">🔒</span>
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>

          <div className="form-options">
            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="checkbox-input"
              />
              <span className="checkmark"></span>
              Remember me
            </label>
            
            <Link to="/forgot-password" className="forgot-link">
              Forgot Password?
            </Link>
          </div>

          <button 
            type="submit" 
            className={`submit-btn ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="spinner"></div>
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Social Login */}
        <div className="social-login">
          <div className="divider">
            <span>Or continue with</span>
          </div>
          
          <div className="social-buttons">
            <button type="button" className="social-btn google">
              <span className="social-icon">🔍</span>
              Google
            </button>
            <button type="button" className="social-btn github">
              <span className="social-icon">💻</span>
              GitHub
            </button>
          </div>
        </div>

        {/* Sign Up Link */}
        <div className="signup-link">
          Don't have an account?{" "}
          <Link to="/signup" className="link">
            Sign up now
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="signin-footer">
        <p>© 2024 TaskFlow. All rights reserved.</p>
      </div>
    </div>
  );
}