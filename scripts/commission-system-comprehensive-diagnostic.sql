-- COMMISSION SYSTEM COMPREHENSIVE DIAGNOSTIC AND REPAIR SCRIPT
-- This script checks the entire commission system for inconsistencies and fixes them
-- Run this in Supabase SQL Editor before proceeding with frontend/backend work

-- =============================================================================
-- SECTION 1: SYSTEM STATUS CHECK
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '🔍 STARTING COMMISSION SYSTEM DIAGNOSTIC...';
    RAISE NOTICE '================================================';
END $$;

-- Check if all required tables exist
DO $$
DECLARE
    missing_tables TEXT[] := ARRAY[]::TEXT[];
    tbl_name TEXT;
BEGIN
    RAISE NOTICE '📋 CHECKING TABLE EXISTENCE...';
    
    -- renamed variable from table_name to tbl_name to avoid ambiguity
    -- Check for required tables
    FOR tbl_name IN SELECT unnest(ARRAY['agents', 'commissions', 'withdrawals', 'wallet_transactions', 'data_orders', 'referrals', 'wholesale_orders'])
    LOOP
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE information_schema.tables.table_name = tbl_name AND table_schema = 'public') THEN
            missing_tables := array_append(missing_tables, tbl_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE NOTICE '❌ MISSING TABLES: %', array_to_string(missing_tables, ', ');
    ELSE
        RAISE NOTICE '✅ All required tables exist';
    END IF;
END $$;

-- Check table structures and required columns
DO $$
DECLARE
    missing_columns TEXT := '';
BEGIN
    RAISE NOTICE '📋 CHECKING TABLE STRUCTURES...';
    
    -- added table aliases to disambiguate column references
    -- Check agents table columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_name = 'agents' AND c.column_name = 'totalcommissions') AND
       NOT EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_name = 'agents' AND c.column_name = 'totalCommissions') THEN
        missing_columns := missing_columns || 'agents.totalCommissions, ';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_name = 'agents' AND c.column_name = 'totalpaidout') AND
       NOT EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_name = 'agents' AND c.column_name = 'totalPaidOut') THEN
        missing_columns := missing_columns || 'agents.totalPaidOut, ';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_name = 'agents' AND c.column_name = 'wallet_balance') THEN
        missing_columns := missing_columns || 'agents.wallet_balance, ';
    END IF;
    
    -- Check commissions table structure
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables t WHERE t.table_name = 'commissions') THEN
        missing_columns := missing_columns || 'commissions table, ';
    END IF;
    
    IF missing_columns != '' THEN
        RAISE NOTICE '⚠️ MISSING COLUMNS/TABLES: %', rtrim(missing_columns, ', ');
    ELSE
        RAISE NOTICE '✅ All required columns exist';
    END IF;
END $$;

-- =============================================================================
-- SECTION 2: DATA CONSISTENCY CHECKS
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 CHECKING DATA CONSISTENCY...';
    RAISE NOTICE '================================';
END $$;

-- Check for agents with negative commission balances
DO $$
DECLARE
    negative_count INTEGER;
    rec RECORD; -- Added explicit RECORD declaration for loop variable
BEGIN
    SELECT COUNT(*) INTO negative_count
    FROM agents 
    WHERE COALESCE(totalcommissions, 0) < 0 OR COALESCE(totalpaidout, 0) < 0;
    
    IF negative_count > 0 THEN
        RAISE NOTICE '❌ Found % agents with negative commission balances', negative_count;
        
        -- Show details
        RAISE NOTICE 'Agents with negative balances:';
        FOR rec IN 
            SELECT id, full_name, COALESCE(totalcommissions, 0) as total_comm, COALESCE(totalpaidout, 0) as total_paid
            FROM agents 
            WHERE COALESCE(totalcommissions, 0) < 0 OR COALESCE(totalpaidout, 0) < 0
            LIMIT 10
        LOOP
            RAISE NOTICE '  - Agent %: % (Total: %, Paid: %)', rec.id, rec.full_name, rec.total_comm, rec.total_paid;
        END LOOP;
    ELSE
        RAISE NOTICE '✅ No agents with negative commission balances';
    END IF;
END $$;

-- Check for totalPaidOut > totalCommissions
DO $$
DECLARE
    inconsistent_count INTEGER;
    rec RECORD; -- Added explicit RECORD declaration for loop variable
