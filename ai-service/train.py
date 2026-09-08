import os
import re
import json
import pickle
import random

import pandas as pd
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix,
    ConfusionMatrixDisplay,
)


# ============================================================
# 1. PROJECT PATHS
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATASET_DIR = os.path.join(BASE_DIR, "dataset")
MODEL_DIR = os.path.join(BASE_DIR, "model")
RESULTS_DIR = os.path.join(BASE_DIR, "results")

os.makedirs(DATASET_DIR, exist_ok=True)
os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)

DATASET_FILE = os.path.join(DATASET_DIR, "scam_messages.csv")
MODEL_FILE = os.path.join(MODEL_DIR, "scam_model.pkl")
VECTORIZER_FILE = os.path.join(MODEL_DIR, "tfidf_vectorizer.pkl")
METRICS_FILE = os.path.join(RESULTS_DIR, "metrics.json")
CONFUSION_MATRIX_FILE = os.path.join(
    RESULTS_DIR, "confusion_matrix.png"
)


# ============================================================
# 2. STARTER DATASET
# ============================================================

scam_messages = [
    # Banking / Financial scams
    "Your bank account will be blocked today. Verify your account immediately.",
    "Your bank account has been suspended. Click the link to reactivate it.",
    "Urgent: verify your banking details to avoid account closure.",
    "Your debit card will be blocked. Confirm your card details now.",
    "Your bank KYC has expired. Update your details immediately.",
    "We detected unusual activity in your bank account. Verify now.",
    "Your account will be permanently blocked unless you complete verification.",
    "Click this link to verify your bank account immediately.",
    "Your ATM card is disabled. Send your OTP to reactivate it.",
    "Your bank account requires urgent KYC verification.",
    "Congratulations, your bank account is eligible for a special cash reward.",
    "Send your OTP to confirm your bank transaction.",
    "Your bank transaction failed. Share your PIN to resolve the issue.",
    "Your account has suspicious activity. Confirm your password now.",
    "Immediate action required to protect your bank account.",

    # OTP / Password scams
    "Never share your OTP with anyone. Your OTP is 123456.",
    "Your verification code is required to complete your reward claim.",
    "Send the OTP received on your phone to verify your account.",
    "Share your OTP immediately or your account will be closed.",
    "Your password has expired. Click here to reset it immediately.",
    "Confirm your login by sending the verification code.",
    "Your account security requires OTP verification now.",
    "Give us the OTP to complete your transaction.",
    "Your verification code is required to release your payment.",
    "Provide your password to verify your identity.",

    # Lottery / Prize scams
    "Congratulations! You have won a lottery prize of Rs 10 lakh.",
    "You are the lucky winner of our cash prize. Claim now.",
    "Congratulations, you have won Rs 5,00,000. Pay a small fee to claim.",
    "Your mobile number has won a special prize.",
    "You have been selected for a lottery reward. Contact us immediately.",
    "Claim your free prize before the offer expires.",
    "You won a cash reward. Send Rs 500 processing fee to receive it.",
    "Congratulations! Your prize is waiting. Click the link to claim.",
    "You have won a lucky draw. Provide your bank details to receive the money.",
    "Exclusive reward waiting for you. Claim your prize today.",

    # Job scams
    "You have been selected for a work from home job. Pay Rs 1000 registration fee.",
    "Earn Rs 5000 per day from home. Send your registration payment now.",
    "Congratulations, your job application has been selected. Pay the verification fee.",
    "We offer a guaranteed online job with high salary. Register immediately.",
    "Your job is confirmed. Pay the security deposit to start working.",
    "Work from home and earn Rs 1 lakh monthly. Contact us now.",
    "You have been shortlisted for a job. Send your documents and payment.",
    "Easy part-time job available. Deposit money to activate your account.",
    "Guaranteed job opportunity. Pay the training fee today.",
    "Earn money by completing simple tasks. Deposit Rs 500 to begin.",

    # Delivery scams
    "Your parcel is on hold. Pay Rs 50 to complete delivery.",
    "Your delivery address is incorrect. Update it using this link immediately.",
    "Your package could not be delivered. Pay the pending customs fee.",
    "Your parcel will be returned today unless you verify your address.",
    "Pay Rs 99 delivery charges to receive your package.",
    "Your shipment is waiting for address verification.",
    "Click here to reschedule your delivery and pay the pending amount.",
    "Your package is held at customs. Pay the fee immediately.",
    "Delivery failed. Confirm your address and card details.",
    "Your parcel requires immediate payment to avoid cancellation.",

    # Investment scams
    "Invest Rs 5000 today and receive guaranteed returns of Rs 50000.",
    "Double your money in seven days with our investment plan.",
    "Guaranteed profit investment opportunity. Join immediately.",
    "Earn 300 percent returns with zero risk.",
    "Send money to our investment account and receive guaranteed profit.",
    "Exclusive crypto investment opportunity with guaranteed returns.",
    "Your investment can generate huge profits within 24 hours.",
    "Limited investment offer. Deposit money now to unlock your profits.",
    "Guaranteed returns with no risk. Register today.",
    "Invest now and become a millionaire quickly.",

    # Impersonation scams
    "This is the police department. Pay the fine immediately to avoid arrest.",
    "Your account has been reported for illegal activity. Contact us now.",
    "This is your bank manager. Send your OTP for account verification.",
    "I am calling from customer support. Provide your card details.",
    "Your SIM will be disconnected unless you verify your identity.",
    "Your mobile service will stop today. Complete KYC immediately.",
    "Government notice: pay the pending fine immediately using this link.",
    "Your account has been selected for verification by the authorities.",
    "We are calling from technical support. Install this application immediately.",
    "Your identity verification has failed. Send your documents now.",
]


