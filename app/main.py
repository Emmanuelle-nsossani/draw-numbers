from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow import keras
import numpy as np
from PIL import Image, ImageOps
import io

app = Flask(__name__)
CORS(app) 

# Charger le modèle IA (le nouveau fichier .h5 doit être généré)
model = keras.models.load_model("app/model/digit_model.h5")

@app.route("/")
def home():
    return "✅ Flask is running!"

@app.route("/predict", methods=["POST"])
def predict():
    try:
        image_file = request.files['image']
        # Convertir en niveaux de gris (L)
        image = Image.open(io.BytesIO(image_file.read())).convert('L')  

        # Le frontend nous envoie déjà le format chiffre blanc sur fond noir (corrigé précédemment)

        # Redimensionner à 28x28 avec anti-aliasing
        image = image.resize((28,28), Image.Resampling.LANCZOS)

        # Convertir en array numpy et normaliser
        img_array = np.array(image)/255.0
        
        # NOUVEAU : Adapter la forme pour le CNN
        # Format attendu par le CNN : (1, 28, 28, 1) -> (1 exemple, 28 lignes, 28 colonnes, 1 canal)
        img_array = img_array.reshape(1, 28, 28, 1)  # ⬅️ LIGNE MODIFIÉE

        # Prédiction
        prediction = model.predict(img_array)
        predicted_digit = int(np.argmax(prediction[0]))

        return jsonify({"prediction": predicted_digit})

    except Exception as e:
        # Ceci vous donnera plus de détails en cas de problème de format
        return jsonify({"error": f"Erreur de prédiction : {str(e)}"})

if __name__ == "__main__":
    app.run(debug=True)