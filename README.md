# FinSecure – AI & Machine Learning Based Financial Fraud Detection System

<p align="center">
  <strong>Intelligent Financial Transaction Monitoring and Fraud Detection</strong>
</p>

##  Project Overview

FinSecure is an AI and Machine Learning based financial fraud detection system designed to identify potentially fraudulent transactions and help improve transaction security.

The system combines **Rule-Based Fraud Detection** and **Machine Learning Classification** to analyze financial transactions, calculate risk levels, and identify suspicious activities.

It provides a secure user authentication system and an interactive dashboard where users can analyze transactions, monitor fraud statistics, view transaction history, and download reports.

##  Objectives

- Detect suspicious and potentially fraudulent financial transactions.
- Combine rule-based analysis with machine learning predictions.
- Provide real-time transaction risk analysis through an API.
- Secure user accounts using password hashing and JWT authentication.
- Display transaction statistics through an interactive dashboard.
- Maintain user-specific transaction records.

##  Key Features

### 1. User Authentication
- User registration and login.
- Password hashing using Argon2.
- JWT-based authentication.
- Protected API endpoints.
- User-specific transaction history.


### 2. Rule-Based Fraud Detection

FinSecure uses predefined rules to identify suspicious
financial transactions.

The rule-based engine evaluates:

- Transaction amount.
- Transaction location.
- Sender balance consistency for TRANSFER and CASH_OUT transactions.

**Transaction Amount Analysis:**

Higher transaction amounts contribute to higher risk scores.

**Location Analysis:**

Transactions from locations outside the configured list
receive an additional risk score.

**Balance Consistency Analysis:**

For supported transaction types, the system checks whether
the sender's balance change is consistent with the
transaction amount.

Unexpected balance differences can increase the risk score.

**Risk Classification:**

| Risk Score | Decision |
|---|---|
| 0–29 | ALLOW |
| 30–69 | VERIFY |
| 70–100 | BLOCK |

The system also returns risk indicators explaining
which rules contributed to the decision.

Rule-based decisions and machine learning predictions
are displayed separately.


### 3. Machine Learning Fraud Detection
- Uses a trained Random Forest classification model.
- Predicts whether a transaction is:
  - LEGITIMATE
  - FRAUDULENT
- Calculates a fraud probability.
- Uses a trained model saved with Joblib.

### 4. Interactive Dashboard
- Total transaction statistics.
- Allowed, blocked and verification transaction counts.
- Fraud detection results.
- Transaction history.
- Data visualizations and charts.

### 5. Transaction Management
- Transaction search and filtering.
- Sorting and pagination.
- Detailed transaction information.
- CSV and PDF report downloads.

### 6. Input Validation and Security
- Frontend and backend input validation.
- Protected transaction APIs.
- Secure password storage.
- Environment-based JWT secret configuration.

##  Technologies Used

| Category | Technologies |
|---|---|
| Frontend | React.js, JavaScript, HTML, CSS |
| Backend | Python, FastAPI |
| Database | SQLite, SQLAlchemy |
| Machine Learning | Scikit-learn, Random Forest |
| Data Processing | Pandas, NumPy |
| Authentication | JWT, Argon2 |
| Model Storage | Joblib |
| API Testing | FastAPI Swagger UI |
| Version Control | Git, GitHub |

##  System Architecture

```text
              USER
                |
                v
       REACT FRONTEND
                |
                v
        FASTAPI BACKEND
                |
        +-------+-------+
        |               |
        v               v
  RULE-BASED         MACHINE
  DETECTION          LEARNING
        |               |
        v               v
   RISK SCORE       FRAUD
   & DECISION       PREDICTION
        |               |
        +-------+-------+
                |
                v
         SQLITE DATABASE
                |
                v
       INTERACTIVE DASHBOARD
                |
                v
       REPORT GENERATION
```

## How the System Works

1. The user registers or logs into FinSecure.
2. The user enters transaction details.
3. The frontend sends transaction information to the FastAPI backend.
4. The rule-based engine evaluates predefined risk conditions.
5. The trained Random Forest model predicts the transaction class and fraud probability.
6. The system returns both detection results.
7. The transaction is stored with its associated user account.
8. The dashboard displays the analysis and transaction statistics.

## Machine Learning Model

FinSecure uses a Random Forest classifier for financial fraud detection.


## Machine Learning Evaluation

FinSecure includes an experimental Random Forest model evaluated
using the PaySim financial transaction dataset.

