# load_model.py

from sentence_transformers import SentenceTransformer
import json

# Charger le modèle Sentence Transformers
model = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')

# Récupérer les paramètres du modèle
model_params = {
    'name': 'paraphrase-multilingual-MiniLM-L12-v2',
    'embedding_size': model.get_sentence_embedding_dimension(),
    # Ajoutez d'autres paramètres du modèle selon vos besoins
}

# Renvoyer les paramètres du modèle via stdout au format JSON
print(json.dumps(model_params))
