-- COMMISSION CONSTRAINT DIAGNOSTIC SCRIPT
-- Diagnoses and fixes the commissions_status_valid check constraint violation

-- 1. Check current constraint definition
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'commissions_status_valid';

-- 2. Check what status values are currently in the commissions table
SELECT 
    status,
    COUNT(*) as count,
    MIN(created_at) as first_occurrence,
    MAX(created_at) as last_occurrence
FROM commissions 
GROUP BY status 
ORDER BY count DESC;

-- 3. Check for any invalid status values that might be causing the constraint violation
SELECT 
    id,
    agent_id,
    source_type,
    source_id,
    amount,
    status,
    created_at
FROM commissions 
WHERE status NOT IN ('pending', 'earned', 'pending_withdrawal', 'withdrawn')
ORDER BY created_at DESC;

-- 4. Check the table structure and constraints
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'commissions' 
ORDER BY ordinal_position;

-- 5. List all constraints on the commissions table
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'commissions'::regclass;

-- 6. Check if there are any triggers that might be interfering
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'commissions';

-- 7. Test inserting a valid commission record to see if constraint works
-- (This will be rolled back)
BEGIN;
-- Fixed UUID syntax error by using gen_random_uuid() instead of 'test-id'
INSERT INTO commissions (
    agent_id,
    source_type,
    source_id,
    amount,
    status,
    created_at,
    updated_at
) VALUES (
    (SELECT id FROM agents LIMIT 1),
    'test',
    gen_random_uuid(),
    10.00,
    'earned',
    NOW(),
    NOW()
);
ROLLBACK;

-- 8. If constraint is too restrictive, drop and recreate it with correct values
-- UNCOMMENT ONLY IF NEEDED:
-- ALTER TABLE commissions DROP CONSTRAINT IF EXISTS commissions_status_valid;
-- ALTER TABLE commissions ADD CONSTRAINT commissions_status_valid 
--     CHECK (status IN ('pending', 'earned', 'pending_withdrawal', 'withdrawn'));

-- 9. Verify the constraint is working correctly
SELECT 'Constraint diagnostic complete. Check results above.' as status;
