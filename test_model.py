import tensorflow as tf
from tensorflow import keras
import numpy as np
import matplotlib.pyplot as plt

# Charger le dataset de test MNIST
(_, _), (x_test, y_test) = keras.datasets.mnist.load_data()

# Normaliser comme pendant l'entraînement
x_test = x_test / 255.0

# Charger le modèle sauvegardé
model = keras.models.load_model("app/model/digit_model.h5")

# Sélectionner quelques images au hasard
indices = np.random.choice(len(x_test), 5, replace=False)
images = x_test[indices]
labels = y_test[indices]

# Faire les prédictions
predictions = model.predict(images)

# Afficher les résultats
for i in range(len(images)):
    plt.imshow(images[i], cmap="gray")
    plt.title(f"Vrai chiffre : {labels[i]} — Prédiction : {np.argmax(predictions[i])}")
    plt.axis("off")
    plt.show()