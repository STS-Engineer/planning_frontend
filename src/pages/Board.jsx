// src/components/Dashboard/Board.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/context/AuthContext';
import ApiService from '../services/api';
import List from './List';
import './Board.css';

const Board = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    listId: 1,
    priority: 'medium'
  });
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProject, setNewProject] = useState({
  name: '',
  startDate: '',
  endDate: '',
  comment: '',
  teamMembers: [], // Add this line
  isPublic: false,
  allowComments: true,
  enableNotifications: true
});
  const [activeView, setActiveView] = useState('board'); // 'board' or 'stats'

  // Load user's projects on component mount
  useEffect(() => {
    if (user) {
      loadUserProjects();
    }
  }, [user]);

  const loadUserProjects = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getProjects();
      setProjects(response.projects);

      if (response.projects.length > 0) {
        setSelectedProject(response.projects[0]);
        await loadProjectTasks(response.projects[0].project_id);
      } else {
        setLists(getInitialBoardStructure());
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
      setLists(getInitialBoardStructure());
    } finally {
      setLoading(false);
    }
  };

  const loadProjectTasks = async (projectId) => {
    try {
      const response = await ApiService.getTasks(projectId);
      const transformedLists = transformTasksToBoard(response.tasks);
      setLists(transformedLists);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      setLists(getInitialBoardStructure());
    }
  };

  const getInitialBoardStructure = () => [
    {
      id: 1,
      title: '📝 To Do',
      color: '#ff6b6b',
      icon: '📝',
      cards: []
    },
    {
      id: 2,
      title: '⚡ In Progress',
      color: '#ffd93d',
      icon: '⚡',
      cards: []
    },
    {
      id: 3,
      title: '✅ Done',
      color: '#4ecdc4',
      icon: '✅',
      cards: []
    }
  ];

  const transformTasksToBoard = (tasks) => {
    const todoTasks = tasks.filter((_, index) => index % 3 === 0);
    const inProgressTasks = tasks.filter((_, index) => index % 3 === 1);
    const doneTasks = tasks.filter((_, index) => index % 3 === 2);

    return [
      {
        id: 1,
        title: '📝 To Do',
        color: '#ff6b6b',
        icon: '📝',
        cards: todoTasks.map(task => ({
          id: task.task_id,
          title: task.task_name,
          description: task['task-description'],
          labels: [{ color: getPriorityColor('medium'), text: 'Task' }],
          dueDate: '2024-12-31',
          priority: 'medium',
          assignee: user?.username?.substring(0, 2).toUpperCase() || 'ME',
          projectId: task.project_id,
          databaseId: task.task_id
        }))
      },
      {
        id: 2,
        title: '⚡ In Progress',
        color: '#ffd93d',
        icon: '⚡',
        cards: inProgressTasks.map(task => ({
          id: task.task_id,
          title: task.task_name,
          description: task['task-description'],
          labels: [{ color: getPriorityColor('high'), text: 'In Progress' }],
          dueDate: '2024-12-31',
          priority: 'high',
          assignee: user?.username?.substring(0, 2).toUpperCase() || 'ME',
          projectId: task.project_id,
          databaseId: task.task_id
        }))
      },
      {
        id: 3,
        title: '✅ Done',
        color: '#4ecdc4',
        icon: '✅',
        cards: doneTasks.map(task => ({
          id: task.task_id,
          title: task.task_name,
          description: task['task-description'],
          labels: [{ color: getPriorityColor('low'), text: 'Completed' }],
          dueDate: '2024-12-31',
          priority: 'low',
          assignee: user?.username?.substring(0, 2).toUpperCase() || 'ME',
          projectId: task.project_id,
          databaseId: task.task_id
        }))
      }
    ];
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ff6b6b';
      case 'medium': return '#ffd93d';
      case 'low': return '#4ecdc4';
      default: return '#45b7d1';
    }
  };

  const moveCard = async (cardId, fromListId, toListId) => {
    if (fromListId === toListId) return;

    setLists(prev => {
      const fromList = prev.find(list => list.id === fromListId);
      const toList = prev.find(list => list.id === toListId);
      const card = fromList.cards.find(c => c.id === cardId);

      if (!card) return prev;

      return prev.map(list => {
        if (list.id === fromListId) {
          return {
            ...list,
            cards: list.cards.filter(c => c.id !== cardId)
          };
        }
        if (list.id === toListId) {
          return {
            ...list,
            cards: [...list.cards, card]
          };
        }
        return list;
      });
    });

    try {
      console.log(`Moving task ${cardId} from list ${fromListId} to list ${toListId}`);
    } catch (error) {
      console.error('Failed to update task status:', error);
      loadProjectTasks(selectedProject.project_id);
    }
  };

  const addTask = async () => {
    if (!newTask.title.trim() || !selectedProject) return;

    try {
      const response = await ApiService.createTask({
        task_name: newTask.title,
        task_description: newTask.description,
        project_id: selectedProject.project_id
      });

      const newCard = {
        id: response.task.task_id,
        title: response.task.task_name,
        description: response.task['task-description'],
        labels: [{ color: getPriorityColor(newTask.priority), text: newTask.priority }],
        dueDate: '2024-12-31',
        priority: newTask.priority,
        assignee: user?.username?.substring(0, 2).toUpperCase() || 'ME',
        projectId: selectedProject.project_id,
        databaseId: response.task.task_id
      };

      setLists(prev => prev.map(list => 
        list.id === newTask.listId 
          ? { ...list, cards: [...list.cards, newCard] }
          : list
      ));

      setNewTask({
        title: '',
        description: '',
        listId: 1,
        priority: 'medium'
      });
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Failed to create task. Please try again.');
    }
  };

  const createNewProject = async () => {
    if (!newProject.name.trim()) return;

    try {
      await ApiService.createProject({
        project_name: newProject.name,
        start_date: newProject.startDate,
        end_date: newProject.endDate,
        comment: newProject.comment
      });

      await loadUserProjects();
      setNewProject({ name: '', startDate: '', endDate: '', comment: '' });
      setShowNewProjectModal(false);
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project. Please try again.');
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await ApiService.deleteTask(taskId);
      await loadProjectTasks(selectedProject.project_id);
    } catch (error) {
      console.error('Failed to delete task:', error);
      alert('Failed to delete task. Please try again.');
    }
  };

  const getStats = () => {
    const totalTasks = lists.reduce((acc, list) => acc + list.cards.length, 0);
    const completedTasks = lists.find(list => list.id === 3)?.cards.length || 0;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    return { totalTasks, completedTasks, completionRate };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="board-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="board">
      {/* Header Section */}
      <div className="board-header">
        <div className="header-content">
          <div className="header-main">
            <div className="welcome-section">
              <h1 className="welcome-title">
                Welcome back, <span className="user-name">{user?.username || 'User'}!</span>
              </h1>
              <p className="welcome-subtitle">Manage your projects and tasks efficiently</p>
            </div>
            
            <div className="view-toggle">
              <button 
                className={`view-btn ${activeView === 'board' ? 'active' : ''}`}
                onClick={() => setActiveView('board')}
              >
                📋 Board View
              </button>
              <button 
                className={`view-btn ${activeView === 'stats' ? 'active' : ''}`}
                onClick={() => setActiveView('stats')}
              >
                📊 Statistics
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="quick-stats">
            <div className="stat-card">
              <div className="stat-icon">📁</div>
              <div className="stat-info">
                <div className="stat-number">{projects.length}</div>
                <div className="stat-label">Projects</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📝</div>
              <div className="stat-info">
                <div className="stat-number">{stats.totalTasks}</div>
                <div className="stat-label">Total Tasks</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <div className="stat-number">{stats.completedTasks}</div>
                <div className="stat-label">Completed</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-info">
                <div className="stat-number">{stats.completionRate}%</div>
                <div className="stat-label">Progress</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Section - First Row */}
      <div className="projects-section">
        <div className="section-header">
          <h2 className="section-title">
            <span className="title-icon">🚀</span>
            Your Projects
          </h2>
          <button 
            className="create-project-btn"
            onClick={() => setShowNewProjectModal(true)}
          >
            <span className="btn-icon">➕</span>
            New Project
          </button>
        </div>

        <div className="projects-grid">
          {projects.length > 0 ? (
            projects.map(project => (
              <div 
                key={project.project_id} 
                className={`project-card ${selectedProject?.project_id === project.project_id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedProject(project);
                  loadProjectTasks(project.project_id);
                }}
              >
                <div className="project-header">
                  <div className="project-icon">📋</div>
                  <div className="project-info">
                    <h3 className="project-name">{project['project-name']}</h3>
                    <p className="project-dates">
                      {project['start-date']} → {project['end-date']}
                    </p>
                  </div>
                </div>
                {project.comment && (
                  <p className="project-description">{project.comment}</p>
                )}
                <div className="project-actions">
                  <span className="project-status">Active</span>
                  <button className="project-action-btn">⚡</button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-projects">
              <div className="empty-icon">📁</div>
              <h3>No projects yet</h3>
              <p>Create your first project to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Task Board Section - Second Row */}
      {selectedProject && (
        <div className="task-board-section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="title-icon">🎯</span>
              Task Board - {selectedProject['project-name']}
            </h2>
       
          </div>

          {/* Quick Add Task */}
          <div className="quick-add-section">
            <div className="add-task-card">
              <div className="add-task-header">
                <span className="add-icon">➕</span>
                <h3>Quick Add Task</h3>
              </div>
              <div className="add-task-form">
                <input
                  type="text"
                  placeholder="What needs to be done?"
                  value={newTask.title}
                  onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  className="task-input"
                  onKeyPress={(e) => e.key === 'Enter' && addTask()}
                />
                <input
                  type="text"
                  placeholder="Add description..."
                  value={newTask.description}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  className="task-description"
                />
                <div className="task-options">
                  <select 
                    value={newTask.listId}
                    onChange={(e) => setNewTask(prev => ({ ...prev, listId: parseInt(e.target.value) }))}
                    className="option-select"
                  >
                    {lists.map(list => (
                      <option key={list.id} value={list.id}>{list.icon} {list.title}</option>
                    ))}
                  </select>
                  <select 
                    value={newTask.priority}
                    onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value }))}
                    className="option-select"
                  >
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🔴 High</option>
                  </select>
                  <button 
                    onClick={addTask}
                    className="add-btn"
                    disabled={!newTask.title.trim()}
                  >
                    Add Task
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Lists Container */}
          <div className="lists-container">
            {lists.map(list => (
              <List
                key={list.id}
                list={list}
                onCardMove={moveCard}
                onDeleteTask={deleteTask}
              />
            ))}
          </div>
        </div>
      )}

      {/* No Project Selected */}
      {!selectedProject && projects.length === 0 && (
        <div className="welcome-empty-state">
          <div className="empty-content">
            <div className="empty-illustration">🎯</div>
            <h2>Ready to get organized?</h2>
            <p>Create your first project and start managing tasks like a pro</p>
            <button 
              className="cta-button"
              onClick={() => setShowNewProjectModal(true)}
            >
              <span className="btn-icon">🚀</span>
              Create Your First Project
            </button>
          </div>
        </div>
      )}

      {/* New Project Modal */}
 {showNewProjectModal && (
  <div className="modal-overlay">
    <div className="modal-content">
      <div className="modal-header">
        <h3>Create New Project</h3>
        <button 
          className="modal-close"
          onClick={() => setShowNewProjectModal(false)}
        >
          ×
        </button>
      </div>
      <div className="modal-body">
        <div className="form-group">
          <label>Project Name *</label>
          <input
            type="text"
            value={newProject.name}
            onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter project name"
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Start Date</label>
            <input
              type="date"
              value={newProject.startDate}
              onChange={(e) => setNewProject(prev => ({ ...prev, startDate: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>End Date</label>
            <input
              type="date"
              value={newProject.endDate}
              onChange={(e) => setNewProject(prev => ({ ...prev, endDate: e.target.value }))}
            />
          </div>
        </div>

        {/* Team Members Assignment */}
        <div className="form-group">
          <label>Team Members</label>
          <div className="team-members-section">
            <div className="members-input-container">
              <input
                type="text"
                placeholder="Add team member by email..."
                className="member-input"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    const newMember = {
                      id: Date.now(),
                      email: e.target.value.trim(),
                      role: 'member',
                      avatar: `https://ui-avatars.com/api/?name=${e.target.value.trim()}&background=667eea&color=fff`
                    };
                    setNewProject(prev => ({
                      ...prev,
                      teamMembers: [...(prev.teamMembers || []), newMember]
                    }));
                    e.target.value = '';
                  }
                }}
              />
              <button 
                className="add-member-btn"
                onClick={(e) => {
                  const input = e.target.previousElementSibling;
                  if (input.value.trim()) {
                    const newMember = {
                      id: Date.now(),
                      email: input.value.trim(),
                      role: 'member',
                      avatar: `https://ui-avatars.com/api/?name=${input.value.trim()}&background=667eea&color=fff`
                    };
                    setNewProject(prev => ({
                      ...prev,
                      teamMembers: [...(prev.teamMembers || []), newMember]
                    }));
                    input.value = '';
                  }
                }}
              >
                <span className="btn-icon">➕</span>
                Add
              </button>
            </div>
            
            {/* Selected Team Members */}
            {newProject.teamMembers && newProject.teamMembers.length > 0 && (
              <div className="selected-members">
                <h4>Team Members ({newProject.teamMembers.length})</h4>
                <div className="members-list">
                  {newProject.teamMembers.map(member => (
                    <div key={member.id} className="member-tag">
                      <img 
                        src={member.avatar} 
                        alt={member.email}
                        className="member-avatar"
                      />
                      <span className="member-email">{member.email}</span>
                      <select
                        value={member.role}
                        onChange={(e) => {
                          setNewProject(prev => ({
                            ...prev,
                            teamMembers: prev.teamMembers.map(m => 
                              m.id === member.id ? { ...m, role: e.target.value } : m
                            )
                          }));
                        }}
                        className="role-select"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <button
                        onClick={() => {
                          setNewProject(prev => ({
                            ...prev,
                            teamMembers: prev.teamMembers.filter(m => m.id !== member.id)
                          }));
                        }}
                        className="remove-member-btn"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            value={newProject.comment}
            onChange={(e) => setNewProject(prev => ({ ...prev, comment: e.target.value }))}
            placeholder="Project description or notes..."
            rows="3"
          />
        </div>

        {/* Project Settings */}
        <div className="form-group">
          <label>Project Settings</label>
          <div className="project-settings">
            <label className="setting-checkbox">
              <input
                type="checkbox"
                checked={newProject.isPublic || false}
                onChange={(e) => setNewProject(prev => ({ ...prev, isPublic: e.target.checked }))}
              />
              <span className="checkmark"></span>
              Make project public
            </label>
            <label className="setting-checkbox">
              <input
                type="checkbox"
                checked={newProject.allowComments || true}
                onChange={(e) => setNewProject(prev => ({ ...prev, allowComments: e.target.checked }))}
              />
              <span className="checkmark"></span>
              Allow comments on tasks
            </label>
            <label className="setting-checkbox">
              <input
                type="checkbox"
                checked={newProject.enableNotifications || true}
                onChange={(e) => setNewProject(prev => ({ ...prev, enableNotifications: e.target.checked }))}
              />
              <span className="checkmark"></span>
              Enable notifications
            </label>
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <button 
          className="btn-secondary"
          onClick={() => setShowNewProjectModal(false)}
        >
          Cancel
        </button>
        <button 
          className="btn-primary"
          onClick={createNewProject}
          disabled={!newProject.name.trim()}
        >
          <span className="btn-icon">🚀</span>
          Create Project
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default Board;
