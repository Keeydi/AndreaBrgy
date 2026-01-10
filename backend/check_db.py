"""
Database diagnostic script
Checks if database is set up correctly and users exist
"""
from database import SessionLocal, engine
from models import User, Base
import sys

def check_database():
    print("=" * 50)
    print("Database Diagnostic Check")
    print("=" * 50)
    
    # Check connection
    try:
        with engine.connect() as conn:
            print("✅ Database connection successful")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        print("\nMake sure:")
        print("1. MySQL server is running")
        print("2. Database 'andreabrgy' exists")
        print("3. DATABASE_URL in .env is correct")
        return False
    
    # Check tables exist
    try:
        db = SessionLocal()
        # Try to query users table
        user_count = db.query(User).count()
        print(f"✅ Database tables exist")
        print(f"✅ Found {user_count} user(s) in database")
        
        if user_count == 0:
            print("\n⚠️  No users found in database!")
            print("Run: python init_db.py")
            return False
        
        # List all users
        print("\n📋 Users in database:")
        users = db.query(User).all()
        for user in users:
            print(f"  - {user.email} ({user.role.value}) - {user.name}")
        
        db.close()
        return True
        
    except Exception as e:
        print(f"❌ Error querying database: {e}")
        print("\nTry running: python init_db.py")
        return False

if __name__ == "__main__":
    success = check_database()
    if not success:
        sys.exit(1)
    print("\n✅ Database is ready!")







