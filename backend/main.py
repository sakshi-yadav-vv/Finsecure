import json
import joblib
import os
import pandas as pd
from database import Base, engine, SessionLocal
from backend import models
from pydantic import BaseModel
from sqlalchemy.orm import Session
from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from backend.auth import (
    hash_password,
    verify_password,
    create_access_token,
    verify_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

from backend.auth import (
    hash_password,
    verify_password,
    create_access_token,
    verify_access_token,
)
app = FastAPI(title="FinSecure API")
MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "..",
    "models",
    "finsecure_fraud_model.joblib"
)

ml_model = joblib.load(MODEL_PATH)

print("FinSecure ML model loaded successfully!")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)  

Base.metadata.create_all(bind=engine)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    user_id = verify_access_token(credentials.credentials)

    if user_id is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
        )

    user = db.query(models.User).filter(
        models.User.id == user_id
    ).first()

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User not found",
        )

    return user        

# API Endpoints
@app.get("/")
def home():
    return {
        "message": "Welcome to FinSecure",
        "status": "running"
    }


# API endpoint to check transaction status
@app.get("/transaction")
def check_transaction():
    return {
        "sender": "User123",
        "receiver": "User456",
        "amount": 5000,
        "status": "Received for analysis"
        
    }


from pydantic import BaseModel

class Transaction(BaseModel):
    sender: str
    receiver: str
    amount: float
    location: str

    type: str
    oldbalanceOrg: float
    newbalanceOrig: float
    oldbalanceDest: float
    newbalanceDest: float


class RegisterRequest(BaseModel):
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


# In-memory transaction history for demonstration purposes
transaction_history = []
@app.post("/analyze")
def analyze_transaction(
    transaction: Transaction,
    current_user: models.User = Depends(get_current_user),
):
    # Existing rule-based detection
    risk_score = 0
    risk_factors = []

    amount = transaction.amount

    if amount >= 100000:
        risk_score += 80
        risk_factors.append("Extremely high transaction amount")
    elif amount >= 70000:
        risk_score += 65
        risk_factors.append("Very high transaction amount")
    elif amount >= 50000:
        risk_score += 50
        risk_factors.append("High transaction amount")
    elif amount >= 20000:
        risk_score += 30
        risk_factors.append("Moderately high transaction amount")
    elif amount >= 10000:
        risk_score += 15
        risk_factors.append("Elevated transaction amount")

    location = transaction.location.strip().lower()

    if location not in ["delhi", "ludhiana", "ambala"]:
        risk_score += 15
        risk_factors.append("Location requires additional review")

    risk_score = min(risk_score, 100)

    # ML fraud detection
    ml_input = pd.DataFrame([{
        "type": transaction.type,
        "amount": transaction.amount,
        "oldbalanceOrg": transaction.oldbalanceOrg,
        "newbalanceOrig": transaction.newbalanceOrig,
        "oldbalanceDest": transaction.oldbalanceDest,
        "newbalanceDest": transaction.newbalanceDest
    }])

    ml_prediction_value = int(ml_model.predict(ml_input)[0])
    ml_probability = float(
        ml_model.predict_proba(ml_input)[0][1]
    )

    ml_prediction = (
        "FRAUDULENT" if ml_prediction_value == 1
        else "LEGITIMATE"
    )

    # Existing rule-based decision
    if risk_score >= 70:
        decision = "BLOCK"
    elif risk_score >= 30:
        decision = "VERIFY"
    else:
        decision = "ALLOW"

    # Save transaction
    db = SessionLocal()

    try:
        record = models.TransactionRecord(
        sender=transaction.sender,
        receiver=transaction.receiver,
        amount=transaction.amount,
        location=transaction.location,
        risk_score=risk_score,
        decision=decision,
        reasons=json.dumps(risk_factors),
        ml_prediction=ml_prediction,
        ml_fraud_probability=round(ml_probability * 100, 2),
        user_id=current_user.id
   )
        

        db.add(record)
        db.commit()
        db.refresh(record)

        return {
            "id": record.id,
            "sender": record.sender,
            "receiver": record.receiver,
            "amount": record.amount,
            "location": record.location,
            "risk_score": record.risk_score,
            "decision": record.decision,
            "reasons": risk_factors,
            "user_id": record.user_id,
            "ml_prediction": ml_prediction,
            "ml_fraud_probability": round(ml_probability * 100, 2)
        }

    finally:
        db.close()


