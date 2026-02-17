import sys
import os

# Add the backend directory to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlalchemy.orm import Session
from app.db.database import get_db, SessionLocal
from app.routes.booking import list_bookings
from app.schemas.booking import BookingOut

# Mocking Depends(get_db)
db = SessionLocal()
try:
    print("Calling list_bookings()...")
    bookings = list_bookings(db)
    print(f"Returned {len(bookings)} bookings.")
    if bookings:
        first = bookings[0]
        # In a real FastAPI app, the response_model takes care of this.
        # Let's see what happens if we manually validate
        try:
            validated = BookingOut.model_validate(first)
            print("Validation successful!")
            print(f"Validated fare: {validated.fare}")
            print(f"Validated distance: {validated.distance}")
            print(f"Raw data from object - fare: {first.fare}, distance: {first.distance}")
        except Exception as ve:
            print(f"Validation failed: {ve}")
finally:
    db.close()