BEGIN
    SELECT COUNT(*) INTO inconsistent_count
    FROM agents 
    WHERE COALESCE(totalpaidout, 0) > COALESCE(totalcommissions, 0);
    
    IF inconsistent_count > 0 THEN
        RAISE NOTICE '❌ Found % agents where totalPaidOut > totalCommissions', inconsistent_count;
        
        -- Show details
        RAISE NOTICE 'Agents with inconsistent balances:';
        FOR rec IN 
            SELECT id, full_name, COALESCE(totalcommissions, 0) as total_comm, COALESCE(totalpaidout, 0) as total_paid
            FROM agents 
            WHERE COALESCE(totalpaidout, 0) > COALESCE(totalcommissions, 0)
            LIMIT 10
        LOOP
            RAISE NOTICE '  - Agent %: % (Total: %, Paid: %)', rec.id, rec.full_name, rec.total_comm, rec.total_paid;
        END LOOP;
    ELSE
        RAISE NOTICE '✅ No agents with totalPaidOut > totalCommissions';
    END IF;
END $$;

-- Check commission table vs agents table consistency
DO $$
DECLARE
    mismatch_count INTEGER;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'commissions') THEN
        WITH commission_totals AS (
            SELECT 
                agent_id,
                SUM(amount) as calculated_total
            FROM commissions 
            WHERE status IN ('earned', 'pending_withdrawal', 'withdrawn')
            GROUP BY agent_id
        )
        SELECT COUNT(*) INTO mismatch_count
        FROM agents a
        LEFT JOIN commission_totals ct ON a.id = ct.agent_id
        WHERE ABS(COALESCE(a.totalcommissions, 0) - COALESCE(ct.calculated_total, 0)) > 0.01;
        
        IF mismatch_count > 0 THEN
            RAISE NOTICE '❌ Found % agents with commission table mismatches', mismatch_count;
        ELSE
            RAISE NOTICE '✅ Commission table matches agents table';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ Commissions table does not exist - cannot check consistency';
    END IF;
END $$;

-- Check withdrawal status consistency
DO $$
DECLARE
    inconsistent_withdrawals INTEGER;
BEGIN
    SELECT COUNT(*) INTO inconsistent_withdrawals
    FROM withdrawals w
    JOIN agents a ON w.agent_id = a.id
    WHERE w.status = 'paid' 
    AND w.amount > COALESCE(a.totalcommissions, 0);
    
    IF inconsistent_withdrawals > 0 THEN
        RAISE NOTICE '❌ Found % paid withdrawals exceeding agent commission balance', inconsistent_withdrawals;
    ELSE
        RAISE NOTICE '✅ All paid withdrawals are within commission limits';
    END IF;
END $$;

-- =============================================================================
-- SECTION 3: TRIGGER AND CONSTRAINT CHECKS
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 CHECKING TRIGGERS AND CONSTRAINTS...';
    RAISE NOTICE '====================================';
END $$;

-- Check for existing triggers
DO $$
DECLARE
    trigger_count INTEGER;
    trigger_rec RECORD; -- Added explicit RECORD declaration for loop variable
BEGIN
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers t
    WHERE t.trigger_name LIKE '%commission%' OR t.trigger_name LIKE '%withdrawal%';
    
    RAISE NOTICE 'Found % commission/withdrawal related triggers:', trigger_count;
    
    FOR trigger_rec IN 
        SELECT t.trigger_name, t.event_object_table, t.action_timing, t.event_manipulation
        FROM information_schema.triggers t
        WHERE t.trigger_name LIKE '%commission%' OR t.trigger_name LIKE '%withdrawal%'
    LOOP
        RAISE NOTICE '  - %: % % on %', trigger_rec.trigger_name, trigger_rec.action_timing, trigger_rec.event_manipulation, trigger_rec.event_object_table;
    END LOOP;
END $$;

-- Check for constraints
DO $$
DECLARE
    constraint_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.table_constraints tc
    WHERE tc.constraint_name LIKE '%commission%' OR tc.constraint_name LIKE '%withdrawal%';
    
    RAISE NOTICE 'Found % commission/withdrawal related constraints', constraint_count;
END $$;

-- =============================================================================
-- SECTION 4: COMMISSION CALCULATION VERIFICATION
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 VERIFYING COMMISSION CALCULATIONS...';
    RAISE NOTICE '===================================';
END $$;

-- Check data order commissions
DO $$
DECLARE
    order_count INTEGER;
    commission_mismatch INTEGER;
