-- Enable Supabase Realtime delivery for call_sessions (admin/agent widgets use anon client).
-- Writes stay server-only via service role; clients only need SELECT for postgres_changes.

DROP POLICY IF EXISTS "Block anon/authenticated" ON call_sessions;

CREATE POLICY "call_sessions_select_for_realtime" ON call_sessions
  FOR SELECT
  TO anon, authenticated
  USING (status IN ('ringing', 'active', 'declined', 'ended', 'busy'));

CREATE POLICY "call_sessions_no_client_insert" ON call_sessions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (false);

CREATE POLICY "call_sessions_no_client_update" ON call_sessions
  FOR UPDATE
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "call_sessions_no_client_delete" ON call_sessions
  FOR DELETE
  TO anon, authenticated
  USING (false);
