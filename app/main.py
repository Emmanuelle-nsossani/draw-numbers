from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow import keras
import numpy as np
from PIL import Image, ImageOps # ImageOps est conservé mais non utilisé
import io

app = Flask(__name__)
CORS(app)  # Autoriser les requêtes du frontend

# Charger le modèle IA
model = keras.models.load_model("app/model/digit_model.h5")

@app.route("/")
def home():
    return "✅ Flask is running!"

@app.route("/predict", methods=["POST"])
def predict():
    try:
        # Récupérer l'image envoyée par le frontend
        image_file = request.files['image']
        # Convertir en niveaux de gris (L)
        image = Image.open(io.BytesIO(image_file.read())).convert('L')  

        # CORRECTION 2: SUPPRESSION de l'inversion des couleurs.
        # Le frontend envoie désormais une image avec le bon format (fond noir, chiffre blanc).
        # image = ImageOps.invert(image) <- LIGNE RETIRÉE

        # Redimensionner à 28x28 avec anti-aliasing
        # C'est une vérification de sécurité même si le frontend envoie déjà 28x28
        image = image.resize((28,28), Image.Resampling.LANCZOS)

        # Convertir en array numpy et normaliser
        img_array = np.array(image)/255.0
        img_array = img_array.reshape(1,28,28)  # 1 exemple, 28x28

        # Prédiction
        prediction = model.predict(img_array)
        predicted_digit = int(np.argmax(prediction[0]))

        return jsonify({"prediction": predicted_digit})

    except Exception as e:
        return jsonify({"error": str(e)})

if __name__ == "__main__":
    app.run(debug=True)