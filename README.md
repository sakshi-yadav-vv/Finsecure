# FinSecure – AI & Machine Learning Based Financial Fraud Detection System

<p align="center">
  <strong>Intelligent Financial Transaction Monitoring and Fraud Detection</strong>
</p>

## 📌 Project Overview

FinSecure is an AI and Machine Learning based financial fraud detection system designed to identify potentially fraudulent transactions and help improve transaction security.

The system combines **Rule-Based Fraud Detection** and **Machine Learning Classification** to analyze financial transactions, calculate risk levels, and identify suspicious activities.

It provides a secure user authentication system and an interactive dashboard where users can analyze transactions, monitor fraud statistics, view transaction history, and download reports.

## 🎯 Objectives

- Detect suspicious and potentially fraudulent financial transactions.
- Combine rule-based analysis with machine learning predictions.
- Provide real-time transaction risk analysis through an API.
- Secure user accounts using password hashing and JWT authentication.
- Display transaction statistics through an interactive dashboard.
- Maintain user-specific transaction records.

## ✨ Key Features

### 1. User Authentication
- User registration and login.
- Password hashing using Argon2.
- JWT-based authentication.
- Protected API endpoints.
- User-specific transaction history.

### 2. Rule-Based Fraud Detection
- Evaluates transactions using predefined risk conditions.
- Considers transaction amount and location.
- Generates a risk score.
- Classifies transactions into:
  - ALLOW
  - VERIFY
  - BLOCK

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

## 🛠️ Technologies Used

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

## 🏗️ System Architecture

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

## 🔄 How the System Works

1. The user registers or logs into FinSecure.
2. The user enters transaction details.
3. The frontend sends transaction information to the FastAPI backend.
4. The rule-based engine evaluates predefined risk conditions.
5. The trained Random Forest model predicts the transaction class and fraud probability.
6. The system returns both detection results.
7. The transaction is stored with its associated user account.
8. The dashboard displays the analysis and transaction statistics.

## 🤖 Machine Learning Model

FinSecure uses a Random Forest classifier for financial fraud detection.

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

## 📂 Project Structure

```text
FinSecure/
│
├── backend/
│   ├── auth.py
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
│
├── database.py
├── package.json
├── package-lock.json
└── .gitignore
```

## ⚙️ Installation and Setup

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

## 📊 Model and Dataset

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

## 🔐 Security Considerations

- Passwords are stored as Argon2 hashes.
- JWT tokens are used for authentication.
- Protected endpoints require valid authentication.
- Transactions are associated with individual user accounts.
- Secret keys are configured through environment variables.
- Database files and sensitive configuration files are excluded from version control.

## 🚀 Future Enhancements

- Integration with real-time financial transaction systems.
- Advanced anomaly detection techniques.
- Improved fraud detection using additional machine learning algorithms.
- Model monitoring and performance tracking.
- More advanced transaction behavior analysis.
- Deployment on a cloud platform.
- Improved explainability of machine learning predictions.

## 👩‍💻 Developer

**Sakshi Yadav**

Computer Science and Engineering

GitHub: [sakshi-yadav-vv](https://github.com/sakshi-yadav-vv)

## 📜 Disclaimer

FinSecure is an academic project developed for educational and demonstration purposes. It uses simulated financial transaction data and should not be used as a production banking fraud prevention system without further testing, validation, security reviews and regulatory compliance.

---

<p align="center">
  <strong>FinSecure – Making Financial Transactions Smarter and Safer.</strong>
</p>