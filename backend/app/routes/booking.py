from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.booking import Booking
from app.schemas.booking import BookingCreate, BookingOut

router = APIRouter()

@router.post("/", response_model=BookingOut)
def create_booking(booking: BookingCreate, db: Session = Depends(get_db)):
    # Calculate Fare
    # Base: $20
    # Mile: $2
    # Minute: $0.50
    # Toll: User input
    
    try:
        # Handle cases where distance might contain units like "6.3 miles" or "10 km"
        dist_str = booking.distance if booking.distance else "0.0"
        dist = float(dist_str.split()[0]) 
    except (ValueError, IndexError):
        dist = 0.0
        
    duration = booking.duration_minutes if booking.duration_minutes else 0
    toll = booking.toll if booking.toll else 0.0
    
    calculated_fare = 20.0 + (2.0 * dist) + (0.50 * duration) + toll
    
    booking_data = booking.dict()
    booking_data['fare'] = round(calculated_fare, 2)
    
    new_booking = Booking(**booking_data)
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    return new_booking


@router.get("/", response_model=list[BookingOut])
def list_bookings(db: Session = Depends(get_db)):
    bookings = db.query(Booking).all()
    # Ensure every booking has a fare (calculate on the fly if missing)
    for b in bookings:
        if b.fare is None:
            try:
                dist_str = b.distance if b.distance else "0.0"
                dist = float(dist_str.split()[0])
            except (ValueError, IndexError):
                dist = 0.0
            
            duration = b.duration_minutes if b.duration_minutes else 0
            toll = b.toll if b.toll else 0.0
            b.fare = round(20.0 + (2.0 * dist) + (0.50 * duration) + toll, 2)
    return bookings

# Driver actions: accept, reject, complete
@router.patch("/{booking_id}/status", response_model=BookingOut)
def update_booking_status(booking_id: int, status: str, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    booking.status = status
    db.commit()
    db.refresh(booking)
    return booking
