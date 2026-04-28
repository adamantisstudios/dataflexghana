#!/usr/bin/env python3
"""
Execute SMS logs migration on Supabase
This script creates the sms_logs table and RLS policies
"""

import os
import sys
from supabase import create_client, Client

def execute_migration():
    """Execute the SMS logs table migration"""
    
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        print("[ERROR] Missing Supabase credentials")
        print("Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables")
        return False
    
    try:
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Read migration SQL
        migration_path = os.path.join(os.path.dirname(__file__), "002-create-sms-logs-table.sql")
        with open(migration_path, "r") as f:
            sql_content = f.read()
        
        # Execute migration
        response = supabase.rpc("execute_sql", {"sql": sql_content}).execute()
        
        print("[SUCCESS] SMS logs table migration executed successfully")
        return True
        
    except Exception as e:
        print(f"[ERROR] Migration failed: {str(e)}")
        return False

if __name__ == "__main__":
    success = execute_migration()
    sys.exit(0 if success else 1)