### Dataset Information

- Total original transactions: 6,362,620
- Training transactions: 106,570
- Testing transactions: 1,272,524
- Fraud percentage in test data: 0.1291%

The experimental evaluation uses a stratified train/test split
performed before sampling the training data.

### Evaluation Results

| Metric | Result |
|---|---|
| Fraud Precision | 0.93 |
| Fraud Recall | 1.00 (rounded) |
| Fraud F1-Score | 0.96 |
| ROC-AUC | 0.999562 |
| Average Precision (PR-AUC) | 0.998706 |
| True Positives | 1,640 |
| True Negatives | 1,270,765 |
| False Positives | 116 |
| False Negatives | 3 |

### Model Features

The Random Forest model uses 10 features:

1. Transaction type
2. Transaction amount
3. Sender's old balance
4. Sender's new balance
5. Receiver's old balance
6. Receiver's new balance
7. Sender balance change
8. Receiver balance change
9. Sender balance error
10. Receiver balance error

### Evaluation Notes

- The evaluation uses simulated PaySim transactions.
- The test set retains the original dataset's fraud proportion.
- The results do not establish performance on real-world banking data.
- Model probabilities have not been independently calibrated.
- The experimental model is stored separately from the working model.

Detailed evaluation results are available in
`reports/model_evaluation.txt`.


**Dataset:** PaySim Financial Transaction Dataset.

The dataset contains simulated financial transactions with fraud labels.


**Machine Learning Workflow:**

1. Dataset inspection.
2. Data preprocessing.
3. Feature preparation.
4. Training and testing split.
5. Random Forest model training.
6. Model evaluation.
7. Model serialization using Joblib.
8. Integration with the FastAPI backend.

**Note:** The trained model is included in this repository. The original and processed CSV datasets are excluded because of their large file sizes.

The model's predictions are experimental and should not be treated as verified real-world fraud decisions.

## Project Structure

```text
FinSecure/
│
├── backend/
│   ├── auth.py
|   |- compare_models.py
│   ├── main.py
│   ├── models.py
│   └── train_model.py
│
├── data/
│   ├── inspect_data.py
│   └── prepare_data.py
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── AuthPage.jsx
│   │   └── Authpage.css
│   └── package.json
│
├── models/
│   └── finsecure_fraud_model.joblib
|   reports/
    model_evaluation.txt
│
├── database.py
├── package.json
├── package-lock.json
└── .gitignore
```

## Installation and Setup

### Prerequisites

- Python 3.10 or later
- Node.js and npm
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/sakshi-yadav-vv/Finsecure.git
cd Finsecure
```

### 2. Set Up the Backend

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it on Windows:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install the backend dependencies:

```bash
pip install fastapi uvicorn sqlalchemy "pwdlib[argon2]" PyJWT pandas numpy scikit-learn joblib
```

### 3. Configure the Secret Key

Generate a secure random key:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

Set the environment variable in PowerShell:

```powershell
$env:FINSECURE_SECRET_KEY = "YOUR_GENERATED_SECRET_KEY"
```

Never commit your actual secret key to GitHub.

### 4. Start the Backend

```bash
python -m uvicorn backend.main:app --reload
```

Backend:

`http://127.0.0.1:8000`

API Documentation:

`http://127.0.0.1:8000/docs`

### 5. Set Up the Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the frontend URL displayed in the terminal, usually:

`http://localhost:5173`

## Model and Dataset

The project uses the PaySim dataset for model training.

The dataset is not included in this repository due to its large size.

To retrain the model, obtain the PaySim dataset and place it at:

```text
data/paysim.csv
```

Then run the data preparation and model training scripts:

```bash
python data/inspect_data.py
python data/prepare_data.py
python backend/train_model.py
```

The trained model should be saved in the `models/` directory.

## Security Considerations

- Passwords are stored as Argon2 hashes.
- JWT tokens are used for authentication.
- Protected endpoints require valid authentication.
- Transactions are associated with individual user accounts.
- Secret keys are configured through environment variables.
- Database files and sensitive configuration files are excluded from version control.

## Future Enhancements

- Integration with real-time financial transaction systems.
- Advanced anomaly detection techniques.
- Improved fraud detection using additional machine learning algorithms.
- Model monitoring and performance tracking.
- More advanced transaction behavior analysis.
- Deployment on a cloud platform.
- Improved explainability of machine learning predictions.
