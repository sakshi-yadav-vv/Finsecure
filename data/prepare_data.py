
import pandas as pd

# Load original dataset
df = pd.read_csv("data/paysim.csv")

# Separate fraud and legitimate transactions
fraud = df[df["isFraud"] == 1]
legitimate = df[df["isFraud"] == 0]

# Keep all fraud cases
# Randomly select 100,000 legitimate cases
legitimate_sample = legitimate.sample(
    n=100000,
    random_state=42
)

# Combine both groups
ml_data = pd.concat(
    [fraud, legitimate_sample],
    ignore_index=True
)

# Shuffle the dataset
ml_data = ml_data.sample(
    frac=1,
    random_state=42
).reset_index(drop=True)

# Keep useful features and target
features = [
    "type",
    "amount",
    "oldbalanceOrg",
    "newbalanceOrig",
    "oldbalanceDest",
    "newbalanceDest"
]

ml_data = ml_data[features + ["isFraud"]]

# Save prepared dataset
ml_data.to_csv(
    "data/finsecure_ml_data.csv",
    index=False
)

print("Dataset preparation completed!")
print("Prepared dataset shape:", ml_data.shape)
print("\nFraud distribution:")
print(ml_data["isFraud"].value_counts())
