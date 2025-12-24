// src/components/Dashboard/Board.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/context/AuthContext';
import ApiService from '../services/api';
import List from './List';
import './Board.css';
import { toast } from 'react-toastify';
import ProjectStatistics from './ProjectStatistics';

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
    priority: 'medium',
    assigneeId: null,
    startDate: '',
    endDate: ''
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
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editTaskData, setEditTaskData] = useState({
    title: '',
    description: '',
    assigneeId: null,
    startDate: '',
    endDate: '',
    priority: 'medium'
  });

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

  const loadProjectMembers = async (projectId) => {
    try {
      const res = await ApiService.getProjectMembers(projectId);
      setMembers(res.members);
    } catch (error) {
      console.error('Failed to load project members', error);
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
    const todoTasks = tasks.filter(task => task.status === 'todo' || !task.status);
    const inProgressTasks = tasks.filter(task => task.status === 'in_progress');
    const doneTasks = tasks.filter(task => task.status === 'done');

    console.log('Task distribution:', {
      todo: todoTasks.length,
      in_progress: inProgressTasks.length,
      done: doneTasks.length
    });

    const formatDate = (dateString) => {
      if (!dateString) return null;
      try {
        return new Date(dateString).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });
      } catch {
        return dateString;
      }
    };

    // Helper to get assignee display
    const getAssigneeDisplay = (task) => {
      if (!task.assignee) return 'Unassigned';
      return task.assignee.name || task.assignee.email?.split('@')[0] || 'Unassigned';
    };

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
          dueDate: task['end-date'] ? formatDate(task['end-date']) : 'No due date',
          priority: 'medium',
          assignee: getAssigneeDisplay(task),
          assigneeId: task.assignee?.id || null,
          assigneeInfo: task.assignee,
          projectId: task.project_id,
          databaseId: task.task_id,
          status: task.status || 'todo',
          startDate: task['start-date'],
          endDate: task['end-date'],
          formattedStartDate: formatDate(task['start-date']),
          formattedEndDate: formatDate(task['end-date'])
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
          dueDate: task['end-date'] ? formatDate(task['end-date']) : 'No due date',
          priority: 'high',
          assignee: task.assignee?.name || task.assignee?.email?.split('@')[0] || 'Unassigned',
          assigneeId: task.assignee?.id || null,
          assigneeInfo: task.assignee,
          projectId: task.project_id,
          databaseId: task.task_id,
          status: task.status,
          startDate: task['start-date'],
          endDate: task['end-date'],
          formattedStartDate: formatDate(task['start-date']),
          formattedEndDate: formatDate(task['end-date'])
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
          dueDate: task['end-date'] ? formatDate(task['end-date']) : 'No due date',
          priority: 'low',
          assignee: task.assignee?.name || task.assignee?.email?.split('@')[0] || 'Unassigned',
          assigneeId: task.assignee?.id || null,
          assigneeInfo: task.assignee,
          projectId: task.project_id,
          databaseId: task.task_id,
          status: task.status,
          startDate: task['start-date'],
          endDate: task['end-date'],
          formattedStartDate: formatDate(task['start-date']),
          formattedEndDate: formatDate(task['end-date'])
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

    const listIdToStatus = {
      1: 'todo',
      2: 'in_progress',
      3: 'done'
    };

    const newStatus = listIdToStatus[toListId];

    console.log(`🎯 Moving task ${cardId} from list ${fromListId} to list ${toListId} (status: ${newStatus})`);

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
      await ApiService.updateTaskStatus(cardId, newStatus);
      console.log('✅ Task status updated successfully in database');

      toast.success('Task moved successfully!', {
        position: "top-center",
        autoClose: 1500,
      });
    } catch (error) {
      console.error('❌ Failed to update task status:', error);
      loadProjectTasks(selectedProject.project_id);

      toast.error('Failed to move task. Please try again.', {
        position: "top-center",
        autoClose: 3000,
      });
    }
  };

  const addTask = async () => {
    if (!newTask.title.trim() || !selectedProject) return;

    const listIdToStatus = {
      1: 'todo',
      2: 'in_progress',
      3: 'done'
    };

    const taskStatus = listIdToStatus[newTask.listId];
    console.log('task status', newTask);
    try {
      const response = await ApiService.createTask({
        task_name: newTask.title,
        task_description: newTask.description,
        project_id: selectedProject.project_id,
        status: taskStatus,
        assignee_id: newTask.assigneeId || null,
        start_date: newTask.startDate || null,
        end_date: newTask.endDate || null
      });

      // Get the task with assignee info
      const fullTask = await ApiService.getTask(response.task.task_id);

      const newCard = {
        id: response.task.task_id,
        title: response.task.task_name,
        description: response.task['task-description'],
        labels: [{ color: getPriorityColor(newTask.priority), text: newTask.priority }],
        dueDate: newTask.endDate || 'No due date',
        priority: newTask.priority,
        assignee: fullTask.task.assignee?.name ||
          fullTask.task.assignee?.email?.split('@')[0] ||
          'Unassigned',
        assigneeId: newTask.assigneeId,
        assigneeInfo: fullTask.task.assignee,
        projectId: selectedProject.project_id,
        databaseId: response.task.task_id,
        status: response.task.status,
        startDate: newTask.startDate,
        endDate: newTask.endDate,
        formattedStartDate: newTask.startDate ? new Date(newTask.startDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        }) : null,
        formattedEndDate: newTask.endDate ? new Date(newTask.endDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        }) : null
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
        priority: 'medium',
        assigneeId: null,
        startDate: '',
        endDate: ''
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

  const handleEditTask = (task) => {
    setEditingTask(task);
    setEditTaskData({
      title: task.title,
      description: task.description,
      assigneeId: task.assigneeId || null,
      startDate: task.startDate || '',
      endDate: task.endDate || '',
      priority: task.priority || 'medium'
    });
    setShowEditTaskModal(true);
  };

  const saveTaskEdits = async () => {
    if (!editTaskData.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    try {
      const updateData = {
        task_name: editTaskData.title,
        task_description: editTaskData.description,
        assignee_id: editTaskData.assigneeId || null,
        start_date: editTaskData.startDate || null,
        end_date: editTaskData.endDate || null
      };

      const response = await ApiService.updateTask(editingTask.databaseId, updateData);

      // Update the task in the UI
      const updatedCard = {
        ...editingTask,
        title: editTaskData.title,
        description: editTaskData.description,
        assignee: response.task.assignee?.name ||
          response.task.assignee?.email?.split('@')[0] ||
          'Unassigned',
        assigneeId: editTaskData.assigneeId,
        assigneeInfo: response.task.assignee,
        startDate: editTaskData.startDate,
        endDate: editTaskData.endDate,
        formattedStartDate: editTaskData.startDate ? new Date(editTaskData.startDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        }) : null,
        formattedEndDate: editTaskData.endDate ? new Date(editTaskData.endDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        }) : null
      };

      setLists(prev => prev.map(list => ({
        ...list,
        cards: list.cards.map(card =>
          card.id === editingTask.id ? updatedCard : card
        )
      })));

      setShowEditTaskModal(false);
      setEditingTask(null);
      toast.success('Task updated successfully!');
    } catch (error) {
      console.error('Failed to update task:', error);
      toast.error(error.message || 'Failed to update task');
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
                {user.role === 'ADMIN' ? '📊 KPI' : '📊 KPI'}
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
                  <>
                    {selectedProject ? (
                      <>
                        {/* TASK BOARD - Replaces the entire first row */}
                        <div className="project-tasks-full-width">
                          <div className="project-tasks-container">
                            <div className="tasks-header">
                              <h3 className="tasks-title">{selectedProject['project-name']} - Tasks</h3>
                              <button
                                className="btn-secondary back-btn"
                                onClick={() => {
                                  setSelectedProject(null);
                                  setLists(getInitialBoardStructure());
                                }}
                              >
                                ← Back to Projects
                              </button>
                            </div>

                            {isProjectMember() ? (
                              <>
                                {/* Quick Add Task */}
                                <div className="add-task-card">
                                  <div className="add-task-header">
                                    <span className="add-icon">➕</span>
                                    <h3>Quick Add Task</h3>
                                  </div>
                                  <div className="add-task-form">
                                    <input
                                      type="text"
                                      placeholder="Task title"
                                      value={newTask.title}
                                      onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                                      className="task-input"
                                      onKeyPress={(e) => e.key === 'Enter' && addTask()}
                                    />
                                    <textarea
                                      placeholder="Task description"
                                      value={newTask.description}
                                      onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                                      className="task-description"
                                      rows="2"
                                    />
                                    <div className="task-options-grid">
                                      <div className="option-group">
                                        <label>Status</label>
                                        <select
                                          value={newTask.listId}
                                          onChange={(e) => setNewTask(prev => ({ ...prev, listId: parseInt(e.target.value) }))}
                                          className="option-select"
                                        >
                                          {lists.map(list => (
                                            <option key={list.id} value={list.id}>{list.icon} {list.title}</option>
                                          ))}
                                        </select>
                                      </div>

                                      <div className="option-group">
                                        <label>Assign to</label>
                                        <select
                                          value={newTask.assigneeId || ''}
                                          onChange={(e) => {
                                            setNewTask(prev => ({
                                              ...prev,
                                              assigneeId: e.target.value
                                            }));
                                          }}
                                          className="option-select"
                                        >
                                          <option value="">Select Person</option>
                                          {members.map(member => (
                                            <option key={member.id} value={member.id}>
                                              {member.name}
                                            </option>
                                          ))}
                                        </select>
                                      </div>

                                      <div className="option-group">
                                        <label>Priority</label>
                                        <select
                                          value={newTask.priority}
                                          onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value }))}
                                          className="option-select"
                                        >
                                          <option value="low">🟢 Low</option>
                                          <option value="medium">🟡 Medium</option>
                                          <option value="high">🔴 High</option>
                                        </select>
                                      </div>

                                      <div className="option-group">
                                        <label>Start Date</label>
                                        <input
                                          type="date"
                                          value={newTask.startDate}
                                          onChange={(e) => setNewTask(prev => ({ ...prev, startDate: e.target.value }))}
                                          className="option-select"
                                        />
                                      </div>

                                      <div className="option-group">
                                        <label>End Date</label>
                                        <input
                                          type="date"
                                          value={newTask.endDate}
                                          onChange={(e) => setNewTask(prev => ({ ...prev, endDate: e.target.value }))}
                                          className="option-select"
                                        />
                                      </div>

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

                                {/* Task Lists */}
                                <div className="lists-container">
                                  {lists.map(list => (
                                    <List
                                      key={list.id}
                                      list={list}
                                      onCardMove={moveCard}
                                      onDeleteTask={deleteTask}
                                      onEditTask={handleEditTask}
                                    />
                                  ))}
                                </div>
                              </>
                            ) : (
                              <div className="welcome-empty-state">
                                <div className="empty-content">
                                  <div className="empty-illustration">🔒</div>
                                  <h2>Access Restricted</h2>
                                  <p>You don't have access to this project's tasks</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* OTHER PROJECTS - Display remaining projects below */}
                        {projects
                          .filter(p => p.project_id !== selectedProject.project_id)
                          .map(project => (
                            <div key={project.project_id} className="project-wrapper">
                              <div
                                className="project-card"
                                onClick={async () => {
                                  setSelectedProject(project);
                                  await loadProjectMembers(project.project_id);
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
                                            await ApiService.deleteProject(project.project_id);
                                            setProjects(prev => prev.filter(p => p.project_id !== project.project_id));
                                            toast.success("Project deleted successfully!");
                                          } catch (error) {
                                            console.error(error);
                                            toast.error('Failed to delete project');
                                          }
                                        }
                                      }}
                                    >
                                      🗑️
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                      </>
                    ) : (
                      /* ALL PROJECTS - No selection */
                      projects.map(project => (
                        <div key={project.project_id} className="project-wrapper">
                          <div
                            className="project-card"
                            onClick={async () => {
                              setSelectedProject(project);
                              await loadProjectMembers(project.project_id);
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
                                        await ApiService.deleteProject(project.project_id);
                                        setProjects(prev => prev.filter(p => p.project_id !== project.project_id));
                                        if (selectedProject?.project_id === project.project_id) {
                                          setSelectedProject(null);
                                          setLists(getInitialBoardStructure());
                                        }
                                        toast.success("Project deleted successfully!");
                                      } catch (error) {
                                        console.error(error);
                                        toast.error('Failed to delete project');
                                      }
                                    }
                                  }}
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                ) : (
                  <div className="empty-projects">
                    <div className="empty-icon">📁</div>
                    <h3>No projects yet</h3>
                    <p>Create your first project to get started</p>
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
                )}
              </div>
            </div>
          </>
        )}

        {activeView === 'stats' && (
          <ProjectStatistics
            selectedProject={selectedProject}
            lists={lists}
            projects={projects}
          />
        )}
      </div>

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

      {/* Edit Task Modal */}
      {showEditTaskModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Task</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowEditTaskModal(false);
                  setEditingTask(null);
                }}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Task Title *</label>
                <input
                  type="text"
                  value={editTaskData.title}
                  onChange={(e) => setEditTaskData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter task title"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={editTaskData.description}
                  onChange={(e) => setEditTaskData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Task description"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Assign To</label>
                <select
                  value={editTaskData.assigneeId || ''}
                  onChange={(e) => setEditTaskData(prev => ({
                    ...prev,
                    assigneeId: e.target.value ? parseInt(e.target.value) : null
                  }))}
                  className="option-select"
                >
                  <option value="">Unassigned</option>
                  {members.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={editTaskData.startDate}
                    onChange={(e) => setEditTaskData(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={editTaskData.endDate}
                    onChange={(e) => setEditTaskData(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowEditTaskModal(false);
                  setEditingTask(null);
                }}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={saveTaskEdits}
                disabled={!editTaskData.title.trim()}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Board;
