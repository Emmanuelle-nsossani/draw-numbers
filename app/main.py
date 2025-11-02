from flask import Flask, request, jsonify
from tensorflow import keras
import numpy as np
from PIL import Image
import io

app = Flask(__name__)

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
        image = Image.open(io.BytesIO(image_file.read())).convert('L')  # niveaux de gris
        image = image.resize((28,28))  # redimensionner pour MNIST

        # Convertir en array numpy et normaliser
        img_array = np.array(image) / 255.0
        img_array = img_array.reshape(1,28,28)

        # Faire la prédiction
        prediction = model.predict(img_array)
        predicted_digit = int(np.argmax(prediction[0]))

        return jsonify({"prediction": predicted_digit})
    except Exception as e:
        return jsonify({"error": str(e)})

if __name__ == "__main__":
    app.run(debug=True)
