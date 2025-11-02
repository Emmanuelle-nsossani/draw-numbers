from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow import keras
import numpy as np
from PIL import Image, ImageOps, ImageChops
import io

app = Flask(__name__)
CORS(app)

# Charger le modèle IA MNIST
model = keras.models.load_model("app/model/digit_model.h5")

@app.route("/")
def home():
    return "✅ Flask is running!"

@app.route("/predict", methods=["POST"])
def predict():
    try:
        # Récupérer l'image envoyée par le frontend
        image_file = request.files['image']
        image = Image.open(io.BytesIO(image_file.read())).convert('L')  # niveaux de gris

        # Inverser les couleurs (fond noir, chiffre blanc)
        image = ImageOps.invert(image)

        # Centrer le chiffre
        bbox = ImageChops.invert(image).getbbox()
        if bbox:
            image = image.crop(bbox)

        # Redimensionner à 28x28 (Pillow 10+)
        image = image.resize((28, 28), Image.Resampling.LANCZOS)

        # Convertir en array numpy + normalisation
        img_array = np.array(image) / 255.0
        img_array = img_array.reshape(1, 28, 28)

        # Faire la prédiction
        prediction = model.predict(img_array)
        predicted_digit = int(np.argmax(prediction[0]))

        print("✅ Prédiction :", predicted_digit)
        return jsonify({"prediction": predicted_digit})

    except Exception as e:
        print("❌ Erreur :", str(e))
        return jsonify({"error": str(e)})

if __name__ == "__main__":
    app.run(debug=True)