normal_messages = [
    # Banking
    "Your bank statement for this month is now available.",
    "Your account balance was updated successfully.",
    "Your bank transaction of Rs 500 was successful.",
    "Your debit card payment was completed successfully.",
    "Your monthly bank statement is ready to view.",
    "Your account has been successfully updated.",
    "Your scheduled bank transfer has been completed.",
    "Your payment was received successfully.",
    "Your bank has processed your transaction.",
    "Your account information is available in your banking app.",

    # OTP / Security
    "Your OTP is valid for 10 minutes. Do not share it with anyone.",
    "Use the verification code to complete your login.",
    "Your password was changed successfully.",
    "Your login was successful.",
    "Your security settings were updated successfully.",
    "A new device was added to your account.",
    "Your account security settings have been updated.",
    "You successfully signed in to your account.",
    "Your verification process is complete.",
    "Your account recovery request was received.",

    # Shopping / Delivery
    "Your order has been shipped.",
    "Your package will arrive tomorrow.",
    "Your order has been delivered successfully.",
    "Your delivery is scheduled for Monday.",
    "Your package is out for delivery.",
    "Your order has been confirmed.",
    "Your shopping order is being prepared.",
    "Your delivery address has been updated.",
    "Your order has reached the local delivery center.",
    "Your package was delivered to the requested address.",

    # Bills
    "Your electricity bill is due on Monday.",
    "Your mobile bill is ready to view.",
    "Your internet bill payment was successful.",
    "Your water bill is available online.",
    "Your monthly subscription payment was successful.",
    "Your electricity bill has been generated.",
    "Your mobile recharge was completed successfully.",
    "Your broadband payment was received.",
    "Your utility bill is available in your account.",
    "Your payment receipt is now available.",

    # Jobs / Education
    "Your interview is scheduled for tomorrow at 10 AM.",
    "Your job application has been received.",
    "Your application status has been updated.",
    "Your college assignment submission was successful.",
    "Your exam schedule is available on the student portal.",
    "Your interview feedback is available.",
    "Your internship application is under review.",
    "Your course registration was completed successfully.",
    "Your admission application has been received.",
    "Your class timetable has been updated.",

    # General
    "Your appointment is confirmed for tomorrow.",
    "Your meeting is scheduled for 3 PM.",
    "Please remember your appointment tomorrow.",
    "Your reservation has been confirmed.",
    "Your account notification is available.",
    "Your requested document is ready.",
    "Your service request has been completed.",
    "Thank you for using our service.",
    "Your request has been successfully submitted.",
    "Your notification preferences were updated.",
]


