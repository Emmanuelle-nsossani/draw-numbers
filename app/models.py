from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

# Initialisation de l'objet SQLAlchemy (sera lié à l'application dans main.py)
db = SQLAlchemy()

class User(UserMixin, db.Model):
    """ Modèle pour les utilisateurs enregistrés """
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), index=True, unique=True, nullable=False)
    email = db.Column(db.String(120), index=True, unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    
    # Relation : Un utilisateur peut avoir plusieurs scores
    scores = db.relationship('Score', backref='author', lazy='dynamic')

    def set_password(self, password):
        """ Hache le mot de passe pour le stocker en toute sécurité. """
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """ Vérifie si le mot de passe fourni correspond au hachage. """
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.username}>'

class Score(db.Model):
    """ Modèle pour les scores enregistrés des utilisateurs connectés """
    id = db.Column(db.Integer, primary_key=True)
    value = db.Column(db.Integer, nullable=False) # Le score (nombre de chiffres corrects)
    timestamp = db.Column(db.DateTime, index=True, default=datetime.utcnow)
    
    # Clé étrangère pour lier le score à un utilisateur (User.id)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))

    def __repr__(self):
        return f'<Score {self.value} by User {self.user_id}>'