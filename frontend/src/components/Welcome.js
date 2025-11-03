import React, { useState } from "react";
import axios from "axios";

// Configuration d'Axios pour envoyer les cookies de session (nécessaire pour Flask-Login)
axios.defaults.withCredentials = true; 
const API_URL = "http://127.0.0.1:5000/api";

export default function Welcome({ setPlayerInfo, startGame }) {
  const [activeTab, setActiveTab] = useState("guest"); // 'guest', 'login', 'register'
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(""); // Feedback de l'API

  const handleGuestSubmit = () => {
    if (username.trim()) {
      // Mode Invité: ID utilisateur est null, nom est le nom entré.
      setPlayerInfo({ id: null, name: username.trim() });
      startGame();
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await axios.post(`${API_URL}/login`, { email, password });
      
      // Connexion réussie: Stocker les infos et démarrer le jeu
      setPlayerInfo({ id: res.data.user_id, name: res.data.username });
      setMessage(res.data.message);
      
      // Un court délai pour que l'utilisateur voie le message de succès
      setTimeout(startGame, 500); 

    } catch (err) {
      setMessage(err.response?.data?.message || "Erreur de connexion.");
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await axios.post(`${API_URL}/register`, { username, email, password });
      
      setMessage(res.data.message + " Veuillez vous connecter.");
      
      // Après inscription, passer à l'onglet de connexion et effacer les champs
      setActiveTab("login");
      setUsername("");
      setEmail("");
      setPassword("");

    } catch (err) {
      setMessage(err.response?.data?.message || "Erreur d'inscription.");
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "login":
        return (
          <form onSubmit={handleLoginSubmit}>
            <h3>Connexion</h3>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">Se connecter</button>
          </form>
        );
      case "register":
        return (
          <form onSubmit={handleRegisterSubmit}>
            <h3>Inscription</h3>
            <input
              type="text"
              placeholder="Nom d'utilisateur"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">S'inscrire</button>
          </form>
        );
      case "guest":
      default:
        return (
          <div>
            <h3>Jouer en mode Invité</h3>
            <input
              type="text"
              placeholder="Entrez votre nom"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <button onClick={handleGuestSubmit} disabled={!username.trim()}>
              Démarrer le jeu (Invité)
            </button>
          </div>
        );
    }
  };

  return (
    <div>
      <h1>Bienvenue sur Draw Numbers!</h1>
      <div style={{ margin: "20px 0" }}>
        <button onClick={() => setActiveTab("guest")} disabled={activeTab === "guest"}>
          Mode Invité
        </button>
        <button onClick={() => setActiveTab("login")} disabled={activeTab === "login"}>
          Connexion
        </button>
        <button onClick={() => setActiveTab("register")} disabled={activeTab === "register"}>
          S'inscrire
        </button>
      </div>
      
      {message && <p style={{ color: message.includes("Erreur") || message.includes("invalide") || message.includes("déjà utilisé") ? 'red' : 'green' }}>{message}</p>}

      {renderContent()}
    </div>
  );
}