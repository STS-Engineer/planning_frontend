import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/context/AuthContext';
import ApiService from '../services/api';
import './Board.css';

const ProjectView = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);
  
  const loadProject = async () => {
    try {
      setLoading(true);
      
      // Get all projects and find the specific one
      const response = await ApiService.getProjects();
      const foundProject = response.projects.find(p => p.project_id == projectId);
      
      if (foundProject) {
        setProject(foundProject);
      } else {
        console.error('Project not found:', projectId);
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Failed to load project:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };
  
  const handleValidate = async () => {
    if (!projectId || user?.role !== 'ADMIN') return;
    
    if (window.confirm(`Validate "${project['project-name']}"?`)) {
      try {
        setUpdatingStatus(true);
        await ApiService.updateProjectStatus(projectId, 'validate');
        
        // Update local state
        setProject(prev => ({
          ...prev,
          status: 'validated'
        }));
        
        alert('Project validated successfully!');
      } catch (error) {
        console.error('Failed to validate project:', error);
        alert('Failed to validate project');
      } finally {
        setUpdatingStatus(false);
      }
    }
  };
  
  if (loading) {
    return (
      <div className="board-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading project...</p>
        </div>
      </div>
    );
  }
  
  if (!project) {
    return (
      <div className="empty-projects">
        <div className="empty-icon">❌</div>
        <h3>Project not found</h3>
        <p>The project you're looking for doesn't exist or you don't have access to it.</p>
        <button
          className="btn-primary"
          onClick={() => navigate('/dashboard')}
        >
          Go to Dashboard
        </button>
      </div>
    );
  }
  
  return (
    <div className="board-container">
      <div className="board-header">
        <div className="header-content">
          <div className="header-main">
            <div className="welcome-section">
              <h1 className="welcome-title">
                Project Validation
              </h1>
              <p className="welcome-subtitle">
                Review project details and validate if complete
              </p>
            </div>
            
            <button
              className="btn-secondary"
              onClick={() => navigate('/dashboard')}
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
      
      <div className="project-detail-container">
        <div className="project-detail-card">
          <div className="project-detail-header">
            <div className="project-icon-large">📋</div>
            <div className="project-detail-info">
              <h2 className="project-detail-name">{project['project-name']}</h2>
              <div className="project-detail-meta">
                <span className="project-detail-dates">
                  📅 {project['start-date'] || 'No start date'} → {project['end-date'] || 'No end date'}
                </span>
                <span className={`project-detail-status status-${project.status || 'active'}`}>
                  {project.status === 'pending_validation' ? '⏳ Pending Validation' :
                   project.status === 'validated' ? '✅ Validated' :
                   project.status === 'archived' ? '📦 Archived' : 'Active'}
                </span>
              </div>
            </div>
          </div>
          
          {project.comment && (
            <div className="project-detail-description">
              <h3>Description</h3>
              <p>{project.comment}</p>
            </div>
          )}
          
          {project.members && project.members.length > 0 && (
            <div className="project-detail-members">
              <h3>Team Members</h3>
              <div className="member-chips">
                {project.members.map(member => {
                  const formattedName = member.email
                    .split('@')[0]
                    .replace(/\./g, ' ');
                  return (
                    <div key={member.id} className="member-chip-large">
                      👤 {formattedName}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {user?.role === 'ADMIN' && project.status === 'pending_validation' && (
            <div className="project-validation-actions">
              <div className="validation-cta">
                <h3>🔔 Validation Request</h3>
                <p>This project has been submitted for validation. Please review the project details and validate if it meets all requirements.</p>
              </div>
              
              <div className="action-buttons">
                <button
                  className="btn-primary validate-btn-large"
                  onClick={handleValidate}
                  disabled={updatingStatus}
                >
                  {updatingStatus ? 'Validating...' : '✅ Validate Project'}
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => window.open(`mailto:${project.members?.[0]?.email || ''}?subject=Project Validation Feedback&body=Regarding project: ${project['project-name']}`)}
                >
                  📧 Request Changes
                </button>
              </div>
            </div>
          )}
          
          {project.status === 'validated' && (
            <div className="project-validated-banner">
              <div className="validated-icon">✅</div>
              <div className="validated-content">
                <h3>Project Validated</h3>
                <p>This project has been validated and marked as complete.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectView;
