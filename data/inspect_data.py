
import pandas as pd

# Load dataset
df = pd.read_csv("data/paysim.csv")

# 1. Dataset shape
print("\n--- Dataset Shape ---")
print(df.shape)

# 2. Column names
print("\n--- Column Names ---")
print(df.columns.tolist())

# 3. First 5 rows
print("\n--- First 5 Rows ---")
print(df.head())

# 4. Data types
print("\n--- Data Types ---")
print(df.dtypes)

# 5. Missing values
print("\n--- Missing Values ---")
print(df.isnull().sum())

# 6. Duplicate records
print("\n--- Duplicate Records ---")
print(df.duplicated().sum())

# 7. Fraud distribution
print("\n--- Fraud Distribution ---")
print(df["isFraud"].value_counts())

print("\n--- Fraud Percentage ---")
print(df["isFraud"].value_counts(normalize=True) * 100)


# 8. Transaction type distribution
print("\n--- Transaction Types ---")
print(df["type"].value_counts())

# 9. Fraud by transaction type
print("\n--- Fraud by Transaction Type ---")
print(
    df.groupby("type")["isFraud"]
    .agg(["count", "sum"])
    .rename(columns={"sum": "fraud_count"})
)

# 10. Fraud amount statistics
print("\n--- Fraud Transaction Amounts ---")
print(
    df[df["isFraud"] == 1]["amount"].describe()
)

# 11. Check target values
print("\n--- Target Values ---")
print(df["isFraud"].unique())
