// src/components/Header/Header.jsx
import React from 'react';
import './Header.css';

const Header = ({ workspaces, activeWorkspace, onWorkspaceChange }) => {
  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">
          <div className="logo-icon">🎯</div>
          <h1>Trelle</h1>
        </div>
        
        <div className="workspace-selector">
          <select 
            className="workspace-dropdown"
            value={activeWorkspace}
            onChange={(e) => onWorkspaceChange(parseInt(e.target.value))}
          >
            {workspaces.map(workspace => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.name}
              </option>
            ))}
          </select>
        </div>

        <nav className="main-nav">
          <button className="nav-btn active">
            <span className="nav-icon">📊</span>
            Tableaux
          </button>
          <button className="nav-btn">
            <span className="nav-icon">🚀</span>
            Vues
          </button>
          <button className="nav-btn">
            <span className="nav-icon">⚡</span>
            Automatisation
          </button>
        </nav>
      </div>

      <div className="header-right">
        <div className="premium-notice">
          <div className="premium-badge">
            <span className="badge-number">4</span>
          </div>
          <div className="premium-text">
            L'essai gratuit de Premium est terminé pour Espace de travail Trelle.
          </div>
        </div>

        <div className="header-actions">
          <button className="action-btn search-btn">
            <span className="action-icon">🔍</span>
          </button>
          <button className="action-btn notification-btn">
            <span className="action-icon">🔔</span>
            <span className="notification-dot"></span>
          </button>
          <button className="action-btn add-btn">
            <span className="action-icon">➕</span>
          </button>
          
          <div className="user-menu">
            <div className="user-avatar">
              <img src="/api/placeholder/32/32" alt="User" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;