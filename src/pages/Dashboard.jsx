// src/components/Dashboard/Dashboard.jsx
import React, { useState } from 'react';
import Header from '../pages/Header/Header';
import Board from './Board';
import './Dashboard.css';

const Dashboard = () => {
  const [workspaces, setWorkspaces] = useState([
    { id: 1, name: 'Espace de travail Trelle', color: '#0079bf' }
  ]);
  const [activeWorkspace, setActiveWorkspace] = useState(1);

  return (
    <div className="dashboard">
      <Header 
        workspaces={workspaces}
        activeWorkspace={activeWorkspace}
        onWorkspaceChange={setActiveWorkspace}
      />
      
      <div className="dashboard-content">
        <div className="dashboard-sidebar">
          <div className="sidebar-section">
            <h3>Tableaux</h3>
            <ul className="board-list">
              <li className="active">
                <span className="board-icon">📋</span>
                Tableau Principal
              </li>
              <li>
                <span className="board-icon">🚀</span>
                Projet Rocket
              </li>
              <li>
                <span className="board-icon">🎨</span>
                Design Sprint
              </li>
            </ul>
          </div>

          <div className="sidebar-section">
            <h3>Équipes</h3>
            <div className="team-members">
              <div className="member">
                <div className="member-avatar" style={{background: '#ff6b6b'}}>JD</div>
                <span>John Doe</span>
              </div>
              <div className="member">
                <div className="member-avatar" style={{background: '#4ecdc4'}}>AS</div>
                <span>Alice Smith</span>
              </div>
              <div className="member">
                <div className="member-avatar" style={{background: '#45b7d1'}}>RJ</div>
                <span>Robert Johnson</span>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Filtres</h3>
            <div className="filters">
              <button className="filter-btn">
                <span className="filter-icon">🔍</span>
                Toutes les cartes
              </button>
              <button className="filter-btn">
                <span className="filter-icon">👤</span>
                Mes cartes
              </button>
              <button className="filter-btn">
                <span className="filter-icon">📅</span>
                Dates d'échéance
              </button>
            </div>
          </div>
        </div>

        <div className="dashboard-main">
          <Board />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;