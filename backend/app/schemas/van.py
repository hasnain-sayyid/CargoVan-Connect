from pydantic import BaseModel

class VanBase(BaseModel):
    size: str
    owner_id: int

class VanCreate(VanBase):
    pass

class VanOut(VanBase):
    id: int
    class Config:
        from_attributes = True
