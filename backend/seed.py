
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.van import Van
from app.auth import get_password_hash

def seed_data():
    db = SessionLocal()
    # Check if user exists
    user = db.query(User).filter(User.email == "driver@example.com").first()
    if not user:
        print("Creating test user...")
        user = User(
            email="driver@example.com",
            hashed_password=get_password_hash("password123"),
            name="Test Driver",
            role="driver"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        print("Test user already exists.")

    # Check if van exists
    van = db.query(Van).filter(Van.owner_id == user.id).first()
    if not van:
        print("Creating test van...")
        van = Van(
            size="large",
            owner_id=user.id
        )
        db.add(van)
        db.commit()
        db.refresh(van)
    else:
        print("Test van already exists.")
        
    db.close()

if __name__ == "__main__":
    print("Seeding database...")
    Base.metadata.create_all(bind=engine)
    seed_data()
    print("Seeding complete.")
