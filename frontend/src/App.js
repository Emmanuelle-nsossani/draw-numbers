import React, { useState } from "react";
import Game from "./components/Game";
import Scoreboard from "./components/Scoreboard";
import Welcome from "./components/Welcome";

export default function App() {
  const [playerName, setPlayerName] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [scores, setScores] = useState([]);

  // Fonction appelée à la fin du jeu
  const endGame = (score) => {
    const newScore = { name: playerName, score };
    setScores((prev) => [...prev, newScore].sort((a, b) => b.score - a.score));
    setGameStarted(false);
    setPlayerName("");
  };

  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      {!gameStarted ? (
        <>
          {!playerName ? (
            <Welcome setPlayerName={setPlayerName} startGame={() => setGameStarted(true)} />
          ) : (
            <>
              <button onClick={() => setGameStarted(true)}>Commencer le jeu</button>
              {scores.length > 0 && <Scoreboard scores={scores} />}
            </>
          )}
        </>
      ) : (
        <Game playerName={playerName} endGame={endGame} />
      )}
    </div>
  );
}