# Get all transactions

@app.get("/transactions")
def get_transactions(
    current_user: models.User = Depends(get_current_user),
):
    db = SessionLocal()

    try:
        records = (
            db.query(models.TransactionRecord)
            .filter(
                models.TransactionRecord.user_id == current_user.id
            )
            .order_by(models.TransactionRecord.id.desc())
            .all()
        )

        return {
            "total_transactions": len(records),
            "transactions": [
                {
                    "id": record.id,
                    "sender": record.sender,
                    "receiver": record.receiver,
                    "amount": record.amount,
                    "location": record.location,
                    "risk_score": record.risk_score,
                    "decision": record.decision,
                    "reasons": json.loads(record.reasons),
                    "ml_prediction": record.ml_prediction,
                    "ml_fraud_probability": record.ml_fraud_probability,
                    "created_at": record.created_at.isoformat()
                    if record.created_at else None,
                }
                for record in records
            ]
        }

    finally:
        db.close()


# Get statistics

@app.get("/statistics")
def get_statistics(
    current_user: models.User = Depends(get_current_user),
):
    db = SessionLocal()

    try:
        user_transactions = db.query(
            models.TransactionRecord
        ).filter(
            models.TransactionRecord.user_id == current_user.id
        )

        total_transactions = user_transactions.count()

        blocked = user_transactions.filter(
            models.TransactionRecord.decision == "BLOCK"
        ).count()

        needs_verification = user_transactions.filter(
            models.TransactionRecord.decision == "VERIFY"
        ).count()

        allowed = user_transactions.filter(
            models.TransactionRecord.decision == "ALLOW"
        ).count()

        return {
            "total_transactions": total_transactions,
            "blocked": blocked,
            "needs_verification": needs_verification,
            "allowed": allowed
        }

    finally:
        db.close()



@app.get("/me")
def read_current_user(
    current_user: models.User = Depends(get_current_user),
):
    return {
        "id": current_user.id,
        "email": current_user.email,
    }



@app.post("/register")
def register_user(user: RegisterRequest):
    email = user.email.strip().lower()

    if "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(status_code=400, detail="Invalid email address")

    if len(user.password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least 8 characters"
        )

    db = SessionLocal()

    try:
        existing_user = db.query(models.User).filter(
            models.User.email == email
        ).first()

        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email is already registered"
            )

        new_user = models.User(
            email=email,
            hashed_password=hash_password(user.password)
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return {
            "message": "Account created successfully",
            "user_id": new_user.id
        }

    finally:
        db.close()


@app.post("/login")
def login_user(user: LoginRequest):
    email = user.email.strip().lower()

    db = SessionLocal()

    try:
        existing_user = db.query(models.User).filter(
            models.User.email == email
        ).first()

        if not existing_user or not verify_password(
            user.password,
            existing_user.hashed_password
        ):
            raise HTTPException(
                status_code=401,
                detail="Incorrect email or password"
            )

        access_token = create_access_token(existing_user.id)

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_id":existing_user.id,
            "email": existing_user.email,
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60  # Convert minutes to seconds
        }

    finally:
        db.close()


@app.get("/me")
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    user_id = verify_access_token(credentials.credentials)

    if user_id is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired login token"
        )

    db = SessionLocal()

    try:
        user = db.query(models.User).filter(
            models.User.id == user_id
        ).first()

        if not user:
            raise HTTPException(
                status_code=401,
                detail="User not found"
            )

        return {
            "id": user.id,
            "email": user.email
        }

    finally:
        db.close()


 
