import os
# Importe l'objet app, et l'objet db (qui doit être lié aux modèles)
from app.main import app, db 

# Assurez-vous que le répertoire 'app' existe pour stocker le fichier .db
if not os.path.exists('app'):
    os.makedirs('app')
    print("Dossier 'app/' créé.")

# Création des tables
with app.app_context():
    print("Création des tables de la base de données...")
    db.create_all()
    print("✅ Tables 'user' et 'score' créées avec succès dans draw_numbers.db !")