import React, { useState } from "react";

export default function Welcome({ startGame }) {
  const [name, setName] = useState("");

  return (
    <div>
      <h1>Bienvenue au jeu des chiffres !</h1>
      <p>Règles : Dessinez le chiffre indiqué avant la fin du chronomètre.</p>
      <input
        type="text"
        placeholder="Votre prénom"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button
        onClick={() => {
          if (name) startGame(name);
          else alert("Entrez votre prénom !");
        }}
      >
        Commencer
      </button>
    </div>
  );
}
