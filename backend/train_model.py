
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_auc_score,
    average_precision_score
)

# Load original PaySim dataset
df = pd.read_csv(
    "data/paysim.csv",
    usecols=[
        "type",
        "amount",
        "oldbalanceOrg",
        "newbalanceOrig",
        "oldbalanceDest",
        "newbalanceDest",
        "isFraud"
    ],


    dtype={
        "type": "category",
        "amount": "float32",
        "oldbalanceOrg": "float32",
        "newbalanceOrig": "float32",
        "oldbalanceDest": "float32",
        "newbalanceDest": "float32",
        "isFraud": "int8"
    }
)
print(
    "Dataset memory usage:",
    round(df.memory_usage(deep=True).sum() / (1024 ** 2), 2),
    "MB"
)


# Advanced fraud detection features
df["sender_balance_change"] = (
    df["oldbalanceOrg"] - df["newbalanceOrig"]
)

df["receiver_balance_change"] = (
    df["newbalanceDest"] - df["oldbalanceDest"]
)

df["sender_balance_error"] = (
    df["amount"] - df["sender_balance_change"]
)

df["receiver_balance_error"] = (
    df["amount"] - df["receiver_balance_change"]
)

# Separate features and target
X = df.drop(columns=["isFraud"])
y = df["isFraud"]

# Identify feature types
numeric_features = [
    "amount",
    "oldbalanceOrg",
    "newbalanceOrig",
    "oldbalanceDest",
    "newbalanceDest",
    "sender_balance_change",
    "receiver_balance_change",
    "sender_balance_error",
    "receiver_balance_error"
]

categorical_features = ["type"]

# Preprocessing
preprocessor = ColumnTransformer(
    transformers=[
        ("num", "passthrough", numeric_features),
        ("cat", OneHotEncoder(handle_unknown="ignore"),
         categorical_features)
    ]
)

# Build Random Forest pipeline
model = Pipeline(steps=[
    ("preprocessor", preprocessor),
    ("classifier", RandomForestClassifier(
        n_estimators=100,
        class_weight="balanced_subsample",
        min_samples_leaf=2,
        random_state=42,
        n_jobs=2
    ))
])


# Split original dataset before sampling
X_train_full, X_test, y_train_full, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

# Keep all fraud cases in the training portion
fraud_indices = y_train_full[y_train_full == 1].index

# Sample 100,000 legitimate training transactions
legitimate_indices = (
    y_train_full[y_train_full == 0]
    .sample(n=100000, random_state=42)
    .index
)

# Combine training indices
train_indices = fraud_indices.union(legitimate_indices)

X_train = X_train_full.loc[train_indices].copy()
y_train = y_train_full.loc[train_indices].copy()

# Release unused training data
del X_train_full, y_train_full

# Release original dataset and feature references
del df, X, y

# Free unused memory
import gc
gc.collect()

print("Training transactions:", len(X_train))
print("Testing transactions:", len(X_test))
print("Test fraud percentage:", round(y_test.mean() * 100, 4), "%")


print("Training started...")

# Train model
model.fit(X_train, y_train)

print("Training completed!")

# Predictions in batches to reduce memory usage
import numpy as np

batch_size = 50000
predictions = []
probabilities = []

print("Evaluating model in batches...")

for start in range(0, len(X_test), batch_size):
    end = start + batch_size

    X_batch = X_test.iloc[start:end]

    batch_pred = model.predict(X_batch)
    batch_prob = model.predict_proba(X_batch)[:, 1]

    predictions.append(batch_pred)
    probabilities.append(batch_prob)

y_pred = np.concatenate(predictions)
y_prob = np.concatenate(probabilities)

del predictions, probabilities
gc.collect()

print("Batch evaluation completed!")

# Evaluate model
print("\n--- Classification Report ---")
print(classification_report(y_test, y_pred))

print("\n--- Confusion Matrix ---")
print(confusion_matrix(y_test, y_pred))

print("\nROC-AUC Score:")
print(roc_auc_score(y_test, y_prob))

# Precision-Recall evaluation
print("\nPR-AUC (Average Precision):")
print(average_precision_score(y_test, y_prob))

# Fraud detection summary
cm = confusion_matrix(y_test, y_pred)
tn, fp, fn, tp = cm.ravel()

print("\n--- Fraud Detection Summary ---")
print("Correctly detected fraud:", tp)
print("Missed fraud:", fn)
print("False fraud alerts:", fp)
print("Correctly identified legitimate transactions:", tn)

print("\nActual fraud percentage in test data:")
print(round(y_test.mean() * 100, 4), "%")

# Save trained model
joblib.dump(model, "models/finsecure_fraud_model_experiment.joblib")

print("\nModel saved successfully!")


# Save evaluation metrics to a text file
from pathlib import Path

report = f"""
FinSecure Experimental Model Evaluation

Total test transactions: {len(y_test)}
Fraud percentage: {y_test.mean() * 100:.4f}%

Classification Report:
{classification_report(y_test, y_pred)}

Confusion Matrix:
{confusion_matrix(y_test, y_pred)}

ROC-AUC: {roc_auc_score(y_test, y_prob):.6f}
Average Precision: {average_precision_score(y_test, y_prob):.6f}

True Positives: {tp}
False Positives: {fp}
False Negatives: {fn}
True Negatives: {tn}
"""

Path("reports").mkdir(exist_ok=True)

Path("reports/model_evaluation.txt").write_text(
    report,
    encoding="utf-8"
)

print("Evaluation report saved successfully!")
