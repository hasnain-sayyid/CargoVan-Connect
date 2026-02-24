import sqlite3
import os

def migrate_db(db_path):
    if not os.path.exists(db_path):
        print(f"Migration skipped: {db_path} not found.")
        return

    print(f"Running migrations on {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get existing columns
    cursor.execute("PRAGMA table_info(bookings)")
    existing_columns = [col[1] for col in cursor.fetchall()]
    
    # Define columns that might be missing
    # Format: (name, type, default)
    potential_columns = [
        ("distance", "STRING", "NULL"),
        ("duration_minutes", "INTEGER", "NULL"),
        ("toll", "FLOAT", "0.0"),
        ("fare", "FLOAT", "NULL")
    ]
    
    for col_name, col_type, col_default in potential_columns:
        if col_name not in existing_columns:
            print(f"Adding column {col_name} to bookings table...")
            try:
                alter_query = f"ALTER TABLE bookings ADD COLUMN {col_name} {col_type}"
                if col_default != "NULL":
                    alter_query += f" DEFAULT {col_default}"
                cursor.execute(alter_query)
            except Exception as e:
                print(f"Error adding column {col_name}: {e}")
    
    conn.commit()
    conn.close()
    print("Migrations complete.")

if __name__ == "__main__":
    # For manual testing or direct execution
    from app.db.database import DB_PATH
    migrate_db(DB_PATH)
