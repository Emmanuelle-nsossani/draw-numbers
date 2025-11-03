from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow import keras
import numpy as np
from PIL import Image, ImageOps
import io
import os 

# --- NOUVEAUX IMPORTS POUR LA BASE DE DONNÉES ET L'AUTHENTIFICATION ---
from flask_login import LoginManager, login_user, logout_user, current_user, login_required
from .models import db, User, Score # Importe l'objet db et les modèles User et Score (import relatif)

app = Flask(__name__)

# --- CONFIGURATION DE L'APPLICATION ET DE LA BASE DE DONNÉES ---
# Clé secrète OBLIGATOIRE pour Flask-Login et la gestion des sessions
# REMPLACER par une chaîne de caractères complexe dans un environnement de production
app.config['SECRET_KEY'] = 'votre_clé_secrète_très_difficile_à_deviner'
# Configuration de la base de données SQLite (stockée dans le dossier app/)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app/draw_numbers.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialisation des extensions
db.init_app(app) # Lie SQLAlchemy à l'application Flask
CORS(app) 

# Initialisation du gestionnaire de connexion (Flask-Login)
login_manager = LoginManager()
login_manager.init_app(app)

# Fonction essentielle pour Flask-Login : comment charger un utilisateur depuis son ID
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Charger le modèle IA (le fichier .h5 doit être généré par train_model.py)
model = keras.models.load_model("app/model/digit_model.h5")

@app.route("/")
def home():
    return "✅ Flask est en cours d'exécution!"

@app.route("/predict", methods=["POST"])
def predict():
    try:
        image_file = request.files['image']
        # Convertir en niveaux de gris (L)
        image = Image.open(io.BytesIO(image_file.read())).convert('L')  

        # Redimensionner à 28x28 avec anti-aliasing
        image = image.resize((28,28), Image.Resampling.LANCZOS)

        # Convertir en array numpy et normaliser
        img_array = np.array(image)/255.0
        
        # Adaptation de la forme pour le CNN (1 exemple, 28 lignes, 28 colonnes, 1 canal)
        img_array = img_array.reshape(1, 28, 28, 1)  

        # Prédiction
        prediction = model.predict(img_array)
        predicted_digit = int(np.argmax(prediction[0]))

        return jsonify({"prediction": predicted_digit})

    except Exception as e:
        print(f"Prediction Error: {e}")
        return jsonify({"error": f"Erreur de prédiction : {str(e)}"}, 500)


# --- ROUTES D'AUTHENTIFICATION ---

@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({"message": "Nom d'utilisateur, email et mot de passe sont requis"}), 400

    if User.query.filter_by(username=username).first() is not None:
        return jsonify({"message": "Ce nom d'utilisateur est déjà utilisé"}), 409
    
    if User.query.filter_by(email=email).first() is not None:
        return jsonify({"message": "Cet email est déjà utilisé"}), 409

    user = User(username=username, email=email)
    user.set_password(password) # Utilise la fonction de hachage sécurisée
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({"message": "Inscription réussie", "user_id": user.id}), 201


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"message": "Email et mot de passe sont requis"}), 400

    user = User.query.filter_by(email=email).first()

    # Vérifie l'utilisateur et le mot de passe
    if user is None or not user.check_password(password):
        return jsonify({"message": "Email ou mot de passe invalide"}), 401

    # Connexion de l'utilisateur (crée la session)
    login_user(user)
    
    return jsonify({
        "message": "Connexion réussie", 
        "user_id": user.id,
        "username": user.username
    }), 200

@app.route("/api/logout", methods=["POST"])
@login_required # Nécessite d'être connecté pour cette route
def logout():
    logout_user()
    return jsonify({"message": "Déconnexion réussie"}), 200

# Route pour vérifier l'état de la connexion (utile pour le frontend)
@app.route("/api/status", methods=["GET"])
def status():
    if current_user.is_authenticated:
        return jsonify({
            "is_logged_in": True,
            "user_id": current_user.id,
            "username": current_user.username
        }), 200
    return jsonify({"is_logged_in": False}), 200


# --- ROUTE DE SAUVEGARDE DU SCORE ---
@app.route("/api/save_score", methods=["POST"])
def save_score():
    data = request.get_json()
    score_value = data.get('score')
    user_id = data.get('user_id')

    if score_value is None or user_id is None:
        return jsonify({"message": "Score ou ID utilisateur manquant."}), 400

    if user_id == 0:
        # ID 0 ou null peut être réservé pour les invités (ne pas sauvegarder)
        return jsonify({"message": "Score invité, non enregistré en base."}), 200

    try:
        # Vérifie si l'utilisateur existe avant d'enregistrer
        if User.query.get(user_id) is None:
            return jsonify({"message": "Utilisateur non trouvé pour cet ID."}, 404)
            
        new_score = Score(value=score_value, user_id=user_id)
        db.session.add(new_score)
        db.session.commit()
        
        return jsonify({"message": "Score enregistré avec succès.", "score_id": new_score.id}), 201

    except Exception as e:
        db.session.rollback()
        print(f"Erreur lors de l'enregistrement du score: {e}")
        return jsonify({"message": "Erreur serveur lors de l'enregistrement du score."}, 500)


if __name__ == "__main__":
    # --- CRÉATION DE LA BASE DE DONNÉES AU DÉMARRAGE ---
    with app.app_context():
        # Crée le dossier 'app' s'il n'existe pas
        if not os.path.exists('app'):
            os.makedirs('app')
        # Crée les tables si elles n'existent pas encore dans le fichier .db
        db.create_all() 
    
    app.run(debug=True)