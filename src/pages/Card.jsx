// src/components/Dashboard/Card.jsx
import React from 'react';
import './Card.css';

const Card = ({ card, onDeleteTask, listId }) => {
  const handleDragStart = (e) => {
    e.dataTransfer.setData('cardId', card.id);
    e.dataTransfer.setData('fromListId', listId);
    e.currentTarget.classList.add('dragging');
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('dragging');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    });
  };

  // Helper function to get and format the email
  const getFormattedAssigneeName = () => {
    let email = '';
    
    // Try different possible locations for email
    if (card.email) email = card.email;
    else if (card.assigneeInfo?.email) email = card.assigneeInfo.email;
    else if (card.assignee?.email) email = card.assignee.email;
    else if (typeof card.assignee === 'string' && card.assignee.includes('@')) {
      email = card.assignee;
    } else {
      // If no email found, return the display name or 'Unassigned'
      return card.assignee || 'Unassigned';
    }

    // Split by "@" and take the part before it
    const usernamePart = email.split('@')[0];
    
    // Replace dots with spaces and capitalize first letter of each word
    const formattedName = usernamePart
      .replace(/\./g, ' ') // Replace all dots with spaces
      .replace(/\b\w/g, char => char.toUpperCase()) // Capitalize first letter of each word
      .trim();

    return formattedName;
  };

  const formattedAssigneeName = getFormattedAssigneeName();

  return (
    <div
      className="card"
      draggable="true"
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="card-top-section">
        {card.labels && card.labels.length > 0 && (
          <div className="card-labels">
            {card.labels.map((label, index) => (
              <span
                key={index}
                className="card-label"
                style={{ backgroundColor: label.color }}
              >
                {label.text}
              </span>
            ))}
          </div>
        )}

        {formattedAssigneeName && formattedAssigneeName !== 'Unassigned' && (
          <div className="card-assignee-name">
            <span className="assignee-icon">👤</span>
            <span className="assignee-name-text">{formattedAssigneeName}</span>
          </div>
        )}
      </div>

      <div className="card-header">
        <h4 className="card-title">{card.title}</h4>
        <button
          className="card-delete-btn"
          onClick={() => onDeleteTask(card.databaseId)}
          title="Delete task"
        >
          🗑️
        </button>
      </div>
      
      {card.description && (
        <div className="card-description">
          {card.description}
        </div>
      )}

      <div className="card-footer">
        {card.dueDate && (
          <div className="card-due-date">
            <span className="due-date-icon">📅</span>
            {formatDate(card.dueDate)}
          </div>
        )}

        <div className="card-actions">
          <button className="card-action-btn">💬</button>
          <button className="card-action-btn">📎</button>
        </div>
      </div>
    </div>
  );
};

export default Card;
