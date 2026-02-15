from sqlalchemy import Column, Integer, String, ForeignKey, Float
from app.db.database import Base

class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    van_id = Column(Integer)
    status = Column(String)
    pickup_location = Column(String)
    dropoff_location = Column(String)
    scheduled_time = Column(String)
    van_size = Column(String)
    time_slot = Column(String)
    distance = Column(String, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    toll = Column(Float, default=0.0)
    fare = Column(Float, nullable=True)
