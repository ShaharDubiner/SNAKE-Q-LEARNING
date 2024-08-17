import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameBoard from './components/GameBoard';
import { SnakeGame } from './game/SnakeGame';
import { QAgent } from './game/QAgent';
import { DIRECTIONS } from './Utils/constants';

function App() {
  const [game, setGame] = useState(null);
  const [agent, setAgent] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [isTraining, setIsTraining] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trainingLog, setTrainingLog] = useState([]);
  const [testingScores, setTestingScores] = useState([]);
  const [gameSpeed, setGameSpeed] = useState(55); // Start at middle value
  const speedRef = useRef(55);
  const gameLoopRef = useRef(null);

  // Training parameters
  const [episodes, setEpisodes] = useState(1000);
  const [Ne, setNe] = useState(40);
  const [LPC, setLPC] = useState(40);
  const [gamma, setGamma] = useState(0.7);

  useEffect(() => {
    localStorage.removeItem('QModel');
    const newGame = new SnakeGame();
    const newAgent = new QAgent(
      [DIRECTIONS.UP, DIRECTIONS.DOWN, DIRECTIONS.LEFT, DIRECTIONS.RIGHT],
      Ne,
      LPC,
      gamma
    );
    newAgent.resetQTable();
    setGame(newGame);
    setAgent(newAgent);
    setGameState(newGame.getState());
  }, [Ne, LPC, gamma]);

  useEffect(() => {
    speedRef.current = gameSpeed;
  }, [gameSpeed]);

  const handleTrain = useCallback(() => {
    if (!game || !agent) return;
    setIsTraining(true);
    setTrainingLog([]);
    const originalLog = console.log;
    console.log = (message) => {
      setTrainingLog(prev => [...prev, message]);
      originalLog(message);
    };
    agent.train(game, episodes);
    agent.saveModel();
    setIsTraining(false);
    setGameState(game.getState());
    console.log = originalLog;
  }, [game, agent, episodes]);

  const handleTest = useCallback(() => {
    if (!game || !agent) return;
    agent.loadModel();
    const scores = [];
    for (let i = 0; i < 100; i++) {
      game.reset();
      let state = game.getState();
      while (!game.gameOver) {
        const action = agent.agentAction(state, 0);
        game.setDirection(action);
        game.move();
        state = game.getState();
      }
      scores.push(game.score);
    }
    setTestingScores(scores);
  }, [game, agent]);

  const gameLoop = useCallback(() => {
    if (!game || !agent) return;
    if (game.gameOver) {
      setIsPlaying(false);
      return;
    }
    const state = game.getState();
    const action = agent.agentAction(state, 0);
    game.setDirection(action);
    game.move();
    setGameState({...game.getState()});
    gameLoopRef.current = setTimeout(gameLoop, 110 - speedRef.current);
  }, [game, agent]);

  const handlePlay = useCallback(() => {
    if (!game || !agent) return;
    setIsPlaying(true);
    agent.loadModel();
    game.reset();
    setGameState(game.getState());
    gameLoopRef.current = setTimeout(gameLoop, 110 - speedRef.current);
  }, [game, agent, gameLoop]);

  const handleStop = useCallback(() => {
    if (gameLoopRef.current) {
      clearTimeout(gameLoopRef.current);
    }
    setIsPlaying(false);
  }, []);

  const handleReset = useCallback(() => {
    localStorage.removeItem('QModel');
    const newAgent = new QAgent(
      [DIRECTIONS.UP, DIRECTIONS.DOWN, DIRECTIONS.LEFT, DIRECTIONS.RIGHT],
      Ne,
      LPC,
      gamma
    );
    newAgent.resetQTable();
    setAgent(newAgent);
    setTrainingLog([]);
    setTestingScores([]);
  }, [Ne, LPC, gamma]);

  return (
    <div className="App" style={{ display: 'flex', padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ flex: '0 0 auto', marginRight: '20px' }}>
        <h1>Q-learning Snake Game</h1>
        <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>
          Score: {gameState?.score || 0}
        </div>
        <GameBoard gameState={gameState} />
      </div>
      <div style={{ flex: '1 1 auto' }}>
        <h3>Training Parameters</h3>
        <div style={{ marginBottom: '20px' }}>
          <label>
            Episodes: 
            <input 
              type="range" 
              min="100" 
              max="10000" 
              step="100"
              value={episodes} 
              onChange={(e) => setEpisodes(Number(e.target.value))} 
            />
            {episodes}
          </label>
          <p style={{ fontSize: '0.9em', marginTop: '5px' }}>
            Number of games the agent will play during training. More episodes generally lead to better performance, but take longer to train. Typical range: 1,000 to 10,000.
          </p>
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label>
            Ne: 
            <input 
              type="number" 
              value={Ne} 
              onChange={(e) => setNe(Number(e.target.value))} 
            />
          </label>
          <p style={{ fontSize: '0.9em', marginTop: '5px' }}>
            Ne (Number of Explorations) controls the exploration rate. Higher values encourage more exploration of new states. Typical range: 20 to 100.
          </p>
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label>
            LPC: 
            <input 
              type="number" 
              value={LPC} 
              onChange={(e) => setLPC(Number(e.target.value))} 
            />
          </label>
          <p style={{ fontSize: '0.9em', marginTop: '5px' }}>
            LPC (Living Penalty Coefficient) is a small penalty for each move to encourage efficiency. Lower values make the snake more aggressive in seeking food. Typical range: 0 to 50.
          </p>
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label>
            Gamma: 
            <input 
              type="number" 
              step="0.1" 
              min="0" 
              max="1" 
              value={gamma} 
              onChange={(e) => setGamma(Number(e.target.value))} 
            />
          </label>
          <p style={{ fontSize: '0.9em', marginTop: '5px' }}>
            Gamma is the discount factor for future rewards. Higher values make the agent consider long-term rewards more. Typical range: 0.5 to 0.99.
          </p>
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label>
            Game Speed: 
            <input 
              type="range" 
              min="10" 
              max="100" 
              value={gameSpeed} 
              onChange={(e) => setGameSpeed(Number(e.target.value))} 
            />
            {gameSpeed}
          </label>
          <p style={{ fontSize: '0.9em', marginTop: '5px' }}>
            Controls the speed of the game during play. Higher values make the snake move faster.
          </p>
        </div>
        <div>
          <button onClick={handleReset} disabled={isPlaying || isTraining}>
            Reset Model
          </button>
          <button onClick={handleTrain} disabled={isPlaying || isTraining}>
            {isTraining ? 'Training...' : 'Train'}
          </button>
          <button onClick={isPlaying ? handleStop : handlePlay} disabled={isTraining}>
            {isPlaying ? 'Stop' : 'Play Game'}
          </button>
        </div>
        {trainingLog.length > 0 && (
          <div>
            <h2>Training Log</h2>
            <pre style={{ maxHeight: '200px', overflowY: 'auto' }}>{trainingLog.join('\n')}</pre>
          </div>
        )}
        {testingScores.length > 0 && (
          <div>
            <h2>Testing Results</h2>
            <p>Average Score: {(testingScores.reduce((a, b) => a + b, 0) / testingScores.length).toFixed(2)}</p>
            <p>Max Score: {Math.max(...testingScores)}</p>
            <p>Min Score: {Math.min(...testingScores)}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;