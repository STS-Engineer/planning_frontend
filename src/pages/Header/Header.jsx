// src/components/Dashboard/Header.js
import React, { useState } from 'react';
import { useAuth } from '../../components/context/AuthContext';
import NotificationCenter from '../../components/Notifications/NotificationCenter'; // Make sure this path is correct
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const [activeNav, setActiveNav] = useState('dashboard');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const userInitials = user?.username 
    ? user.username.substring(0, 2).toUpperCase()
    : 'ME';

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  const navItems = [
<<<<<<< HEAD
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    // Add more nav items as needed
=======
    { id: 'dashboard', label: 'Dashboard', icon: '📊' }
>>>>>>> fd8fad8296acdef2a663736335c32e5e936569eb
  ];

  return (
    <div className="header">
      {/* Left Section */}
      <div className="header-left">
        {/* Logo */}
        <div className="logo">
          <div className="logo-icon">📊</div>
<<<<<<< HEAD
          <h1>AI AND SOFTWARE TEAM PLANNING</h1> {/* Fixed typo: PLANNIG -> PLANNING */}
=======
          <h1>AI AND SOFTWARE TEAM PLANNIG</h1>
>>>>>>> fd8fad8296acdef2a663736335c32e5e936569eb
        </div>

        {/* Workspace Selector */}
        <div className="workspace-selector">
          <select className="workspace-dropdown">
            <option>My Workspace</option>
            <option>Team Projects</option>
            <option>Personal Tasks</option>
          </select>
        </div>

        {/* Main Navigation */}
        <nav className="main-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-btn ${activeNav === item.id ? 'active' : ''}`}
              onClick={() => setActiveNav(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Right Section */}
      <div className="header-right">
        {/* Header Actions */}
        <div className="header-actions">
        

          {/* 🔄 REPLACED: Old notification button with NotificationCenter */}
          <NotificationCenter />

    

          {/* User Menu */}
          <div className="user-menu">
            <div 
              className="user-avatar"
              onClick={() => setShowUserMenu(!showUserMenu)}
              title={`${user?.username || 'User'} - Click to open menu`}
            >
              {userInitials}
            </div>
            
            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="user-dropdown">
                <div className="dropdown-section">
                  <div className="user-info">
                    <div className="user-avatar-small">{userInitials}</div>
                    <div className="user-details">
                      <div className="user-name">{user?.username || 'User'}</div>
                      <div className="user-email">{user?.email || 'user@example.com'}</div>
                    </div>
                  </div>
                </div>
                
                <div className="dropdown-section">
                  <button className="dropdown-item">
                    <span className="dropdown-icon">👤</span>
                    Profile Settings
                  </button>
                  <button className="dropdown-item">
                    <span className="dropdown-icon">🎨</span>
                    Theme Preferences
                  </button>
                  <button className="dropdown-item">
                    <span className="dropdown-icon">⚙️</span>
                    Workspace Settings
                  </button>
                </div>
                
                <div className="dropdown-section">
                  <button className="dropdown-item">
                    <span className="dropdown-icon">🆘</span>
                    Help & Support
                  </button>
                  <button className="dropdown-item">
                    <span className="dropdown-icon">📱</span>
                    Download App
                  </button>
                </div>
                
                <div className="dropdown-section">
                  <button 
                    className="dropdown-item logout-item"
                    onClick={handleLogout}
                  >
                    <span className="dropdown-icon">🚪</span>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;