# ============================================================
# 3. CREATE DATASET
# ============================================================

def create_dataset():
    data = []

    for message in scam_messages:
        data.append({
            "message": message,
            "label": "scam"
        })

    for message in normal_messages:
        data.append({
            "message": message,
            "label": "normal"
        })

    # Shuffle the dataset
    random.seed(42)
    random.shuffle(data)

    df = pd.DataFrame(data)

    df.to_csv(DATASET_FILE, index=False)

    print("\nDataset created successfully!")
    print(f"Dataset location: {DATASET_FILE}")
    print(f"Total messages: {len(df)}")
    print("\nClass distribution:")
    print(df["label"].value_counts())

    return df


# ============================================================
# 4. TEXT PREPROCESSING
# ============================================================

def clean_text(text):
    """
    Basic text cleaning.

    We intentionally keep words such as:
    'not', 'urgent', 'verify', 'payment', etc.
    because they can be important for scam detection.
    """

    text = str(text)

    # Convert to lowercase
    text = text.lower()

    # Remove extra spaces
    text = re.sub(r"\s+", " ", text)

    # Remove leading/trailing spaces
    text = text.strip()

    return text


# ============================================================
# 5. TRAIN MODEL
# ============================================================

def train_model(df):

    print("\nPreparing data...")

    df["message"] = df["message"].apply(clean_text)

    X = df["message"]
    y = df["label"]

    # --------------------------------------------------------
    # Train/Test split
    # --------------------------------------------------------

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=42,
        stratify=y
    )

    print(f"Training samples: {len(X_train)}")
    print(f"Testing samples: {len(X_test)}")

    # --------------------------------------------------------
    # TF-IDF
    # --------------------------------------------------------

    print("\nCreating TF-IDF vectorizer...")

    vectorizer = TfidfVectorizer(
        lowercase=True,
        ngram_range=(1, 2),
        min_df=1,
        max_features=10000,
        sublinear_tf=True
    )

    X_train_tfidf = vectorizer.fit_transform(X_train)
    X_test_tfidf = vectorizer.transform(X_test)

    print(f"TF-IDF training shape: {X_train_tfidf.shape}")

    # --------------------------------------------------------
    # Logistic Regression
    # --------------------------------------------------------

    print("\nTraining Logistic Regression model...")

    model = LogisticRegression(
        max_iter=1000,
        class_weight="balanced",
        random_state=42
    )

    model.fit(X_train_tfidf, y_train)

    print("Model training completed!")

    # ========================================================
    # 6. PREDICTIONS
    # ========================================================

    y_pred = model.predict(X_test_tfidf)

    # ========================================================
    # 7. EVALUATION
    # ========================================================

    accuracy = accuracy_score(y_test, y_pred)

    precision = precision_score(
        y_test,
        y_pred,
        pos_label="scam",
        zero_division=0
    )

    recall = recall_score(
        y_test,
        y_pred,
        pos_label="scam",
        zero_division=0
    )

    f1 = f1_score(
        y_test,
        y_pred,
        pos_label="scam",
        zero_division=0
    )

    print("\n" + "=" * 60)
    print("MODEL EVALUATION")
    print("=" * 60)

    print(f"Accuracy : {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall   : {recall:.4f}")
    print(f"F1 Score : {f1:.4f}")

    print("\nClassification Report:")
    print(
        classification_report(
            y_test,
            y_pred,
            zero_division=0
        )
    )

    # ========================================================
    # 8. CONFUSION MATRIX
    # ========================================================

    cm = confusion_matrix(
        y_test,
        y_pred,
        labels=["normal", "scam"]
    )

    print("\nConfusion Matrix:")
    print(cm)

    display = ConfusionMatrixDisplay(
        confusion_matrix=cm,
        display_labels=["Normal", "Scam"]
    )

    display.plot()

    plt.title("ScamShield AI - Confusion Matrix")
    plt.tight_layout()

    plt.savefig(
        CONFUSION_MATRIX_FILE,
        dpi=150
    )

    plt.close()

    print(
        f"\nConfusion matrix saved to:\n"
        f"{CONFUSION_MATRIX_FILE}"
    )

    # ========================================================
    # 9. SAVE MODEL
    # ========================================================

    print("\nSaving model...")

    with open(MODEL_FILE, "wb") as file:
        pickle.dump(model, file)

    with open(VECTORIZER_FILE, "wb") as file:
        pickle.dump(vectorizer, file)

    print(f"Model saved to:\n{MODEL_FILE}")
    print(f"Vectorizer saved to:\n{VECTORIZER_FILE}")

    # ========================================================
    # 10. SAVE METRICS
    # ========================================================

    metrics = {
        "accuracy": round(float(accuracy), 4),
        "precision": round(float(precision), 4),
        "recall": round(float(recall), 4),
        "f1_score": round(float(f1), 4),
        "training_samples": len(X_train),
        "testing_samples": len(X_test),
        "model": "Logistic Regression",
        "feature_extraction": "TF-IDF",
        "ngram_range": [1, 2]
    }

    with open(METRICS_FILE, "w") as file:
        json.dump(
            metrics,
            file,
            indent=4
        )

    print(f"\nMetrics saved to:\n{METRICS_FILE}")

    return model, vectorizer


