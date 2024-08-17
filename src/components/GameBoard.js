import React from 'react';
import { BOARD_SIZE, GRID_SIZE } from '../Utils/constants';

function GameBoard({ gameState }) {
  if (!gameState) return null;

  return (
    <div
      style={{
        width: BOARD_SIZE,
        height: BOARD_SIZE,
        border: '1px solid black',
        position: 'relative',
      }}
    >
      {gameState.snake.map((segment, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            left: segment.x,
            top: segment.y,
            width: GRID_SIZE,
            height: GRID_SIZE,
            backgroundColor: index === 0 ? 'darkgreen' : 'green',
            border: '1px solid black',
          }}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          left: gameState.food.x,
          top: gameState.food.y,
          width: GRID_SIZE,
          height: GRID_SIZE,
          backgroundColor: 'red',
          border: '1px solid black',
        }}
      />
    </div>
  );
}

export default GameBoard;