from pydantic import BaseModel


class UserBase(BaseModel):
    email: str
    name: str
    role: str

class UserCreate(UserBase):
    password: str

class UserOut(UserBase):
    id: int
    model_config = {"from_attributes": True}
