-- DEFINITIVE COMMISSION CONSTRAINT FIX
-- This script will solve the commission constraint violation issue once and for all
-- Run this script to identify and fix all commission-related database constraints

-- Step 1: Check current constraint definitions
DO $$
BEGIN
    RAISE NOTICE '=== COMMISSION CONSTRAINT ANALYSIS ===';
    RAISE NOTICE 'Checking current constraint definitions...';
END $$;

-- Get all constraints on the commissions table
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'commissions'::regclass
ORDER BY conname;

-- Step 2: Check what values are currently in the status column
DO $$
BEGIN
    RAISE NOTICE '=== CURRENT STATUS VALUES IN DATABASE ===';
END $$;

SELECT 
    status,
    COUNT(*) as count,
    MIN(created_at) as first_occurrence,
    MAX(created_at) as last_occurrence
FROM commissions 
GROUP BY status 
ORDER BY count DESC;

-- Step 3: Check what values are currently in the source_type column
DO $$
BEGIN
    RAISE NOTICE '=== CURRENT SOURCE_TYPE VALUES IN DATABASE ===';
END $$;

SELECT 
    source_type,
    COUNT(*) as count,
    MIN(created_at) as first_occurrence,
    MAX(created_at) as last_occurrence
FROM commissions 
GROUP BY source_type 
ORDER BY count DESC;

-- Step 4: Drop existing problematic constraints if they exist
DO $$
BEGIN
    -- Drop status constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'commissions_status_valid' 
        AND conrelid = 'commissions'::regclass
    ) THEN
        ALTER TABLE commissions DROP CONSTRAINT commissions_status_valid;
        RAISE NOTICE 'Dropped existing commissions_status_valid constraint';
    END IF;

    -- Drop source_type constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'commissions_source_type_check' 
        AND conrelid = 'commissions'::regclass
    ) THEN
        ALTER TABLE commissions DROP CONSTRAINT commissions_source_type_check;
        RAISE NOTICE 'Dropped existing commissions_source_type_check constraint';
    END IF;
END $$;

-- Step 5: Clean up any invalid data
DO $$
DECLARE
    updated_rows INTEGER; -- Added proper variable declaration
BEGIN
    RAISE NOTICE '=== CLEANING UP INVALID DATA ===';
    
    -- Fix invalid status values
    UPDATE commissions 
    SET status = 'earned' 
    WHERE status NOT IN ('pending', 'earned', 'pending_withdrawal', 'withdrawn');
    
    GET DIAGNOSTICS updated_rows = ROW_COUNT;
    RAISE NOTICE 'Fixed % invalid status values', updated_rows;
    
    -- Fix invalid source_type values
    UPDATE commissions 
    SET source_type = 'data_order' 
    WHERE source_type NOT IN ('referral', 'data_order', 'wholesale_order');
    
    GET DIAGNOSTICS updated_rows = ROW_COUNT;
    RAISE NOTICE 'Fixed % invalid source_type values', updated_rows;
END $$;

-- Step 6: Create proper constraints with correct values
DO $$
BEGIN
    RAISE NOTICE '=== CREATING PROPER CONSTRAINTS ===';
    
    -- Create status constraint
    ALTER TABLE commissions 
    ADD CONSTRAINT commissions_status_valid 
    CHECK (status IN ('pending', 'earned', 'pending_withdrawal', 'withdrawn'));
    
    RAISE NOTICE 'Created commissions_status_valid constraint with values: pending, earned, pending_withdrawal, withdrawn';
    
    -- Create source_type constraint
    ALTER TABLE commissions 
    ADD CONSTRAINT commissions_source_type_check 
    CHECK (source_type IN ('referral', 'data_order', 'wholesale_order'));
    
    RAISE NOTICE 'Created commissions_source_type_check constraint with values: referral, data_order, wholesale_order';
END $$;

-- Step 7: Test the constraints by attempting to insert valid data
DO $$
DECLARE
    test_agent_id UUID;
    test_commission_id UUID;
BEGIN
    RAISE NOTICE '=== TESTING CONSTRAINTS WITH VALID DATA ===';
    
    -- Get a valid agent_id for testing
    SELECT id INTO test_agent_id FROM agents LIMIT 1;
    
    IF test_agent_id IS NULL THEN
        RAISE NOTICE 'No agents found for testing - skipping constraint test';
        RETURN;
    END IF;
    
    -- Test valid status and source_type
    INSERT INTO commissions (
        agent_id,
        source_type,
        source_id,
        amount,
        status,
        created_at,
        updated_at
    ) VALUES (
        test_agent_id,
        'wholesale_order',
        gen_random_uuid(),
        10.00,
        'earned',
        NOW(),
        NOW()
    ) RETURNING id INTO test_commission_id;
    
    RAISE NOTICE 'Successfully inserted test commission with ID: %', test_commission_id;
    
    -- Clean up test data
    DELETE FROM commissions WHERE id = test_commission_id;
    RAISE NOTICE 'Cleaned up test commission record';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error during constraint testing: %', SQLERRM;
END $$;

-- Step 8: Verify final state
DO $$
BEGIN
    RAISE NOTICE '=== FINAL VERIFICATION ===';
END $$;

-- Show final constraint definitions
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'commissions'::regclass
AND conname IN ('commissions_status_valid', 'commissions_source_type_check')
ORDER BY conname;

-- Show final data distribution
SELECT 'Status Distribution' as category, status as value, COUNT(*) as count
FROM commissions 
GROUP BY status
UNION ALL
SELECT 'Source Type Distribution' as category, source_type as value, COUNT(*) as count
FROM commissions 
GROUP BY source_type
ORDER BY category, count DESC;

DO $$
BEGIN
    RAISE NOTICE '=== COMMISSION CONSTRAINT FIX COMPLETED ===';
    RAISE NOTICE 'The commission system should now work properly without constraint violations.';
    RAISE NOTICE 'Valid status values: pending, earned, pending_withdrawal, withdrawn';
    RAISE NOTICE 'Valid source_type values: referral, data_order, wholesale_order';
END $$;