# ============================================================
# 11. TEST MODEL WITH CUSTOM MESSAGES
# ============================================================

def test_model(model, vectorizer):

    test_messages = [
        "Congratulations! You have won Rs 10 lakh. Pay Rs 500 to claim your prize.",

        "Your order has been shipped and will arrive tomorrow.",

        "Your bank account will be blocked unless you verify your details immediately.",

        "Your appointment is confirmed for tomorrow at 10 AM."
    ]

    print("\n")
    print("=" * 60)
    print("CUSTOM MESSAGE TEST")
    print("=" * 60)

    for message in test_messages:

        cleaned = clean_text(message)

        vector = vectorizer.transform([cleaned])

        prediction = model.predict(vector)[0]

        probabilities = model.predict_proba(vector)[0]

        # Get index of scam class
        scam_index = list(model.classes_).index("scam")

        scam_probability = probabilities[scam_index] * 100

        print("\nMessage:")
        print(message)

        print(f"Prediction: {prediction.upper()}")
        print(f"Scam probability: {scam_probability:.2f}%")

        # Convert probability into simple risk level
        if scam_probability >= 70:
            risk = "HIGH"
        elif scam_probability >= 40:
            risk = "MEDIUM"
        else:
            risk = "LOW"

        print(f"Risk level: {risk}")


# ============================================================
# 12. MAIN PROGRAM
# ============================================================

def main():

    print("=" * 60)
    print("SCAMSHIELD AI")
    print("TF-IDF + LOGISTIC REGRESSION TRAINING")
    print("=" * 60)

    # Create starter dataset
    df = create_dataset()

    # Train model
    model, vectorizer = train_model(df)

    # Test model
    test_model(model, vectorizer)

    print("\n")
    print("=" * 60)
    print("TRAINING COMPLETED SUCCESSFULLY")
    print("=" * 60)

    print("\nGenerated files:")

    print(f"\nDataset:")
    print(DATASET_FILE)

    print(f"\nModel:")
    print(MODEL_FILE)

    print(f"\nTF-IDF Vectorizer:")
    print(VECTORIZER_FILE)

    print(f"\nMetrics:")
    print(METRICS_FILE)

    print(f"\nConfusion Matrix:")
    print(CONFUSION_MATRIX_FILE)


if __name__ == "__main__":
    main()