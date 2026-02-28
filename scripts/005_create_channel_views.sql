-- Create views for easier querying with agent details

-- View: channel_members with agent details
CREATE OR REPLACE VIEW channel_members_with_agents AS
SELECT 
  cm.id,
  cm.channel_id,
  cm.agent_id,
  cm.role,
  cm.joined_at
FROM channel_members cm;

-- View: channel_join_requests with agent details
CREATE OR REPLACE VIEW channel_join_requests_with_agents AS
SELECT 
  cjr.id,
  cjr.channel_id,
  cjr.agent_id,
  cjr.status,
  cjr.request_message as join_message,
  cjr.requested_at
FROM channel_join_requests cjr;

-- View: channel_messages with agent and media details
CREATE OR REPLACE VIEW channel_messages_with_details AS
SELECT 
  cm.id,
  cm.channel_id,
  cm.agent_id,
  cm.content,
  cm.message_type,
  cm.created_at,
  cm.updated_at,
  cm.is_edited,
  json_agg(
    json_build_object(
      'id', mm.id,
      'media_type', mm.media_type,
      'media_url', mm.media_url,
      'file_name', mm.file_name,
      'file_size', mm.file_size,
      'duration', mm.duration,
      'width', mm.width,
      'height', mm.height,
      'thumbnail_url', mm.thumbnail_url
    )
  ) FILTER (WHERE mm.id IS NOT NULL) as media
FROM channel_messages cm
LEFT JOIN message_media mm ON cm.id = mm.message_id
GROUP BY cm.id;