BEGIN
    SELECT COUNT(*) INTO order_count
    FROM data_orders 
    WHERE status = 'completed';
    
    RAISE NOTICE 'Found % completed data orders', order_count;
    
    -- Check for missing commission amounts
    -- Changed table alias from 'do' to 'ord' to avoid PostgreSQL keyword conflict
    SELECT COUNT(*) INTO commission_mismatch
    FROM data_orders ord
    JOIN data_bundles db ON ord.bundle_id = db.id
    WHERE ord.status = 'completed' 
    AND (ord.commission_amount IS NULL OR ord.commission_amount = 0)
    AND db.commission_rate > 0;
    
    IF commission_mismatch > 0 THEN
        RAISE NOTICE '❌ Found % completed orders with missing commission amounts', commission_mismatch;
    ELSE
        RAISE NOTICE '✅ All completed orders have commission amounts';
    END IF;
END $$;

-- Check referral commissions
DO $$
DECLARE
    referral_count INTEGER;
    commission_mismatch INTEGER;
BEGIN
    SELECT COUNT(*) INTO referral_count
    FROM referrals 
    WHERE status = 'completed';
    
    RAISE NOTICE 'Found % completed referrals', referral_count;
    
    -- Check for missing commission tracking
    SELECT COUNT(*) INTO commission_mismatch
    FROM referrals r
    JOIN services s ON r.service_id = s.id
    WHERE r.status = 'completed' 
    AND r.commission_paid = false
    AND s.commission_amount > 0;
    
    IF commission_mismatch > 0 THEN
        RAISE NOTICE '❌ Found % completed referrals with unpaid commissions', commission_mismatch;
    ELSE
        RAISE NOTICE '✅ All completed referrals have proper commission tracking';
    END IF;
END $$;

-- =============================================================================
-- SECTION 5: AUTOMATIC FIXES
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔧 APPLYING AUTOMATIC FIXES...';
    RAISE NOTICE '=============================';
END $$;

-- Fix 1: Create commissions table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'commissions') THEN
        RAISE NOTICE '🔧 Creating commissions table...';
        
        CREATE TABLE commissions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
            source_type TEXT NOT NULL CHECK (source_type IN ('referral', 'data_order', 'wholesale_order')),
            source_id UUID NOT NULL,
            amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
            commission_rate DECIMAL(8,6) NOT NULL CHECK (commission_rate >= 0 AND commission_rate <= 1),
            status TEXT NOT NULL DEFAULT 'earned' CHECK (status IN ('pending', 'earned', 'pending_withdrawal', 'withdrawn')),
            earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            withdrawn_at TIMESTAMP WITH TIME ZONE,
            withdrawal_id UUID REFERENCES withdrawals(id),
            source_details JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX idx_commissions_agent_id ON commissions(agent_id);
        CREATE INDEX idx_commissions_status ON commissions(status);
        CREATE INDEX idx_commissions_source ON commissions(source_type, source_id);
        CREATE INDEX idx_commissions_withdrawal_id ON commissions(withdrawal_id);
        
        RAISE NOTICE '✅ Commissions table created successfully';
    ELSE
        RAISE NOTICE '✅ Commissions table already exists';
    END IF;
END $$;

-- Fix 2: Add missing columns to agents table
DO $$
BEGIN
    -- added table aliases to disambiguate column references
    -- Add totalCommissions if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_name = 'agents' AND c.column_name = 'totalcommissions') AND
       NOT EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_name = 'agents' AND c.column_name = 'totalCommissions') THEN
        RAISE NOTICE '🔧 Adding totalCommissions column to agents table...';
        ALTER TABLE agents ADD COLUMN totalCommissions DECIMAL(10,2) DEFAULT 0 CHECK (totalCommissions >= 0);
    END IF;
    
    -- Add totalPaidOut if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_name = 'agents' AND c.column_name = 'totalpaidout') AND
       NOT EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_name = 'agents' AND c.column_name = 'totalPaidOut') THEN
        RAISE NOTICE '🔧 Adding totalPaidOut column to agents table...';
        ALTER TABLE agents ADD COLUMN totalPaidOut DECIMAL(10,2) DEFAULT 0 CHECK (totalPaidOut >= 0);
    END IF;
    
    -- Add wallet_balance if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_name = 'agents' AND c.column_name = 'wallet_balance') THEN
        RAISE NOTICE '🔧 Adding wallet_balance column to agents table...';
        ALTER TABLE agents ADD COLUMN wallet_balance DECIMAL(10,2) DEFAULT 0 CHECK (wallet_balance >= 0);
    END IF;
END $$;

-- Fix 3: Reset negative balances to zero
DO $$
DECLARE
    fixed_count INTEGER;
