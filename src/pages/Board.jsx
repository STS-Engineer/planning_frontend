// src/components/Dashboard/Board.jsx
import React, { useState } from 'react';
import List from './List';
import './Board.css';

const Board = () => {
  const [lists, setLists] = useState([
    {
      id: 1,
      title: '📝 To Do',
      color: '#ff6b6b',
      cards: [
        {
          id: 1,
          title: 'Design Homepage Layout',
          description: 'Create wireframes and mockups for the new homepage design',
          labels: [{ color: '#ff6b6b', text: 'Design' }],
          dueDate: '2024-12-15',
          priority: 'high',
          assignee: 'JD'
        },
        {
          id: 2,
          title: 'User Authentication Setup',
          description: 'Implement login and registration functionality',
          labels: [{ color: '#4ecdc4', text: 'Backend' }],
          dueDate: '2024-12-18',
          priority: 'medium',
          assignee: 'AS'
        },
        {
          id: 3,
          title: 'Document API Endpoints',
          description: 'Create documentation for all API endpoints',
          labels: [{ color: '#45b7d1', text: 'Documentation' }],
          dueDate: '2024-12-20',
          priority: 'low',
          assignee: 'RJ'
        }
      ]
    },
    {
      id: 2,
      title: '⚡ In Progress',
      color: '#ffd93d',
      cards: [
        {
          id: 4,
          title: 'Database Schema Design',
          description: 'Design and implement the database schema for the new application',
          labels: [{ color: '#45b7d1', text: 'Database' }],
          dueDate: '2024-12-12',
          priority: 'high',
          assignee: 'MB'
        },
        {
          id: 5,
          title: 'Frontend Component Library',
          description: 'Build reusable UI components for the frontend',
          labels: [{ color: '#6c5ce7', text: 'Frontend' }],
          dueDate: '2024-12-14',
          priority: 'medium',
          assignee: 'EW'
        }
      ]
    },
    {
      id: 3,
      title: '✅ Done',
      color: '#4ecdc4',
      cards: [
        {
          id: 6,
          title: 'Project Setup',
          description: 'Initialize project repository and set up development environment',
          labels: [{ color: '#96ceb4', text: 'Setup' }],
          dueDate: '2024-12-05',
          priority: 'low',
          assignee: 'JD'
        },
        {
          id: 7,
          title: 'User Research',
          description: 'Conduct user interviews and analyze feedback',
          labels: [{ color: '#ff9ff3', text: 'Research' }],
          dueDate: '2024-12-08',
          priority: 'medium',
          assignee: 'EW'
        }
      ]
    }
  ]);

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    listId: 1, // Default to To Do
    priority: 'medium'
  });

  const moveCard = (cardId, fromListId, toListId) => {
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
  };

  const addTask = () => {
    if (!newTask.title.trim()) return;

    const newCard = {
      id: Date.now(),
      title: newTask.title,
      description: newTask.description,
      labels: [{ color: getPriorityColor(newTask.priority), text: newTask.priority }],
      dueDate: '2024-12-31',
      priority: newTask.priority,
      assignee: 'JD'
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
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ff6b6b';
      case 'medium': return '#ffd93d';
      case 'low': return '#4ecdc4';
      default: return '#45b7d1';
    }
  };

  const getStats = () => {
    const totalTasks = lists.reduce((acc, list) => acc + list.cards.length, 0);
    const completedTasks = lists.find(list => list.id === 3)?.cards.length || 0;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    return { totalTasks, completedTasks, completionRate };
  };

  const stats = getStats();

  return (
    <div className="board">
      {/* Board Header */}
      <div className="board-header">
        <div className="board-info">
          <h2 className="board-title">Project Dashboard</h2>
          <p className="board-subtitle">Manage your team's tasks efficiently</p>
        </div>
        
        <div className="board-stats">
          <div className="stat">
            <div className="stat-number">{stats.totalTasks}</div>
            <div className="stat-label">Total Tasks</div>
          </div>
          <div className="stat">
            <div className="stat-number">{stats.completedTasks}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat">
            <div className="stat-number">{stats.completionRate}%</div>
            <div className="stat-label">Progress</div>
          </div>
        </div>

        <div className="board-actions">
          <button className="board-action-btn primary">
            <span className="action-icon">➕</span>
            New Task
          </button>
          <button className="board-action-btn">
            <span className="action-icon">👥</span>
            Team
          </button>
          <button className="board-action-btn">
            <span className="action-icon">⚡</span>
            Automation
          </button>
        </div>
      </div>

      {/* Quick Add Task */}
      <div className="quick-add-task">
        <div className="add-task-form">
          <input
            type="text"
            placeholder="What needs to be done?"
            value={newTask.title}
            onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
            className="task-input"
            onKeyPress={(e) => e.key === 'Enter' && addTask()}
          />
          <select 
            value={newTask.listId}
            onChange={(e) => setNewTask(prev => ({ ...prev, listId: parseInt(e.target.value) }))}
            className="list-select"
          >
            {lists.map(list => (
              <option key={list.id} value={list.id}>{list.title}</option>
            ))}
          </select>
          <select 
            value={newTask.priority}
            onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value }))}
            className="priority-select"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
          <button 
            onClick={addTask}
            className="add-task-btn"
            disabled={!newTask.title.trim()}
          >
            Add Task
          </button>
        </div>
      </div>

      {/* Lists Container */}
      <div className="lists-container">
        {lists.map(list => (
          <List
            key={list.id}
            list={list}
            onCardMove={moveCard}
          />
        ))}
      </div>
    </div>
  );
};

export default Board;