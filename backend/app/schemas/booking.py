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

class BookingCreate(BookingBase):
    pass

class BookingOut(BookingBase):
    id: int
    model_config = {"from_attributes": True}
