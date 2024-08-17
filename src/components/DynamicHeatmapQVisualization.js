import React, { useEffect, useRef, useState } from 'react';
import { BOARD_SIZE, GRID_SIZE, DIRECTIONS } from '../Utils/constants';

const DynamicHeatmapQVisualization = ({ agent, gameState }) => {
  const canvasRef = useRef(null);
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    if (!agent || !gameState || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const cellSize = GRID_SIZE;

    ctx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);

    let globalMaxQValue = -Infinity;
    let globalMinQValue = Infinity;

    // Calculate Q-values and best actions for each cell
    const cellData = [];
    for (let y = 0; y < BOARD_SIZE; y += cellSize) {
      for (let x = 0; x < BOARD_SIZE; x += cellSize) {
        let bestOverallAction = null;
        let maxOverallQ = -Infinity;

        // Try all four directions as the current direction
        Object.values(DIRECTIONS).forEach(currentDirection => {
          const simulatedState = {
            snake: [{ x, y }, ...gameState.snake.slice(1)],
            food: gameState.food,
            direction: currentDirection
          };
          const stateIndex = agent.mapStateToIndex(simulatedState);
          const qValues = agent.Q[stateIndex] || [0, 0, 0, 0];
          const maxQ = Math.max(...qValues);
          const bestActionIndex = qValues.indexOf(maxQ);

          if (maxQ > maxOverallQ) {
            maxOverallQ = maxQ;
            bestOverallAction = agent.actions[bestActionIndex];
          }
        });

        cellData.push({ x, y, maxQ: maxOverallQ, bestAction: bestOverallAction });

        if (maxOverallQ > globalMaxQValue) globalMaxQValue = maxOverallQ;
        if (maxOverallQ < globalMinQValue) globalMinQValue = maxOverallQ;
      }
    }

    // Draw heatmap and arrows
    cellData.forEach(({ x, y, maxQ, bestAction }) => {
      // Draw cell color
      const intensity = (globalMaxQValue > globalMinQValue) 
        ? (maxQ - globalMinQValue) / (globalMaxQValue - globalMinQValue) 
        : 0.5;
      const r = Math.floor(intensity * 255);
      const b = Math.floor((1 - intensity) * 255);
      ctx.fillStyle = `rgb(${r}, 0, ${b}, 0.5)`;
      ctx.fillRect(x, y, cellSize, cellSize);

      // Draw arrow for best action
      drawArrow(ctx, x + cellSize / 2, y + cellSize / 2, bestAction, cellSize / 2);
    });

    // Draw the actual snake
    gameState.snake.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? 'darkgreen' : 'green';
      ctx.fillRect(segment.x, segment.y, cellSize, cellSize);
    });

    // Draw the food
    ctx.fillStyle = 'red';
    ctx.fillRect(gameState.food.x, gameState.food.y, cellSize, cellSize);

    // Set debug info for the actual snake head position
    const actualHeadState = {
      snake: gameState.snake,
      food: gameState.food,
      direction: gameState.direction // Assuming direction is part of gameState
    };
    const actualHeadStateIndex = agent.mapStateToIndex(actualHeadState);
    const actualHeadQValues = agent.Q[actualHeadStateIndex] || [0, 0, 0, 0];
    setDebugInfo({ 
      stateIndex: actualHeadStateIndex, 
      qValues: actualHeadQValues,
      bestAction: agent.actions[actualHeadQValues.indexOf(Math.max(...actualHeadQValues))]
    });

  }, [agent, gameState]);

  // Helper function to draw an arrow
  const drawArrow = (ctx, fromX, fromY, direction, length) => {
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    let toX = fromX;
    let toY = fromY;
    switch (direction) {
      case DIRECTIONS.UP: toY -= length; break;
      case DIRECTIONS.DOWN: toY += length; break;
      case DIRECTIONS.LEFT: toX -= length; break;
      case DIRECTIONS.RIGHT: toX += length; break;
    }
    ctx.lineTo(toX, toY);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw arrowhead
    const headlen = 5;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.fillStyle = 'white';
    ctx.fill();
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={BOARD_SIZE}
        height={BOARD_SIZE}
        style={{ border: '1px solid black' }}
      />
      <div>
        <h3>Debug Info (Snake's current state):</h3>
        <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
      </div>
    </div>
  );
};

export default DynamicHeatmapQVisualization;