-- Phase 3: Storage quota and cleanup system (FIXED VERSION)
-- Create table to track audio storage usage per user
CREATE TABLE IF NOT EXISTS audio_storage_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES teaching_channels(id) ON DELETE CASCADE,
    total_size_bytes BIGINT DEFAULT 0,
    audio_count INT DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, channel_id)
);

-- Create table to track individual audio files for cleanup
CREATE TABLE IF NOT EXISTS audio_files_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES teaching_channels(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    duration_seconds INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes separately (PostgreSQL doesn't support inline INDEX in CREATE TABLE)
CREATE INDEX IF NOT EXISTS idx_audio_files_user_channel ON audio_files_metadata(user_id, channel_id);
CREATE INDEX IF NOT EXISTS idx_audio_files_created_at ON audio_files_metadata(created_at);

-- Create storage quota configuration table
CREATE TABLE IF NOT EXISTS storage_quotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES teaching_channels(id) ON DELETE CASCADE,
    max_storage_bytes BIGINT DEFAULT 536870912, -- 500 MB default per user
    retention_days INT DEFAULT 90,
    auto_cleanup_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, channel_id)
);

-- Create view for storage usage summary
CREATE OR REPLACE VIEW audio_storage_summary AS
SELECT
    u.id as user_id,
    u.email,
    COALESCE(SUM(asm.total_size_bytes), 0) as total_storage_bytes,
    COALESCE(SUM(asm.audio_count), 0) as total_audio_count,
    sq.max_storage_bytes,
    ROUND(100.0 * COALESCE(SUM(asm.total_size_bytes), 0) / sq.max_storage_bytes, 2) as storage_percentage,
    sq.retention_days,
    sq.auto_cleanup_enabled
FROM auth.users u
LEFT JOIN audio_storage_usage asm ON u.id = asm.user_id
LEFT JOIN storage_quotas sq ON u.id = sq.user_id
GROUP BY u.id, u.email, sq.max_storage_bytes, sq.retention_days, sq.auto_cleanup_enabled;

-- Create function to update storage usage
CREATE OR REPLACE FUNCTION update_audio_storage_usage()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audio_storage_usage (user_id, channel_id, total_size_bytes, audio_count)
    VALUES (NEW.user_id, NEW.channel_id, NEW.file_size_bytes, 1)
    ON CONFLICT (user_id, channel_id)
    DO UPDATE SET
        total_size_bytes = audio_storage_usage.total_size_bytes + NEW.file_size_bytes,
        audio_count = audio_storage_usage.audio_count + 1,
        last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for audio file tracking
CREATE TRIGGER IF NOT EXISTS trigger_update_audio_storage
AFTER INSERT ON audio_files_metadata
FOR EACH ROW
EXECUTE FUNCTION update_audio_storage_usage();

-- Create function to cleanup old audio files
CREATE OR REPLACE FUNCTION cleanup_old_audio_files()
RETURNS TABLE(deleted_count INT, freed_bytes BIGINT) AS $$
DECLARE
    v_deleted_count INT := 0;
    v_freed_bytes BIGINT := 0;
    v_file RECORD;
BEGIN
    FOR v_file IN
        SELECT afm.id, afm.storage_path, afm.file_size_bytes, afm.user_id, afm.channel_id, sq.retention_days
        FROM audio_files_metadata afm
        JOIN storage_quotas sq ON afm.user_id = sq.user_id AND afm.channel_id = sq.channel_id
        WHERE sq.auto_cleanup_enabled = TRUE
        AND afm.created_at < NOW() - (sq.retention_days || ' days')::INTERVAL
    LOOP
        -- Delete from storage (would be handled by Supabase storage cleanup)
        DELETE FROM audio_files_metadata WHERE id = v_file.id;
        v_deleted_count := v_deleted_count + 1;
        v_freed_bytes := v_freed_bytes + v_file.file_size_bytes;

        -- Update storage usage
        UPDATE audio_storage_usage
        SET
            total_size_bytes = total_size_bytes - v_file.file_size_bytes,
            audio_count = audio_count - 1,
            last_updated = NOW()
        WHERE user_id = v_file.user_id AND channel_id = v_file.channel_id;
    END LOOP;

    RETURN QUERY SELECT v_deleted_count, v_freed_bytes;
END;
$$ LANGUAGE plpgsql;

-- Create function to check storage quota
CREATE OR REPLACE FUNCTION check_storage_quota(p_user_id UUID, p_channel_id UUID)
RETURNS TABLE (
    current_usage_bytes BIGINT,
    max_quota_bytes BIGINT,
    is_over_quota BOOLEAN,
    percentage_used NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(asu.total_size_bytes, 0),
        sq.max_storage_bytes,
        COALESCE(asu.total_size_bytes, 0) > sq.max_storage_bytes,
        ROUND(100.0 * COALESCE(asu.total_size_bytes, 0) / sq.max_storage_bytes, 2)
    FROM storage_quotas sq
    LEFT JOIN audio_storage_usage asu ON sq.user_id = asu.user_id AND sq.channel_id = asu.channel_id
    WHERE sq.user_id = p_user_id AND sq.channel_id = p_channel_id;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on new tables
ALTER TABLE audio_storage_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_files_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_quotas ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own storage usage" ON audio_storage_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own audio metadata" ON audio_files_metadata FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own quotas" ON storage_quotas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own quotas" ON storage_quotas FOR UPDATE USING (auth.uid() = user_id);
