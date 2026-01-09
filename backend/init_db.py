"""
Database initialization script
Creates demo users for testing
"""
from database import SessionLocal, engine, Base
from models import User, UserRole
import bcrypt

# Create all tables
Base.metadata.create_all(bind=engine)

# Hash password helper
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def init_demo_users():
    db = SessionLocal()
    try:
        # Check if users already exist
        existing_admin = db.query(User).filter(User.email == 'admin@brgykorokan.gov.ph').first()
        if existing_admin:
            print("Demo users already exist. Skipping initialization.")
            return
        
        # Create demo users
        users = [
            User(
                email='admin@brgykorokan.gov.ph',
                password_hash=hash_password('admin123'),
                name='Barangay Captain',
                role=UserRole.ADMIN,
                phone='+63 912 345 6789',
                address='Barangay Hall'
            ),
            User(
                email='official@brgykorokan.gov.ph',
                password_hash=hash_password('official123'),
                name='Barangay Secretary',
                role=UserRole.OFFICIAL,
                phone='+63 912 345 6790',
                address='Barangay Hall'
            ),
            User(
                email='pedro@gmail.com',
                password_hash=hash_password('resident123'),
                name='Pedro Santos',
                role=UserRole.RESIDENT,
                phone='+63 912 345 6791',
                address='Zone 3, Barangay Korokan'
            ),
        ]
        
        for user in users:
            db.add(user)
        
        db.commit()
        print("✅ Demo users created successfully!")
        print("\nLogin credentials:")
        print("Admin: admin@brgykorokan.gov.ph / admin123")
        print("Official: official@brgykorokan.gov.ph / official123")
        print("Resident: pedro@gmail.com / resident123")
        
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("Initializing database...")
    init_demo_users()


