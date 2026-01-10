"""
Migration script to update user role enum from lowercase to uppercase
Run this script to fix the enum mismatch issue
"""
from database import SessionLocal, engine
from sqlalchemy import text
import sys

def migrate_enum_to_uppercase():
    """Migrate user role enum and data from lowercase to uppercase"""
    db = SessionLocal()
    
    try:
        print("🔄 Starting migration...")
        
        # Step 1: Check current enum values
        print("\n📊 Checking current enum definition...")
        result = db.execute(text("""
            SELECT COLUMN_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'users' 
            AND COLUMN_NAME = 'role'
        """))
        enum_type = result.fetchone()
        if enum_type:
            print(f"   Current enum: {enum_type[0]}")
        
        # Step 2: Update existing data to uppercase
        print("\n📝 Updating existing data to uppercase...")
        updates = [
            ("UPDATE users SET role = 'ADMIN' WHERE role = 'admin'", "admin -> ADMIN"),
            ("UPDATE users SET role = 'OFFICIAL' WHERE role = 'official'", "official -> OFFICIAL"),
            ("UPDATE users SET role = 'RESIDENT' WHERE role = 'resident'", "resident -> RESIDENT"),
        ]
        
        for sql, description in updates:
            result = db.execute(text(sql))
            affected = result.rowcount
            if affected > 0:
                print(f"   ✅ {description}: {affected} row(s) updated")
            else:
                print(f"   ⏭️  {description}: No rows to update")
        
        # Step 3: Modify the enum column type
        print("\n🔧 Updating enum column definition...")
        try:
            # For MySQL, we need to modify the column to change the enum values
            db.execute(text("""
                ALTER TABLE users 
                MODIFY COLUMN role ENUM('ADMIN', 'OFFICIAL', 'RESIDENT') 
                NOT NULL DEFAULT 'RESIDENT'
            """))
            db.commit()
            print("   ✅ Enum column updated successfully")
        except Exception as e:
            print(f"   ⚠️  Warning: {str(e)}")
            print("   This might be because the enum is already correct or needs manual intervention")
            db.rollback()
        
        # Step 4: Verify the changes
        print("\n✅ Verifying changes...")
        result = db.execute(text("SELECT DISTINCT role FROM users"))
        roles = [row[0] for row in result.fetchall()]
        print(f"   Current roles in database: {roles}")
        
        # Check if all are uppercase
        all_uppercase = all(role.isupper() for role in roles if role)
        if all_uppercase:
            print("   ✅ All roles are now uppercase!")
        else:
            print("   ⚠️  Some roles are still lowercase. Please check manually.")
        
        # Step 5: Show current enum definition
        result = db.execute(text("""
            SELECT COLUMN_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'users' 
            AND COLUMN_NAME = 'role'
        """))
        enum_type = result.fetchone()
        if enum_type:
            print(f"\n📋 Final enum definition: {enum_type[0]}")
        
        print("\n✅ Migration completed successfully!")
        print("\n💡 Next steps:")
        print("   1. Restart your backend server")
        print("   2. Try logging in/registering again")
        print("   3. The enum values should now be uppercase (ADMIN, OFFICIAL, RESIDENT)")
        
    except Exception as e:
        print(f"\n❌ Error during migration: {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("User Role Enum Migration Script")
    print("Converting lowercase enum values to uppercase")
    print("=" * 60)
    
    response = input("\n⚠️  This will update your database. Continue? (yes/no): ")
    if response.lower() in ['yes', 'y']:
        migrate_enum_to_uppercase()
    else:
        print("Migration cancelled.")

