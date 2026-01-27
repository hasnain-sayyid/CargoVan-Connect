

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import user, booking
from app.db.init_db import Base
from app.db.database import engine



app = FastAPI()

# Create tables automatically on startup (safe for SQLite)
@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)

# Allow CORS for frontend dev servers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(user.router, prefix="/users", tags=["users"])
app.include_router(booking.router, prefix="/bookings", tags=["bookings"])

@app.get("/")
def root():
    return {"message": "CargoVan Connect API (FastAPI)"}
