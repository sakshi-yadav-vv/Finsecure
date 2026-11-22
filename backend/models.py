from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from datetime import datetime
from database import Base

class TransactionRecord(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    sender = Column(String, nullable=False)
    receiver = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    location = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    risk_score = Column(Integer, nullable=False)
    decision = Column(String, nullable=False)
    reasons = Column(String, nullable=False)
    
    ml_prediction = Column(String, nullable=True)
    ml_fraud_probability = Column(Float, nullable=True)
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)


# User model for authentication
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.now, nullable=False)


