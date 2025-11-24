// src/components/Dashboard/Card.jsx
import React from 'react';
import './Card.css';

const Card = ({ card, listId }) => {
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

  return (
    <div 
      className="card"
      draggable="true"
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
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
      
      <div className="card-title">{card.title}</div>
      
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