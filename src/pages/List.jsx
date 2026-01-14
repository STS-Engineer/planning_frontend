// src/components/Dashboard/List.jsx
import React, { useState } from 'react';
import Card from './Card';
import './List.css';

const List = ({ list, onDeleteTask, onCardMove, onEditTask }) => { // Added onEditTask
  const [newCardTitle, setNewCardTitle] = useState('');
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const addCard = () => {
    if (!newCardTitle.trim()) return;

    const newCard = {
      id: Date.now(),
      title: newCardTitle,
      description: '',
      labels: [],
      dueDate: null
    };

    // In a real app, you would update the state here through a callback
    console.log('Adding card:', newCard);
    
    setNewCardTitle('');
    setIsAddingCard(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const cardId = parseInt(e.dataTransfer.getData('cardId'));
    const fromListId = parseInt(e.dataTransfer.getData('fromListId'));
    
    if (fromListId !== list.id) {
      onCardMove(cardId, fromListId, list.id);
    }
  };

  return (
    <div 
      className={`list ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="list-header">
        <h3 className="list-title">{list.title}</h3>
        <span className="card-count">({list.cards.length})</span>
        <button className="list-menu-btn">⋯</button>
      </div>

      {/* Scrollable cards container */}
      <div className="cards-scroll-container">
        <div className="cards-container">
          {list.cards.map(card => (
            <Card
              key={card.id}
              card={card}
              listId={list.id}
              onDeleteTask={onDeleteTask}
              onEditTask={onEditTask} // Pass edit function
            />
          ))}
          
          {/* Empty state when no cards */}
          {list.cards.length === 0 && (
            <div className="empty-list-state">
              <p>No tasks here yet</p>
              <span className="empty-icon">📝</span>
            </div>
          )}
        </div>
      </div>

      {isAddingCard ? (
        <div className="add-card-form">
          <input
            type="text"
            placeholder="Saisissez le titre de cette carte..."
            value={newCardTitle}
            onChange={(e) => setNewCardTitle(e.target.value)}
            autoFocus
            className="card-input"
          />
          <div className="add-card-actions">
            <button 
              className="add-card-submit"
              onClick={addCard}
            >
              Ajouter une carte
            </button>
            <button 
              className="cancel-add-card"
              onClick={() => setIsAddingCard(false)}
            >
              ×
            </button>
          </div>
        </div>
      ) : (
        <button 
          className="add-card-btn"
          onClick={() => setIsAddingCard(true)}
        >
          <span className="add-card-icon">+</span>
          Ajouter une carte
        </button>
      )}
    </div>
  );
};

export default List;
