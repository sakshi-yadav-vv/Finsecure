
import joblib

# Paths to the two trained models
existing_model_path = "models/finsecure_fraud_model.joblib"
experimental_model_path = "models/finsecure_fraud_model_experiment.joblib"

# Load both models
existing_model = joblib.load(existing_model_path)
experimental_model = joblib.load(experimental_model_path)

print("Both FinSecure models loaded successfully!")

# Check the input features expected by each model
print("\nExisting model features:")
print(existing_model.named_steps["preprocessor"].feature_names_in_)

print("\nExperimental model features:")
print(experimental_model.named_steps["preprocessor"].feature_names_in_)



import pandas as pd


transaction = {
    "type": "TRANSFER",
    "amount": 100000,
    "oldbalanceOrg": 100000,
    "newbalanceOrig": 0,
    "oldbalanceDest": 0,
    "newbalanceDest": 0
}


# Calculate advanced features
transaction["sender_balance_change"] = (
    transaction["oldbalanceOrg"] - transaction["newbalanceOrig"]
)

transaction["receiver_balance_change"] = (
    transaction["newbalanceDest"] - transaction["oldbalanceDest"]
)

transaction["sender_balance_error"] = (
    transaction["amount"] - transaction["sender_balance_change"]
)

transaction["receiver_balance_error"] = (
    transaction["amount"] - transaction["receiver_balance_change"]
)

# Convert transaction into DataFrame
test_data = pd.DataFrame([transaction])

# Compare predictions
for name, model in [
    ("Existing Model", existing_model),
    ("Experimental Model", experimental_model)
]:
    prediction = int(model.predict(test_data)[0])
    probability = model.predict_proba(test_data)[0][1] * 100

    print(f"\n{name}")
    print("Prediction:", "FRAUDULENT" if prediction == 1 else "LEGITIMATE")
    print("Fraud probability:", round(probability, 2), "%")
