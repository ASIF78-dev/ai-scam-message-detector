import pickle
from app.config import MODEL_PATH, VECTORIZER_PATH

class MLClassifier:
    """
    Manages loading and inference for the TF-IDF + Logistic Regression ML pipeline.
    """
    def __init__(self, model_path=MODEL_PATH, vectorizer_path=VECTORIZER_PATH):
        self.model_path = model_path
        self.vectorizer_path = vectorizer_path
        self.model = None
        self.vectorizer = None
        self.load_model()

    def load_model(self):
        try:
            with open(self.model_path, "rb") as f:
                self.model = pickle.load(f)
            with open(self.vectorizer_path, "rb") as f:
                self.vectorizer = pickle.load(f)
            print("✅ Scam ML model & vectorizer loaded successfully")
        except Exception as e:
            self.model = None
            self.vectorizer = None
            print(f"⚠️ Could not load ML model: {e}")

    @property
    def is_loaded(self) -> bool:
        return self.model is not None and self.vectorizer is not None

    def predict(self, cleaned_text: str) -> dict:
        """
        Run TF-IDF vectorization and Logistic Regression inference.
        Returns detailed probability and confidence metrics.
        """
        if not self.is_loaded:
            return {
                "mlPrediction": "unknown",
                "mlScore": 0.0,
                "mlConfidence": 0.0,
                "isModelLoaded": False,
                "probabilities": {}
            }

        vec = self.vectorizer.transform([cleaned_text])
        prediction = self.model.predict(vec)[0]
        probabilities = self.model.predict_proba(vec)[0]
        classes = list(self.model.classes_)

        scam_prob = 0.0
        if "scam" in classes:
            scam_index = classes.index("scam")
            scam_prob = float(probabilities[scam_index]) * 100.0

        confidence = float(max(probabilities)) * 100.0

        prob_dict = {
            str(cls): round(float(prob) * 100.0, 2)
            for cls, prob in zip(classes, probabilities)
        }

        return {
            "mlPrediction": prediction,
            "mlScore": round(scam_prob, 2),
            "mlConfidence": round(confidence, 2),
            "isModelLoaded": True,
            "probabilities": prob_dict
        }

# Global singleton classifier instance
classifier = MLClassifier()
