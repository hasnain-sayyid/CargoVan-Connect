from app.db.database import Base, engine
from app.models import user, booking

# Create all tables
Base.metadata.create_all(bind=engine)
