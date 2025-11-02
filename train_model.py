import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import numpy as np
import os

# Charger le dataset MNIST
# Cette simple ligne a organisé toutes vos données d'images nécessaires en jeux d'entraînement et de test prêts à être utilisés pour la suite du processus.
(x_train, y_train), (x_test, y_test) = keras.datasets.mnist.load_data()

# Normaliser les valeurs (0–1)
# On parcours chaque pixel, valeur entre 0 et 255 initialement
# Maintenant valeur entre 0 et 1
x_train = x_train / 255.0
x_test = x_test / 255.0

# Créer le modèle
# Architecture du réseau neuronal -> MLP
# Tableau à 3 couches
model = keras.Sequential([
    layers.Flatten(input_shape=(28, 28)), # 1ere couche
    layers.Dense(128, activation='relu'), # 2e couche
    layers.Dense(10, activation='softmax') # 3e couche
])

# Compiler le modèle
model.compile(optimizer='adam', # ajuste les poids du réseau neuronal pendant l'entraînement
              loss='sparse_categorical_crossentropy', #Imesure à quel point les prédictions du modèle sont mauvaises par rapport aux vraies étiquettes
              metrics=['accuracy']) # surveiller l'entraînement et l'évaluation.

# Entraîner le modèle
print("🚀 Entraînement du modèle en cours...")
model.fit(x_train, y_train, epochs=5, validation_data=(x_test, y_test))
# x_train = Les 60 000 images de chiffres manuscrits.
# y_train = Les 60 000 vrais chiffres correspondants (0 à 9)
# epochs=5 = Le nombre de fois que le modèle doit parcourir l'intégralité de l'ensemble x_train/y_train.
# validation = Un ensemble de données indépendant (les 10 000 images de test) sur lequel le modèle est évalué à la fin de chaque époque.

# Évaluer le modèle
loss, acc = model.evaluate(x_test, y_test, verbose=0)
print(f"✅ Précision du modèle : {acc * 100:.2f}%")

# Créer le dossier de sauvegarde s’il n’existe pas
os.makedirs("app/model", exist_ok=True)

# Sauvegarder le modèle
model.save("app/model/digit_model.h5")
print("💾 Modèle sauvegardé dans app/model/digit_model.h5")