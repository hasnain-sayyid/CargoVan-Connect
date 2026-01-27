from sqlalchemy import Column, Integer, String, ForeignKey
from app.db.database import Base

class Van(Base):
    __tablename__ = "vans"
    id = Column(Integer, primary_key=True, index=True)
    size = Column(String)
    owner_id = Column(Integer, ForeignKey("users.id"))
