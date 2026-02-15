from pydantic import BaseModel

class BookingBase(BaseModel):
    user_id: int
    van_id: int
    status: str
    pickup_location: str
    dropoff_location: str
    scheduled_time: str
    van_size: str
    time_slot: str
    distance: str | None = None
    duration_minutes: int | None = None
    toll: float = 0.0

class BookingCreate(BookingBase):
    pass

class BookingOut(BookingBase):
    id: int
    fare: float | None = None
    model_config = {"from_attributes": True}
