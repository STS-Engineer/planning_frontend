// src/components/Dashboard/Board.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/context/AuthContext';
import ApiService from '../services/api';
import List from './List';
import './Board.css';
import { toast } from 'react-toastify';

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
    teamMembers: [],
    isPublic: false,
    allowComments: true,
    enableNotifications: true
  });
  const [creatingProject, setCreatingProject] = useState(false);
  const [activeView, setActiveView] = useState('board');
  const [members, setMembers] = useState([]);

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
      console.log('projects', response.projects);

      setLists(getInitialBoardStructure());
      setSelectedProject(null);
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

  const loadMembers = async () => {
    try {
      const res = await ApiService.getMembers();
      setMembers(res.users);
    } catch (error) {
      console.error('Failed to load members', error);
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
    // Group tasks by their actual status from database
    const todoTasks = tasks.filter(task => task.status === 'todo' || !task.status);
    const inProgressTasks = tasks.filter(task => task.status === 'in_progress');
    const doneTasks = tasks.filter(task => task.status === 'done');

    console.log('Task distribution:', {
      todo: todoTasks.length,
      in_progress: inProgressTasks.length,
      done: doneTasks.length
    });

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
          databaseId: task.task_id,
          status: task.status || 'todo'
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
          databaseId: task.task_id,
          status: task.status
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
          databaseId: task.task_id,
          status: task.status
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

    // Map list IDs to status values
    const listIdToStatus = {
      1: 'todo',
      2: 'in_progress',
      3: 'done'
    };

    const newStatus = listIdToStatus[toListId];

    console.log(`🎯 Moving task ${cardId} from list ${fromListId} to list ${toListId} (status: ${newStatus})`);

    // Optimistically update UI
    const fromList = lists.find(list => list.id === fromListId);
    const card = fromList?.cards.find(c => c.id === cardId);

    if (!card) {
      console.error('Card not found:', cardId);
      return;
    }

    setLists(prev => {
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
            cards: [...list.cards, { ...card, status: newStatus }]
          };
        }
        return list;
      });
    });

    try {
      // Save to database
      await ApiService.updateTaskStatus(cardId, newStatus);
      
      console.log('✅ Task status updated successfully in database');
      
      toast.success('Task moved successfully!', {
        position: "top-center",
        autoClose: 1500,
      });
    } catch (error) {
      console.error('❌ Failed to update task status:', error);
      
      // Revert UI on error
      loadProjectTasks(selectedProject.project_id);
      
      toast.error('Failed to move task. Please try again.', {
        position: "top-center",
        autoClose: 3000,
      });
    }
  };

  const addTask = async () => {
    if (!newTask.title.trim() || !selectedProject) return;

    // Map list IDs to status values
    const listIdToStatus = {
      1: 'todo',
      2: 'in_progress',
      3: 'done'
    };

    const taskStatus = listIdToStatus[newTask.listId];

    try {
      const response = await ApiService.createTask({
        task_name: newTask.title,
        task_description: newTask.description,
        project_id: selectedProject.project_id,
        status: taskStatus
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
        databaseId: response.task.task_id,
        status: response.task.status
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

      toast.success('Task created successfully!', {
        position: "top-center",
        autoClose: 2000,
      });
    } catch (error) {
      console.error('Failed to create task:', error);
      toast.error(error.message || 'Failed to create task. Please try again.', {
        position: "top-center",
        autoClose: 3000,
      });
    }
  };

  const createNewProject = async () => {
    if (!newProject.name.trim()) return;

    try {
      setCreatingProject(true);

      await ApiService.createProject({
        project_name: newProject.name,
        start_date: newProject.startDate,
        end_date: newProject.endDate,
        comment: newProject.comment,
        members: newProject.teamMembers.map(m => m.id)
      });

      await loadUserProjects();

      setNewProject({
        name: '',
        startDate: '',
        endDate: '',
        comment: '',
        teamMembers: [],
        isPublic: false,
        allowComments: true,
        enableNotifications: true
      });

      setShowNewProjectModal(false);
      toast.success('Project created successfully!', {
        position: "top-center",
        autoClose: 3000,
        toastClassName: "custom-toast-offset",
      });

    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error('Failed to create project. Please try again.', {
        position: "top-center",
        autoClose: 3000,
      });
    } finally {
      setCreatingProject(false);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await ApiService.deleteTask(taskId);
      await loadProjectTasks(selectedProject.project_id);
      toast.success('Task deleted successfully!', {
        position: "top-center",
        autoClose: 2000,
      });
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('Failed to delete task. Please try again.', {
        position: "top-center",
        autoClose: 3000,
      });
    }
  };

  const isProjectMember = () => {
    if (!selectedProject || !user) return false;
    return selectedProject.members?.some(member => member.id === user.id) || user.role === 'ADMIN';
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
    <div className="board-container">
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

      <div className="board">
        {activeView === 'board' && (
          <>
            <div className="projects-section">
              <div className="section-header">
                <h2 className="section-title">
                  <span className="title-icon">🚀</span>
                  Your Projects
                </h2>

                {user?.role === 'ADMIN' && (
                  <button
                    className="create-project-btn"
                    onClick={() => {
                      setShowNewProjectModal(true);
                      loadMembers();
                    }}
                  >
                    <span className="btn-icon">➕</span>
                    New Project
                  </button>
                )}
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
                          {project.members?.length > 0 && (
                            <div className="project-members">
                              {project.members.map(member => {
                                const formattedName = member.email
                                  .split('@')[0]
                                  .replace(/\./g, ' ');
                                return (
                                  <span key={member.id} className="member-chip">
                                    👤 {formattedName}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {project.comment && (
                        <p className="project-description">{project.comment}</p>
                      )}

                      <div className="project-actions">
                        <span className="project-status">Active</span>
                        <button className="project-action-btn">⚡</button>
                        {user?.role === 'ADMIN' && (
                          <button
                            className="project-action-btn delete-btn"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (window.confirm("Are you sure you want to delete this project?")) {
                                try {
                                  const res = await fetch(`https://plan-back.azurewebsites.net/ajouter/projects/${project.project_id}`, {
                                    method: 'DELETE',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      Authorization: `Bearer ${localStorage.getItem('token')}`
                                    }
                                  });
                                  const data = await res.json();
                                  if (res.ok) {
                                    setProjects(prev => prev.filter(p => p.project_id !== project.project_id));
                                    if (selectedProject?.project_id === project.project_id) {
                                      setSelectedProject(null);
                                      setLists(getInitialBoardStructure());
                                    }
                                    toast.success(data.message || "Project deleted successfully!");
                                  } else {
                                    toast.error(data.error || 'Failed to delete project');
                                  }
                                } catch (error) {
                                  console.error(error);
                                  toast.error('Something went wrong');
                                }
                              }
                            }}
                          >
                            🗑️
                          </button>
                        )}
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

            {selectedProject && isProjectMember() && (
              <div className="task-board-section">
                <div className="section-header">
                  <h2 className="section-title">
                    <span className="title-icon">🎯</span>
                    Task Board - {selectedProject['project-name']}
                  </h2>
                </div>

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

            {selectedProject && !isProjectMember() && (
              <div className="welcome-empty-state">
                <div className="empty-content">
                  <div className="empty-illustration">🔒</div>
                  <h2>Access Restricted</h2>
                  <p>You don't have access to this project's tasks</p>
                  <p style={{fontSize: '14px', color: '#666', marginTop: '10px'}}>
                    Contact the project administrator to be added as a member
                  </p>
                </div>
              </div>
            )}

            {!selectedProject && projects.length > 0 && (
              <div className="welcome-empty-state">
                <div className="empty-content">
                  <div className="empty-illustration">👆</div>
                  <h2>Select a Project</h2>
                  <p>Click on a project above to view its details and manage tasks</p>
                </div>
              </div>
            )}

            {!selectedProject && projects.length === 0 && (
              <div className="welcome-empty-state">
                <div className="empty-content">
                  <div className="empty-illustration">🎯</div>
                  <h2>Ready to get organized?</h2>
                  <p>Create your first project and start managing tasks like a pro</p>
                  {user?.role === 'ADMIN' && (
                    <button
                      className="cta-button"
                      onClick={() => {
                        setShowNewProjectModal(true);
                        loadMembers();
                      }}
                    >
                      <span className="btn-icon">🚀</span>
                      Create Your First Project
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {activeView === 'stats' && (
          <div className="statistics-section">
            <h2>📊 Project Statistics</h2>
            <p>Statistics view content goes here...</p>
          </div>
        )}
      </div>

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

              <div className="form-group">
                <label>Team Members</label>
                <div className="team-members-section">
                  {members.map(member => {
                    const displayName = member.email.split('@')[0].replace(/\./g, ' ');
                    return (
                      <label key={member.id} className="member-checkbox">
                        <input
                          type="checkbox"
                          checked={newProject.teamMembers.some(m => m.id === member.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewProject(prev => ({
                                ...prev,
                                teamMembers: [...prev.teamMembers, member]
                              }));
                            } else {
                              setNewProject(prev => ({
                                ...prev,
                                teamMembers: prev.teamMembers.filter(m => m.id !== member.id)
                              }));
                            }
                          }}
                        />
                        <span>{displayName}</span>
                      </label>
                    );
                  })}
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
                disabled={!newProject.name.trim() || creatingProject}
              >
                {creatingProject ? (
                  <span className="btn-icon spinner"></span>
                ) : (
                  <>
                    <span className="btn-icon">🚀</span>
                    Create Project
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Board;
