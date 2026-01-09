from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# MySQL connection string
# Format: mysql+pymysql://user:password@host:port/database
DATABASE_URL = os.getenv(
    'DATABASE_URL',
    'mysql+pymysql://root:password@localhost:3306/andreabrgy'
)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Verify connections before using
    pool_recycle=300,    # Recycle connections after 5 minutes
    pool_size=10,        # Base pool size
    max_overflow=20,     # Max connections beyond pool_size
    echo=False,          # Set to True for SQL query logging (debug only)
    connect_args={
        "connect_timeout": 5,  # Connection timeout in seconds
    }
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


