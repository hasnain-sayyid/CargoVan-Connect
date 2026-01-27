from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Go up two levels to reach 'backend' root if we want db there, or just keep it in db folder.
# Current: sqlite:///./cargovanconnect.db implies it's in the CWD.
# Let's put it in the backend root directory (parent of 'app').
BACKEND_DIR = os.path.dirname(os.path.dirname(BASE_DIR))
DB_PATH = os.path.join(BACKEND_DIR, "cargovanconnect.db")

SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
