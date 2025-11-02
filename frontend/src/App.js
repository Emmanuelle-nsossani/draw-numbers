import React, { useState } from "react";
import Welcome from "./components/Welcome";
import Game from "./components/Game";
import Scoreboard from "./components/Scoreboard";

export default function App() {
  const [playerName, setPlayerName] = useState(null);
  const [scores, setScores] = useState([]);
  const [gameEnded, setGameEnded] = useState(false);
  const [score, setScore] = useState(0);

  const startGame = (name) => {
    setPlayerName(name);
    setGameEnded(false);
  };

  const endGame = (finalScore) => {
    setScore(finalScore);
    setScores([...scores, { name: playerName, score: finalScore }]);
    setGameEnded(true);
  };

  return (
    <div style={{textAlign:"center"}}>
      {!playerName && <Welcome startGame={startGame} />}
      {playerName && !gameEnded && <Game playerName={playerName} endGame={endGame} />}
      {gameEnded && <Scoreboard scores={scores} />}
    </div>
  );
}