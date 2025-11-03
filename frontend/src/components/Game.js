import React, { useRef, useState, useEffect } from "react";
import axios from "axios";

// Configuration d'Axios pour les cookies de session
axios.defaults.withCredentials = true; 
const API_URL = "http://127.0.0.1:5000"; // URL de la route /predict

// Le composant reçoit playerInfo au lieu de playerName
export default function Game({ playerInfo, endGame }) {
  const canvasRef = useRef(null);
  const [digit, setDigit] = useState(Math.floor(Math.random() * 10));
  const [timeLeft, setTimeLeft] = useState(15);
  const [score, setScore] = useState(0);
  const [prediction, setPrediction] = useState(null);

  // Chronomètre
  useEffect(() => {
    if (timeLeft === 0) {
      endGame(score); // Appel endGame avec le score final
      return;
    }
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, score, endGame]);

  // Initialisation du dessin sur canvas (gestion tactile incluse)
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.lineWidth = 20;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "black"; 
    
    let drawing = false;

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX || e.touches?.[0].clientX;
      const clientY = e.clientY || e.touches?.[0].clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const start = (e) => {
      e.preventDefault(); 
      drawing = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e) => {
      if (!drawing) return;
      e.preventDefault(); 
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    };

    const end = () => {
      drawing = false;
      ctx.beginPath();
    };

    // Ajout des événements tactiles
    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", end);
    canvas.addEventListener("mouseleave", end);
    canvas.addEventListener("touchstart", start);
    canvas.addEventListener("touchmove", draw);
    canvas.addEventListener("touchend", end);

    return () => {
      canvas.removeEventListener("mousedown", start);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", end);
      canvas.removeEventListener("mouseleave", end);
      canvas.removeEventListener("touchstart", start);
      canvas.removeEventListener("touchmove", draw);
      canvas.removeEventListener("touchend", end);
    };
  }, []);

  // CORRECTION CRITIQUE: Pré-traitement de l'image (Centrage et Inversion)
  const getCenteredImage = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;

    // 1. Détermination de la Bounding Box
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const index = (y * canvas.width + x) * 4;
        // Vérifie si le pixel est suffisamment sombre (pas blanc) et opaque
        if (imageData.data[index + 3] > 0 && (imageData.data[index] < 255 || imageData.data[index + 1] < 255 || imageData.data[index + 2] < 255)) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (maxX < minX || maxY < minY) {
      // Dessin vide
      const blankCanvas = document.createElement("canvas");
      blankCanvas.width = 28; blankCanvas.height = 28;
      const blankCtx = blankCanvas.getContext("2d");
      blankCtx.fillStyle = "black";
      blankCtx.fillRect(0, 0, 28, 28);
      return blankCanvas;
    }

    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = 28; tempCanvas.height = 28;
    const tempCtx = tempCanvas.getContext("2d");

    // 2. Fond BLANC pour la zone de travail temporaire
    tempCtx.fillStyle = "white"; 
    tempCtx.fillRect(0, 0, 28, 28);

    // 3. Dessin noir centré et redimensionné
    const scale = Math.min(28 / width, 28 / height) * 0.9;
    const targetWidth = width * scale;
    const targetHeight = height * scale;

    tempCtx.drawImage(
      canvas,
      minX, minY, width, height,
      (28 - targetWidth) / 2,
      (28 - targetHeight) / 2,
      targetWidth, targetHeight
    );

    // 4. Inversion des couleurs -> Format MNIST (Chiffre Blanc sur Fond Noir)
    const finalImageData = tempCtx.getImageData(0, 0, 28, 28);
    const data = finalImageData.data;
    for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i];     
        data[i + 1] = 255 - data[i + 1]; 
        data[i + 2] = 255 - data[i + 2]; 
    }
    tempCtx.putImageData(finalImageData, 0, 0);

    return tempCanvas;
  };
  
  // Fonction pour effacer le canvas
  const handleClear = () => {
    canvasRef.current.getContext("2d").clearRect(0, 0, 280, 280);
    setPrediction(null);
  };

  // Envoyer au backend
  const handleSubmit = async () => {
    const tempCanvas = getCenteredImage();
    const dataUrl = tempCanvas.toDataURL("image/png");
    const blob = await (await fetch(dataUrl)).blob();
    const formData = new FormData();
    formData.append("image", blob, "digit.png");

    try {
      const res = await axios.post(`${API_URL}/predict`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data && res.data.prediction !== undefined) {
        setPrediction(res.data.prediction);
        if (res.data.prediction === digit) {
          setScore((prev) => prev + 1);
        }
      } 

      // UX: La prédiction s'affiche 1s pour le feedback, puis le tour change
      setTimeout(() => {
        setPrediction(null); // Cache le résultat (évite la confusion)
        setDigit(Math.floor(Math.random() * 10)); // Nouveau chiffre
        canvasRef.current.getContext("2d").clearRect(0, 0, 280, 280); // Nettoyer le canvas
      }, 1000); 

    } catch (err) {
      console.error("Erreur lors de la requête de prédiction :", err.message);
      setPrediction("Erreur IA");
      setTimeout(() => setPrediction(null), 2000);
    }
  };

  return (
    <div>
      {/* Utilise playerInfo.name */}
      <h2>Joueur : {playerInfo.name} ({playerInfo.id ? 'Connecté' : 'Invité'})</h2>
      <h3>Chiffre à dessiner : <span style={{fontSize: '2em', color: 'darkblue'}}>{digit}</span></h3>
      <h3>Temps restant : {timeLeft}s</h3>
      <h3>Score : {score}</h3>
      
      {/* Affichage du feedback de prédiction */}
      {prediction !== null && (
        <p style={{ 
            fontWeight: 'bold',
            color: prediction === digit ? 'green' : 'red'
        }}>
            🤖 Prédiction IA : {prediction} ({prediction === digit ? 'Correct!' : 'Faux'})
        </p>
      )}

      <canvas
        ref={canvasRef}
        width={280}
        height={280}
        style={{ border: "1px solid black", backgroundColor: "white", touchAction: 'none' }} 
      />
      <div style={{marginTop: '10px'}}>
        <button onClick={handleSubmit}>Valider le dessin</button>
        <button onClick={handleClear} style={{marginLeft: '10px'}}>Effacer</button>
      </div>
    </div>
  );
}