BEGIN
    UPDATE agents 
    SET totalcommissions = 0 
    WHERE COALESCE(totalcommissions, 0) < 0;
    
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    
    IF fixed_count > 0 THEN
        RAISE NOTICE '🔧 Fixed % agents with negative totalCommissions', fixed_count;
    END IF;
    
    UPDATE agents 
    SET totalpaidout = 0 
    WHERE COALESCE(totalpaidout, 0) < 0;
    
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    
    IF fixed_count > 0 THEN
        RAISE NOTICE '🔧 Fixed % agents with negative totalPaidOut', fixed_count;
    END IF;
END $$;

-- Fix 4: Correct totalPaidOut > totalCommissions
DO $$
DECLARE
    fixed_count INTEGER;
BEGIN
    UPDATE agents 
    SET totalpaidout = COALESCE(totalcommissions, 0)
    WHERE COALESCE(totalpaidout, 0) > COALESCE(totalcommissions, 0);
    
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    
    IF fixed_count > 0 THEN
        RAISE NOTICE '🔧 Fixed % agents where totalPaidOut > totalCommissions', fixed_count;
    END IF;
END $$;

-- Fix 5: Create essential triggers for commission tracking
DO $$
BEGIN
    -- added table aliases to disambiguate trigger existence checks
    -- Trigger to update agents.totalCommissions when commissions are added
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers t WHERE t.trigger_name = 'update_agent_commission_balance') THEN
        RAISE NOTICE '🔧 Creating commission balance update trigger...';
        
        CREATE OR REPLACE FUNCTION update_agent_commission_balance()
        RETURNS TRIGGER AS $trigger$
        BEGIN
            IF TG_OP = 'INSERT' THEN
                UPDATE agents 
                SET totalcommissions = COALESCE(totalcommissions, 0) + NEW.amount
                WHERE id = NEW.agent_id;
                RETURN NEW;
            ELSIF TG_OP = 'UPDATE' THEN
                -- Handle status changes
                IF OLD.status != NEW.status THEN
                    -- No balance changes needed for status updates
                    -- Balance is managed by withdrawal system
                END IF;
                RETURN NEW;
            ELSIF TG_OP = 'DELETE' THEN
                UPDATE agents 
                SET totalcommissions = COALESCE(totalcommissions, 0) - OLD.amount
                WHERE id = OLD.agent_id;
                RETURN OLD;
            END IF;
            RETURN NULL;
        END;
        $trigger$ LANGUAGE plpgsql;
        
        CREATE TRIGGER update_agent_commission_balance
            AFTER INSERT OR UPDATE OR DELETE ON commissions
            FOR EACH ROW EXECUTE FUNCTION update_agent_commission_balance();
            
        RAISE NOTICE '✅ Commission balance trigger created';
    END IF;
    
    -- Trigger to update agents.totalPaidOut when withdrawals are paid
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers t WHERE t.trigger_name = 'update_agent_paidout_balance') THEN
        RAISE NOTICE '🔧 Creating paidout balance update trigger...';
        
        CREATE OR REPLACE FUNCTION update_agent_paidout_balance()
        RETURNS TRIGGER AS $trigger$
        BEGIN
            IF TG_OP = 'UPDATE' THEN
                -- When withdrawal status changes to 'paid'
                IF OLD.status != 'paid' AND NEW.status = 'paid' THEN
                    UPDATE agents 
                    SET totalpaidout = COALESCE(totalpaidout, 0) + NEW.amount
                    WHERE id = NEW.agent_id;
                -- When withdrawal status changes from 'paid' to something else
                ELSIF OLD.status = 'paid' AND NEW.status != 'paid' THEN
                    UPDATE agents 
                    SET totalpaidout = COALESCE(totalpaidout, 0) - OLD.amount
                    WHERE id = NEW.agent_id;
                END IF;
            END IF;
            RETURN NEW;
        END;
        $trigger$ LANGUAGE plpgsql;
        
        CREATE TRIGGER update_agent_paidout_balance
            AFTER UPDATE ON withdrawals
            FOR EACH ROW EXECUTE FUNCTION update_agent_paidout_balance();
            
        RAISE NOTICE '✅ Paidout balance trigger created';
    END IF;
END $$;

-- Fix 6: Populate commissions table from existing orders if empty
DO $$
DECLARE
    commission_count INTEGER;
    populated_count INTEGER := 0;
