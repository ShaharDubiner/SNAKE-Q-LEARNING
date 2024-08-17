import { DIRECTIONS, BOARD_SIZE, GRID_SIZE, BOARD_LIMIT_MIN, BOARD_LIMIT_MAX } from '../Utils/constants';

export class QAgent {
    constructor(actions, Ne, LPC, gamma) {
      this.actions = actions;
      this.Ne = Ne;
      this.LPC = LPC;
      this.gamma = gamma;
      this.resetQTable();
      
      this.epsilon = 1.0;
      this.epsilon_decay = 0.995;
      this.epsilon_min = 0.01;
    }
  
    reset() {
      this.points = 0;
      this.s = null;
      this.a = null;
    }
  
    resetQTable() {
      this.Q = this.initializeQ();
      this.N = this.initializeQ();
    }
  
    initializeQ() {
      const stateSpace = 3 * 3 * 8 * 2 * 2 * 2 * 2 * 3;
      const Q = {};
      for (let i = 0; i < stateSpace; i++) {
        Q[i] = Array(this.actions.length).fill(0);
      }
      return Q;
    }
  
    mapStateToIndex(state) {
        const { snake, food } = state;
        const [headX, headY] = [snake[0].x, snake[0].y];
        const [foodX, foodY] = [food.x, food.y];
        
        // Relative food position
        const foodDx = Math.sign(foodX - headX);  // -1 (left), 0, or 1 (right)
        const foodDy = Math.sign(foodY - headY);  // -1 (up), 0, or 1 (down)
        
        // Danger detection (simplified for 4 directions)
        const dangerUp = this.isDangerousMove(state, DIRECTIONS.UP) ? 1 : 0;
        const dangerDown = this.isDangerousMove(state, DIRECTIONS.DOWN) ? 1 : 0;
        const dangerLeft = this.isDangerousMove(state, DIRECTIONS.LEFT) ? 1 : 0;
        const dangerRight = this.isDangerousMove(state, DIRECTIONS.RIGHT) ? 1 : 0;
        
        // Snake length category (you can adjust these thresholds)
        const lengthCategory = this.getSnakeLengthCategory(snake.length);
        
        // Combine all factors into a single index
        return (
            (foodDx + 1) * 3 * 2 * 2 * 2 * 2 * 3 +
            (foodDy + 1) * 2 * 2 * 2 * 2 * 3 +
            dangerUp * 2 * 2 * 2 * 3 +
            dangerDown * 2 * 2 * 3 +
            dangerLeft * 2 * 3 +
            dangerRight * 3 +
            lengthCategory
        );
    }

    isDangerousMove(state, direction) {
        const { snake } = state;
        const [headX, headY] = [snake[0].x, snake[0].y];
        let newX = headX;
        let newY = headY;

        switch (direction) {
            case DIRECTIONS.UP: newY -= GRID_SIZE; break;
            case DIRECTIONS.DOWN: newY += GRID_SIZE; break;
            case DIRECTIONS.LEFT: newX -= GRID_SIZE; break;
            case DIRECTIONS.RIGHT: newX += GRID_SIZE; break;
        }

        // Check for wall collision
        if (newX < 0 || newX >= BOARD_SIZE || newY < 0 || newY >= BOARD_SIZE) {
            return true;
        }

        // Check for self collision
        return snake.some((segment, index) => 
            index !== 0 && segment.x === newX && segment.y === newY
        );
    }
    
    getFoodDirection(headX, headY, foodX, foodY) {
      const dx = foodX - headX;
      const dy = foodY - headY;
      if (dx === 0 && dy < 0) return 0; // Up
      if (dx === 0 && dy > 0) return 1; // Down
      if (dx < 0 && dy === 0) return 2; // Left
      if (dx > 0 && dy === 0) return 3; // Right
      if (dx < 0 && dy < 0) return 4; // Up-Left
      if (dx < 0 && dy > 0) return 5; // Down-Left
      if (dx > 0 && dy < 0) return 6; // Up-Right
      if (dx > 0 && dy > 0) return 7; // Down-Right
    }
    
