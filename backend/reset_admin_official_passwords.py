"""
Script to reset passwords for Admin and Official users
This will generate new password hashes and update the database
"""
import bcrypt
from database import SessionLocal
from models import User, UserRole

def hash_password(password: str) -> str:
    """Generate bcrypt hash for a password."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def reset_passwords_for_role(role: UserRole, new_password: str = None):
    """
    Reset passwords for all users with the specified role.
    If new_password is not provided, generates default passwords.
    """
    db = SessionLocal()
    try:
        # Find all users with the specified role
        users = db.query(User).filter(User.role == role).all()
        
        if not users:
            print(f"No users found with role: {role.value}")
            return
        
        print(f"\n{'=' * 60}")
        print(f"Resetting passwords for {role.value} users")
        print(f"{'=' * 60}\n")
        
        # Generate default passwords if not provided
        if new_password is None:
            if role == UserRole.ADMIN:
                new_password = "Admin123"
            elif role == UserRole.OFFICIAL:
                new_password = "Official123"
            else:
                new_password = "Password123"
        
        # Hash the new password
        hashed_password = hash_password(new_password)
        
        updated_users = []
        for user in users:
            user.password_hash = hashed_password
            updated_users.append({
                'id': user.id,
                'email': user.email,
                'name': user.name,
                'role': user.role.value
            })
        
        db.commit()
        
        print(f"Successfully updated {len(updated_users)} user(s):\n")
        for user_info in updated_users:
            print(f"  - {user_info['name']} ({user_info['email']})")
        
        print(f"\nNew password for all {role.value} users: {new_password}")
        print(f"\n⚠️  IMPORTANT: Share this password securely with the users!")
        print(f"{'=' * 60}\n")
        
    except Exception as e:
        db.rollback()
        print(f"Error resetting passwords: {e}")
        raise
    finally:
        db.close()

def reset_individual_user_password(email: str, new_password: str):
    """
    Reset password for a specific user by email.
    """
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email.lower()).first()
        
        if not user:
            print(f"User with email {email} not found.")
            return
        
        hashed_password = hash_password(new_password)
        user.password_hash = hashed_password
        
        db.commit()
        
        print(f"\n{'=' * 60}")
        print(f"Password reset successful")
        print(f"{'=' * 60}\n")
        print(f"User: {user.name} ({user.email})")
        print(f"Role: {user.role.value}")
        print(f"New password: {new_password}")
        print(f"\n⚠️  IMPORTANT: Share this password securely with the user!")
        print(f"{'=' * 60}\n")
        
    except Exception as e:
        db.rollback()
        print(f"Error resetting password: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    import sys
    
    print("=" * 60)
    print("Password Reset Tool for Admin and Official Users")
    print("=" * 60)
    
    if len(sys.argv) > 1:
        # Command line mode
        if sys.argv[1] == "--admin":
            password = sys.argv[2] if len(sys.argv) > 2 else None
            reset_passwords_for_role(UserRole.ADMIN, password)
        elif sys.argv[1] == "--official":
            password = sys.argv[2] if len(sys.argv) > 2 else None
            reset_passwords_for_role(UserRole.OFFICIAL, password)
        elif sys.argv[1] == "--user" and len(sys.argv) >= 4:
            email = sys.argv[2]
            password = sys.argv[3]
            reset_individual_user_password(email, password)
        else:
            print("\nUsage:")
            print("  python reset_admin_official_passwords.py --admin [password]")
            print("  python reset_admin_official_passwords.py --official [password]")
            print("  python reset_admin_official_passwords.py --user <email> <password>")
            print("\nIf password is not provided, default passwords will be used:")
            print("  Admin: Admin123")
            print("  Official: Official123")
    else:
        # Interactive mode
        print("\nSelect an option:")
        print("1. Reset all Admin passwords")
        print("2. Reset all Official passwords")
        print("3. Reset password for specific user")
        print("4. Reset both Admin and Official passwords")
        
        choice = input("\nEnter your choice (1-4): ").strip()
        
        if choice == "1":
            password = input("Enter new password (or press Enter for default 'Admin123'): ").strip()
            reset_passwords_for_role(UserRole.ADMIN, password if password else None)
        elif choice == "2":
            password = input("Enter new password (or press Enter for default 'Official123'): ").strip()
            reset_passwords_for_role(UserRole.OFFICIAL, password if password else None)
        elif choice == "3":
            email = input("Enter user email: ").strip()
            password = input("Enter new password: ").strip()
            if not password:
                print("Password is required!")
            else:
                reset_individual_user_password(email, password)
        elif choice == "4":
            admin_password = input("Enter new password for Admins (or press Enter for default 'Admin123'): ").strip()
            official_password = input("Enter new password for Officials (or press Enter for default 'Official123'): ").strip()
            reset_passwords_for_role(UserRole.ADMIN, admin_password if admin_password else None)
            reset_passwords_for_role(UserRole.OFFICIAL, official_password if official_password else None)
        else:
            print("Invalid choice!")

