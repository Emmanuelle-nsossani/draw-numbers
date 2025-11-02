import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import numpy as np
import os

# Charger le dataset MNIST
(x_train, y_train), (x_test, y_test) = keras.datasets.mnist.load_data()

# NOUVEAU : Adapter la forme des données pour le CNN
# Les CNNs attendent un format (lignes, colonnes, canaux). MNIST est en niveaux de gris (1 canal).
x_train = x_train.reshape(-1, 28, 28, 1) / 255.0
x_test = x_test.reshape(-1, 28, 28, 1) / 255.0

# Créer le modèle
# Architecture du réseau neuronal -> CNN (bien plus performante pour les images)
model = keras.Sequential([
    # 1. Couche de Convolution : apprend des motifs locaux (lignes, courbes)
    layers.Conv2D(32, (3, 3), activation='relu', input_shape=(28, 28, 1)),
    # 2. Couche de Pooling : réduit la taille et la complexité (rend le modèle tolérant au déplacement)
    layers.MaxPooling2D((2, 2)),
    # 3. Couche de Convolution supplémentaire pour une meilleure extraction de caractéristiques
    layers.Conv2D(64, (3, 3), activation='relu'),
    layers.MaxPooling2D((2, 2)),
    # 4. Aplatissement avant les couches denses
    layers.Flatten(), 
    # 5. Couche Dense de classification
    layers.Dense(128, activation='relu'),
    # 6. Couche de sortie
    layers.Dense(10, activation='softmax')
])

# Compiler le modèle (configuration inchangée)
model.compile(optimizer='adam', 
              loss='sparse_categorical_crossentropy', 
              metrics=['accuracy']) 

# Entraîner le modèle
print("🚀 Entraînement du modèle en cours...")
# Note : 10 époques sont recommandées pour un CNN de base, nous conservons 5 pour la rapidité.
model.fit(x_train, y_train, epochs=10, validation_data=(x_test, y_test))

# Évaluer le modèle
loss, acc = model.evaluate(x_test, y_test, verbose=0)
print(f"✅ Précision du modèle CNN : {acc * 100:.2f}%")

# Créer le dossier de sauvegarde s’il n’existe pas
os.makedirs("app/model", exist_ok=True)

# Sauvegarder le modèle
# ATTENTION : Vous devez ré-exécuter ce script pour générer le nouveau fichier 'digit_model.h5'
model.save("app/model/digit_model.h5") 
print("💾 Modèle CNN sauvegardé dans app/model/digit_model.h5")