    isDangerousMove(state, direction) {
      const { snake } = state;
      const [headX, headY] = [snake[0].x, snake[0].y];
      let newX = headX;
      let newY = headY;
    
      switch (direction) {
        case DIRECTIONS.UP: newY -= GRID_SIZE; break;
        case DIRECTIONS.DOWN: newY += GRID_SIZE; break;
        case DIRECTIONS.LEFT: newX -= GRID_SIZE; break;
        case DIRECTIONS.RIGHT: newX += GRID_SIZE; break;
      }
    
      if (newX < 0 || newX >= BOARD_SIZE || newY < 0 || newY >= BOARD_SIZE) {
        return true;
      }
    
      return snake.slice(1).some(segment => segment.x === newX && segment.y === newY);
    }
    
    getSnakeLengthCategory(length) {
      if (length < 5) return 0; // Short
      if (length < 10) return 1; // Medium
      return 2; // Long
    }
  
    getStateString(state) {
      return this.mapStateToIndex(state).toString();
    }
  
    helperFunc(state) {
      return {
        [DIRECTIONS.UP]: this.isDangerousMove(state, DIRECTIONS.UP),
        [DIRECTIONS.DOWN]: this.isDangerousMove(state, DIRECTIONS.DOWN),
        [DIRECTIONS.LEFT]: this.isDangerousMove(state, DIRECTIONS.LEFT),
        [DIRECTIONS.RIGHT]: this.isDangerousMove(state, DIRECTIONS.RIGHT)
      };
    }
  
    computeReward(state, points, dead) {
      if (dead) {
        return -10;
      } else if (points > this.points) {
        return 10;
      } else {
        return -0.01;  // Small negative reward for each move to encourage efficiency
      }
    }
  
    agentAction(state, epsilon) {
        const stateIndex = this.mapStateToIndex(state);
        
        // Always explore with probability epsilon
        if (Math.random() < epsilon) {
            return this.actions[Math.floor(Math.random() * this.actions.length)];
        }
        
        // Otherwise, choose the action with the highest Q-value (with random tie-breaking)
        const qValues = this.Q[stateIndex];
        const maxQValue = Math.max(...qValues);
        const bestActions = this.actions.filter((_, index) => qValues[index] === maxQValue);
        return bestActions[Math.floor(Math.random() * bestActions.length)];
    }

    train(game, episodes = 5000) {
      this.resetQTable(); // Reset Q-table at the start of training
      
      let totalPoints = 0;
      let maxPoints = -Infinity;
      let minPoints = Infinity;
      let gameScores = [];
  
      for (let i = 0; i < episodes; i++) {
        game.reset();
        this.reset();
        let state = game.getState();
        let stateString = this.getStateString(state);
        
        while (!game.gameOver) {
          const action = this.agentAction(state, this.epsilon);
          game.setDirection(action);
          game.move();
          
          const nextState = game.getState();
          const nextStateString = this.getStateString(nextState);
          
          const reward = this.computeReward(nextState, nextState.score, game.gameOver);
          
          // Q-learning update
          const lr = this.LPC / (this.LPC + this.N[stateString][action]);
          this.N[stateString][action] += 1;
          
          const oldQValue = this.Q[stateString][action];
          const maxNextQ = Math.max(...this.Q[nextStateString]);
          
          this.Q[stateString][action] = oldQValue + lr * (reward + this.gamma * maxNextQ - oldQValue);
          
          state = nextState;
          stateString = nextStateString;
          this.points = nextState.score;
        }
  
        // Epsilon decay
        this.epsilon = Math.max(this.epsilon_min, this.epsilon * this.epsilon_decay);
        
        // Collect statistics
        totalPoints += game.score;
        maxPoints = Math.max(maxPoints, game.score);
        minPoints = Math.min(minPoints, game.score);
        gameScores.push(game.score);
  
        if ((i + 1) % 100 === 0) {
          const averagePoints = totalPoints / 100;
          console.log(`Played games: ${i - 98} - ${i + 1}`);
          console.log(`Calculated points (Average: ${averagePoints.toFixed(2)}, Max points: ${maxPoints}, Min points: ${minPoints})`);
          console.log(`Current epsilon: ${this.epsilon.toFixed(4)}`);
          
          // Reset statistics for the next group of 100 games
          totalPoints = 0;
          maxPoints = -Infinity;
          minPoints = Infinity;
          gameScores = [];
        }
      }
    }
  
    saveModel() {
      localStorage.setItem('QModel', JSON.stringify(this.Q));
    }
  
    loadModel() {
      const savedModel = localStorage.getItem('QModel');
      if (savedModel) {
        this.Q = JSON.parse(savedModel);
        console.log("Model loaded successfully");
      } else {
        this.resetQTable();
        console.log("No saved model found, initialized new Q-table");
      }
    }
}