import React, { useRef, useState, useEffect } from "react";
import axios from "axios";

export default function Game({ playerName, endGame }) {
  const canvasRef = useRef(null);
  const [digit, setDigit] = useState(Math.floor(Math.random() * 10));
  const [timeLeft, setTimeLeft] = useState(10);
  const [score, setScore] = useState(0);
  const [prediction, setPrediction] = useState(null);

  // Chronomètre
  useEffect(() => {
    if (timeLeft === 0) {
      endGame(score);
      return;
    }
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, score, endGame]);

  // Dessin sur canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.lineWidth = 20;  // traits plus épais
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    let drawing = false;

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const start = (e) => { drawing = true; const pos = getPos(e); ctx.moveTo(pos.x, pos.y); };
    const draw = (e) => {
      if (!drawing) return;
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };
    const end = () => { drawing = false; ctx.beginPath(); };

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", end);
    canvas.addEventListener("mouseleave", end);

    return () => {
      canvas.removeEventListener("mousedown", start);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", end);
      canvas.removeEventListener("mouseleave", end);
    };
  }, []);

  // Fonction pour centrer et lisser le dessin avant envoi
  const getCenteredImage = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = 28;
    tempCanvas.height = 28;
    const tempCtx = tempCanvas.getContext("2d");

    // fond noir
    tempCtx.fillStyle = "black";
    tempCtx.fillRect(0, 0, 28, 28);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const index = (y * canvas.width + x) * 4;
        if (imageData.data[index + 3] > 0) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    if (width <= 0 || height <= 0) return tempCanvas;

    // Copier le dessin dans un canvas temporaire
    const tempImage = ctx.getImageData(minX, minY, width, height);

    const scale = Math.min(28 / width, 28 / height);
    tempCtx.setTransform(scale, 0, 0, scale, (28 - width * scale) / 2, (28 - height * scale) / 2);
    tempCtx.putImageData(tempImage, 0, 0);

    // Appliquer un léger flou pour l’anti-aliasing
    tempCtx.filter = "blur(0.5px)";
    tempCtx.drawImage(tempCanvas, 0, 0);

    return tempCanvas;
  };

  // Envoyer au backend
  const handleSubmit = async () => {
    const tempCanvas = getCenteredImage();
    const dataUrl = tempCanvas.toDataURL("image/png");
    const blob = await (await fetch(dataUrl)).blob();
    const formData = new FormData();
    formData.append("image", blob, "digit.png");

    try {
      const res = await axios.post("http://127.0.0.1:5000/predict", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Réponse du backend :", res.data);

      if (res.data && res.data.prediction !== undefined) {
        setPrediction(res.data.prediction);
        if (res.data.prediction === digit) setScore((prev) => prev + 1);
      } else {
        console.warn("Réponse inattendue :", res.data);
      }

      setDigit(Math.floor(Math.random() * 10));
      canvasRef.current.getContext("2d").clearRect(0, 0, 280, 280);

    } catch (err) {
      console.error("Erreur lors de la requête :", err);
    }
  };

  return (
    <div>
      <h2>Joueur : {playerName}</h2>
      <h3>Chiffre à dessiner : {digit}</h3>
      <h3>Temps restant : {timeLeft}s</h3>
      <h3>Score : {score}</h3>
      <canvas ref={canvasRef} width={280} height={280} style={{ border: "1px solid black" }} />
      <button onClick={handleSubmit}>Valider le dessin</button>
      {prediction !== null && <p>🤖 Prédiction IA : {prediction}</p>}
    </div>
  );
}