BEGIN
    SELECT COUNT(*) INTO commission_count FROM commissions;
    
    IF commission_count = 0 THEN
        RAISE NOTICE '🔧 Populating commissions table from existing completed orders...';
        
        -- Insert data order commissions
        -- Changed table alias from 'do' to 'ord' to avoid PostgreSQL keyword conflict
        INSERT INTO commissions (agent_id, source_type, source_id, amount, commission_rate, status, earned_at, source_details)
        SELECT 
            ord.agent_id,
            'data_order',
            ord.id,
            COALESCE(ord.commission_amount, db.price * db.commission_rate),
            db.commission_rate,
            'earned',
            ord.updated_at,
            jsonb_build_object(
                'bundle_name', db.name,
                'bundle_price', db.price,
                'recipient_phone', ord.recipient_phone
            )
        FROM data_orders ord
        JOIN data_bundles db ON ord.bundle_id = db.id
        WHERE ord.status = 'completed'
        AND ord.commission_amount > 0;
        
        GET DIAGNOSTICS populated_count = ROW_COUNT;
        RAISE NOTICE '  - Populated % data order commissions', populated_count;
        
        -- Insert referral commissions
        INSERT INTO commissions (agent_id, source_type, source_id, amount, commission_rate, status, earned_at, source_details)
        SELECT 
            r.agent_id,
            'referral',
            r.id,
            s.commission_amount,
            1.0, -- Full commission for referrals
            'earned',
            r.created_at,
            jsonb_build_object(
                'service_title', s.title,
                'client_name', r.client_name,
                'client_phone', r.client_phone
            )
        FROM referrals r
        JOIN services s ON r.service_id = s.id
        WHERE r.status = 'completed'
        AND s.commission_amount > 0;
        
        GET DIAGNOSTICS populated_count = ROW_COUNT;
        RAISE NOTICE '  - Populated % referral commissions', populated_count;
        
        RAISE NOTICE '✅ Commissions table populated from existing orders';
    ELSE
        RAISE NOTICE '✅ Commissions table already has data (% records)', commission_count;
    END IF;
END $$;

-- =============================================================================
-- SECTION 6: FINAL VALIDATION
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ FINAL SYSTEM VALIDATION...';
    RAISE NOTICE '============================';
END $$;

-- Validate commission balance consistency after fixes
DO $$
DECLARE
    total_agents INTEGER;
    consistent_agents INTEGER;
    consistency_rate DECIMAL;
BEGIN
    SELECT COUNT(*) INTO total_agents FROM agents;
    
    WITH commission_totals AS (
        SELECT 
            agent_id,
            SUM(amount) as calculated_total
        FROM commissions 
        WHERE status IN ('earned', 'pending_withdrawal', 'withdrawn')
        GROUP BY agent_id
    )
    SELECT COUNT(*) INTO consistent_agents
    FROM agents a
    LEFT JOIN commission_totals ct ON a.id = ct.agent_id
    WHERE ABS(COALESCE(a.totalcommissions, 0) - COALESCE(ct.calculated_total, 0)) <= 0.01;
    
    consistency_rate := (consistent_agents::DECIMAL / NULLIF(total_agents, 0)) * 100;
    
    RAISE NOTICE 'Commission consistency: %/% agents (%.1f%%)', consistent_agents, total_agents, consistency_rate;
    
    IF consistency_rate >= 95 THEN
        RAISE NOTICE '✅ COMMISSION SYSTEM IS HEALTHY';
    ELSE
        RAISE NOTICE '⚠️ COMMISSION SYSTEM NEEDS ATTENTION';
    END IF;
END $$;

-- Summary report
DO $$
DECLARE
    total_commissions DECIMAL;
    total_withdrawals DECIMAL;
    pending_withdrawals DECIMAL;
    active_agents INTEGER;
BEGIN
    SELECT 
        COALESCE(SUM(totalcommissions), 0),
        COALESCE(SUM(totalpaidout), 0)
    INTO total_commissions, total_withdrawals
    FROM agents;
    
    SELECT COALESCE(SUM(amount), 0) INTO pending_withdrawals
    FROM withdrawals 
    WHERE status IN ('requested', 'processing');
    
    SELECT COUNT(*) INTO active_agents
    FROM agents 
    WHERE isapproved = true;
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 COMMISSION SYSTEM SUMMARY';
    RAISE NOTICE '============================';
    RAISE NOTICE 'Active Agents: %', active_agents;
    RAISE NOTICE 'Total Commissions Earned: GH₵%.2f', total_commissions;
    RAISE NOTICE 'Total Withdrawals Paid: GH₵%.2f', total_withdrawals;
    RAISE NOTICE 'Pending Withdrawals: GH₵%.2f', pending_withdrawals;
    RAISE NOTICE 'Available Commission Balance: GH₵%.2f', total_commissions - total_withdrawals - pending_withdrawals;
    RAISE NOTICE '';
    RAISE NOTICE '🎉 COMMISSION SYSTEM DIAGNOSTIC COMPLETE!';
    RAISE NOTICE '==========================================';
END $$;
