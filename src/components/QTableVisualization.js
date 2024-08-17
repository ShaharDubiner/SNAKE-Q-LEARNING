import React from 'react';
import { GRID_SIZE, BOARD_SIZE } from '../Utils/constants';

const RELATIVE_DIRECTIONS = {
  STRAIGHT: 0,
  LEFT: 1,
  RIGHT: 2
};

const QTableVisualization = ({ agent }) => {
  if (!agent || !agent.Q) return null;

  const sampleStates = [
    { name: 'Food Ahead', state: generateState('ahead', null) },
    { name: 'Food Left', state: generateState('left', null) },
    { name: 'Food Right', state: generateState('right', null) },
    { name: 'Danger Ahead', state: generateState(null, 'ahead') },
    { name: 'Danger Left', state: generateState(null, 'left') },
    { name: 'Danger Right', state: generateState(null, 'right') },
  ];

  function generateState(foodPosition, dangerPosition) {
    const state = {
      snake: [{ x: GRID_SIZE * 5, y: GRID_SIZE * 5 }],
      food: { x: GRID_SIZE * 5, y: GRID_SIZE * 5 },
      // We don't need to specify a direction here as it's relative
    };

    // Set food position relative to snake
    if (foodPosition) {
      switch (foodPosition) {
        case 'ahead': state.food.y -= GRID_SIZE * 3; break; // 3 cells ahead
        case 'left': state.food.x -= GRID_SIZE * 3; break;  // 3 cells to the left
        case 'right': state.food.x += GRID_SIZE * 3; break; // 3 cells to the right
      }
    }

    // Set danger position relative to snake
    if (dangerPosition) {
      switch (dangerPosition) {
        case 'ahead': state.snake.push({ x: state.snake[0].x, y: state.snake[0].y - GRID_SIZE }); break;
        case 'left': state.snake.push({ x: state.snake[0].x - GRID_SIZE, y: state.snake[0].y }); break;
        case 'right': state.snake.push({ x: state.snake[0].x + GRID_SIZE, y: state.snake[0].y }); break;
      }
    }

    return agent.mapStateToIndex(state);
  }

  const getColor = (value, minValue, maxValue) => {
    if (value === undefined) return 'lightgray';
    const normalizedValue = (value - minValue) / (maxValue - minValue);
    const hue = normalizedValue * 120; // 0 for red (low value), 120 for green (high value)
    return `hsl(${hue}, 100%, 50%)`;
  };

  // Calculate min and max Q-values only for the displayed states
  const displayedQValues = sampleStates.flatMap(sampleState => 
    Object.values(RELATIVE_DIRECTIONS).map(direction => 
      agent.Q[sampleState.state] ? agent.Q[sampleState.state][direction] : undefined
    ).filter(value => value !== undefined)
  );
  const minQValue = Math.min(...displayedQValues);
  const maxQValue = Math.max(...displayedQValues);

  return (
    <div className="q-table-visualization">
      <h3>Q-Table Visualization</h3>
      <table>
        <thead>
          <tr>
            <th>State</th>
            <th>Straight</th>
            <th>Left</th>
            <th>Right</th>
          </tr>
        </thead>
        <tbody>
          {sampleStates.map((sampleState) => (
            <tr key={sampleState.name}>
              <td>{sampleState.name}</td>
              {Object.values(RELATIVE_DIRECTIONS).map((direction) => {
                const qValue = agent.Q[sampleState.state] ? agent.Q[sampleState.state][direction] : undefined;
                return (
                  <td
                    key={direction}
                    style={{
                      backgroundColor: getColor(qValue, minQValue, maxQValue),
                      width: '50px',
                      height: '50px',
                      textAlign: 'center',
                    }}
                  >
                    {qValue !== undefined ? qValue.toFixed(2) : 'N/A'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default QTableVisualization;