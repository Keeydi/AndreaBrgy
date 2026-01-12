"""
Script to generate proper bcrypt password hashes for demo users
Run this to get the correct password hashes for the SQL schema
"""
import bcrypt

def hash_password(password: str) -> str:
    """Generate bcrypt hash for a password."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

if __name__ == "__main__":
    print("=" * 60)
    print("Generating Password Hashes for Demo Users")
    print("=" * 60)
    print()
    
    passwords = {
        'admin': 'admin123',
        'official': 'official123',
        'pedro (resident)': 'resident123'
    }
    
    hashes = {}
    for user, password in passwords.items():
        hash_value = hash_password(password)
        hashes[user] = hash_value
        print(f"{user.capitalize()}:")
        print(f"  Password: {password}")
        print(f"  Hash: {hash_value}")
        print()
    
    print("=" * 60)
    print("SQL INSERT Statement:")
    print("=" * 60)
    print()
    print("INSERT INTO users (email, password_hash, name, role, phone, address) VALUES")
    print(f"('admin@brgykorokan.gov.ph', '{hashes['admin']}', 'Barangay Captain', 'ADMIN', '+63 912 345 6789', 'Barangay Hall'),")
    print(f"('official@brgykorokan.gov.ph', '{hashes['official']}', 'Barangay Secretary', 'OFFICIAL', '+63 912 345 6790', 'Barangay Hall'),")
    print(f"('pedro@gmail.com', '{hashes['pedro (resident)']}', 'Pedro Santos', 'RESIDENT', '+63 912 345 6791', 'Zone 3, Barangay Korokan')")
    print("ON DUPLICATE KEY UPDATE email=email;")
    print()
    print("=" * 60)
    print("Verification:")
    print("=" * 60)
    for user, password in passwords.items():
        is_valid = verify_password(password, hashes[user])
        print(f"{user.capitalize()}: {'✓ Valid' if is_valid else '✗ Invalid'}")



