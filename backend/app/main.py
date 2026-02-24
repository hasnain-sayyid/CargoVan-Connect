

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import user, booking
from app.db.init_db import Base
from app.db.database import engine



from app.db.migrate import migrate_db
from app.db.database import engine, DB_PATH

app = FastAPI()

# Create tables automatically on startup (safe for SQLite)
@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    # Ensure missing columns are added to existing tables
    migrate_db(DB_PATH)

# Allow CORS for frontend dev servers
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:3001",
        "https://cargovan-frontend.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(user.router, prefix="/users", tags=["users"])
app.include_router(booking.router, prefix="/bookings", tags=["bookings"])

@app.get("/debug/schema")
def debug_schema():
    import sqlite3
    import os
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(bookings)")
        columns = cursor.fetchall()
        conn.close()
        return {
            "columns": columns, 
            "db_path": DB_PATH, 
            "exists": os.path.exists(DB_PATH),
            "cwd": os.getcwd()
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/")
def root():
    return {"message": "CargoVan Connect API (FastAPI)"}
