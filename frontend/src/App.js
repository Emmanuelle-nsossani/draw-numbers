import React, { useState, useEffect } from "react";
import Game from "./components/Game";
import Scoreboard from "./components/Scoreboard";
import Welcome from "./components/Welcome";
import axios from "axios";

// Configuration d'Axios pour envoyer les cookies de session (nécessaire pour Flask-Login)
axios.defaults.withCredentials = true; 
const API_URL = "http://127.0.0.1:5000/api"; // URL des routes API

export default function App() {
  // playerInfo stocke { id: number|null, name: string }. ID est null pour les invités.
  const [playerInfo, setPlayerInfo] = useState({ id: null, name: "" });
  const [gameStarted, setGameStarted] = useState(false);
  // scores stocke la liste des scores affichés dans le Scoreboard.
  const [scores, setScores] = useState([]); 

  // Vérifie l'état de connexion au chargement de l'app (pour une éventuelle session existante)
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await axios.get(`${API_URL}/status`);
        if (res.data.is_logged_in) {
          setPlayerInfo({ 
            id: res.data.user_id, 
            name: res.data.username 
          });
        }
      } catch (e) {
        console.warn("Vérification du statut de connexion échouée. (Normal si serveur non démarré)");
      }
    };
    checkStatus();
  }, []); 

  // Fonction appelée à la fin du jeu (après épuisement du chrono)
  const endGame = async (score) => {
    
    // Logique de sauvegarde du score dans la base de données
    if (playerInfo.id) {
        try {
            const res = await axios.post(`${API_URL}/save_score`, {
                score: score,
                user_id: playerInfo.id,
            });
            console.log("Score sauvegardé avec succès:", res.data.message);
        } catch (error) {
            console.error("Échec de l'enregistrement du score:", error.response?.data?.message || error.message);
        }
    } else {
        console.log("Score invité, non enregistré en base.");
    }

    // Mise à jour de l'état local du tableau des scores pour l'affichage
    const newScore = { name: playerInfo.name, score };
    setScores((prev) => [...prev, newScore].sort((a, b) => b.score - a.score));
    
    setGameStarted(false);
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/logout`);
    } catch (e) {
      console.error("Échec de la déconnexion", e);
    } finally {
      // Réinitialiser l'état local après la déconnexion
      setPlayerInfo({ id: null, name: "" }); 
      setScores([]); 
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      {!gameStarted ? (
        <>
          {!playerInfo.name ? (
            // 1. Écran d'accueil/connexion (Welcome.js gère l'ID/Nom)
            <Welcome 
              setPlayerInfo={setPlayerInfo} 
              startGame={() => setGameStarted(true)} 
            />
          ) : (
            // 2. Écran de lancement (après authentification ou mode invité)
            <>
              <h2>Bienvenue, {playerInfo.name} ({playerInfo.id ? 'Connecté' : 'Invité'})</h2>
              <button onClick={() => setGameStarted(true)}>Commencer le jeu</button>
              {playerInfo.id && (
                <button onClick={handleLogout} style={{ marginLeft: '10px' }}>Se déconnecter</button>
              )}
              {scores.length > 0 && <Scoreboard scores={scores} />}
            </>
          )}
        </>
      ) : (
        // 3. Jeu en cours (Game.js reçoit l'objet playerInfo)
        <Game playerInfo={playerInfo} endGame={endGame} />
      )}
    </div>
  );
}