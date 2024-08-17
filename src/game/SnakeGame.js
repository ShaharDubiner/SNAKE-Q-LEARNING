import { GRID_SIZE, BOARD_SIZE, DIRECTIONS, BOARD_LIMIT_MIN, BOARD_LIMIT_MAX } from '../Utils/constants';

export class SnakeGame {
  constructor() {
    this.reset();
  }

  reset() {
    this.snake = [{ x: 200, y: 200 }];
    this.food = this.generateFood();
    this.direction = DIRECTIONS.RIGHT;
    this.score = 0;
    this.gameOver = false;
    this.steps = 0;
    this.maxSteps = 8 * ((BOARD_SIZE / GRID_SIZE) ** 2);
  }

  generateFood() {
    let x, y;
    do {
      x = Math.floor(Math.random() * ((BOARD_SIZE - GRID_SIZE) / GRID_SIZE)) * GRID_SIZE;
      y = Math.floor(Math.random() * ((BOARD_SIZE - GRID_SIZE) / GRID_SIZE)) * GRID_SIZE;
    } while (this.isOnSnake(x, y));
    return { x, y };
  }

  isOnSnake(x, y) {
    return this.snake.some(segment => segment.x === x && segment.y === y);
  }

  move() {
    if (this.gameOver) return;
  
    this.steps++;
  
    const head = { ...this.snake[0] };
  
    switch (this.direction) {
      case DIRECTIONS.UP: head.y -= GRID_SIZE; break;
      case DIRECTIONS.DOWN: head.y += GRID_SIZE; break;
      case DIRECTIONS.LEFT: head.x -= GRID_SIZE; break;
      case DIRECTIONS.RIGHT: head.x += GRID_SIZE; break;
    }
  
    // Check for wall collision
    if (head.x < 0 || head.x >= BOARD_SIZE || 
        head.y < 0 || head.y >= BOARD_SIZE) {
      this.gameOver = true;
      return;
    }
  
    // Check for self-collision
    if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
      this.gameOver = true;
      return;
    }
  
    this.snake.unshift(head);
  
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score += 1;
      this.food = this.generateFood();
      this.steps = 0;  // Reset steps when food is eaten
    } else {
      this.snake.pop();
    }
  
    if (this.steps > this.maxSteps) {
      this.gameOver = true;
    }
  }

  getState() {
    return {
      snake: this.snake,
      food: this.food,
      score: this.score,
      gameOver: this.gameOver
    };
  }

  setDirection(action) {
    // Prevent 180-degree turns
    if (
      (this.direction === DIRECTIONS.UP && action === DIRECTIONS.DOWN) ||
      (this.direction === DIRECTIONS.DOWN && action === DIRECTIONS.UP) ||
      (this.direction === DIRECTIONS.LEFT && action === DIRECTIONS.RIGHT) ||
      (this.direction === DIRECTIONS.RIGHT && action === DIRECTIONS.LEFT)
    ) {
      return;
    }
    this.direction = action;
  }
}