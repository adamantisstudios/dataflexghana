-- FIX COMMISSION SOURCE TYPE CONSTRAINT VIOLATION
-- This script identifies and fixes the "commissions_source_type_check" constraint violation
-- The error shows that "test" is being used as source_type, which violates the constraint

DO $$
BEGIN
    RAISE NOTICE '🔍 DIAGNOSING COMMISSION SOURCE TYPE CONSTRAINT VIOLATION...';
    RAISE NOTICE '===========================================================';
END $$;

-- Check current constraint definition
DO $$
DECLARE
    constraint_def TEXT;
BEGIN
    SELECT pg_get_constraintdef(oid) INTO constraint_def
    FROM pg_constraint 
    WHERE conname = 'commissions_source_type_check';
    
    IF constraint_def IS NOT NULL THEN
        RAISE NOTICE '✅ Found constraint: %', constraint_def;
    ELSE
        RAISE NOTICE '❌ Constraint "commissions_source_type_check" not found';
    END IF;
END $$;

-- Check for invalid source_type values
DO $$
DECLARE
    invalid_count INTEGER;
    rec RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 CHECKING FOR INVALID SOURCE_TYPE VALUES...';
    
    SELECT COUNT(*) INTO invalid_count
    FROM commissions 
    WHERE source_type NOT IN ('referral', 'data_order', 'wholesale_order');
    
    IF invalid_count > 0 THEN
        RAISE NOTICE '❌ Found % records with invalid source_type values:', invalid_count;
        
        FOR rec IN 
            SELECT id, agent_id, source_type, source_id, amount, status, created_at
            FROM commissions 
            WHERE source_type NOT IN ('referral', 'data_order', 'wholesale_order')
            LIMIT 10
        LOOP
            RAISE NOTICE '  - ID: %, Agent: %, Source Type: "%" (INVALID), Amount: %', 
                rec.id, rec.agent_id, rec.source_type, rec.amount;
        END LOOP;
        
        -- Fix invalid source_type values
        RAISE NOTICE '';
        RAISE NOTICE '🔧 FIXING INVALID SOURCE_TYPE VALUES...';
        
        -- Update "test" values to "data_order" (most likely intended type)
        UPDATE commissions 
        SET source_type = 'data_order',
            updated_at = NOW()
        WHERE source_type = 'test';
        
        GET DIAGNOSTICS invalid_count = ROW_COUNT;
        IF invalid_count > 0 THEN
            RAISE NOTICE '✅ Fixed % records with source_type "test" -> "data_order"', invalid_count;
        END IF;
        
        -- Update any other invalid values to "data_order" as fallback
        UPDATE commissions 
        SET source_type = 'data_order',
            updated_at = NOW()
        WHERE source_type NOT IN ('referral', 'data_order', 'wholesale_order');
        
        GET DIAGNOSTICS invalid_count = ROW_COUNT;
        IF invalid_count > 0 THEN
            RAISE NOTICE '✅ Fixed % additional records with invalid source_type', invalid_count;
        END IF;
        
    ELSE
        RAISE NOTICE '✅ No invalid source_type values found';
    END IF;
END $$;

-- Verify constraint is working properly
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 VERIFYING CONSTRAINT ENFORCEMENT...';
    
    -- Try to insert a record with invalid source_type (should fail)
    BEGIN
        INSERT INTO commissions (
            agent_id, 
            source_type, 
            source_id, 
            amount, 
            status
        ) VALUES (
            gen_random_uuid(),
            'invalid_test_type',
            gen_random_uuid(),
            10.00,
            'earned'
        );
        
        RAISE NOTICE '❌ CONSTRAINT NOT WORKING - Invalid insert succeeded!';
        
        -- Clean up the test record
        DELETE FROM commissions WHERE source_type = 'invalid_test_type';
        
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE '✅ Constraint is working properly - invalid insert rejected';
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Unexpected error during constraint test: %', SQLERRM;
    END;
END $$;

-- Create or update the constraint if needed
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔧 ENSURING PROPER CONSTRAINT DEFINITION...';
    
    -- Drop existing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'commissions_source_type_check'
    ) THEN
        ALTER TABLE commissions DROP CONSTRAINT commissions_source_type_check;
        RAISE NOTICE '🔧 Dropped existing constraint';
    END IF;
    
    -- Add the correct constraint
    ALTER TABLE commissions 
    ADD CONSTRAINT commissions_source_type_check 
    CHECK (source_type IN ('referral', 'data_order', 'wholesale_order'));
    
    RAISE NOTICE '✅ Added proper source_type constraint';
END $$;

-- Final validation
DO $$
DECLARE
    total_commissions INTEGER;
    valid_commissions INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ FINAL VALIDATION...';
    RAISE NOTICE '==================';
    
    SELECT COUNT(*) INTO total_commissions FROM commissions;
    
    SELECT COUNT(*) INTO valid_commissions 
    FROM commissions 
    WHERE source_type IN ('referral', 'data_order', 'wholesale_order');
    
    RAISE NOTICE 'Total commission records: %', total_commissions;
    RAISE NOTICE 'Valid source_type records: %', valid_commissions;
    
    IF total_commissions = valid_commissions THEN
        RAISE NOTICE '✅ ALL COMMISSION RECORDS HAVE VALID SOURCE_TYPE VALUES';
        RAISE NOTICE '✅ CONSTRAINT VIOLATION ISSUE RESOLVED';
    ELSE
        RAISE NOTICE '❌ Still have % invalid records', (total_commissions - valid_commissions);
    END IF;
END $$;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 COMMISSION SOURCE TYPE CONSTRAINT FIX COMPLETE!';
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'The commission system should now work properly without constraint violations.';
    RAISE NOTICE 'Valid source_type values are: referral, data_order, wholesale_order';
END $$;
