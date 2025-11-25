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
         
            </ul>
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