"use client"

import { MediaMessage } from "./media/MediaMessage"

interface Message {
  id: string
  content?: string
  agent_id: string
  agent_name: string
  agent_avatar?: string
  created_at: string
  media?: Array<{
    id: string
    media_type: "image" | "audio"
    media_url: string
    file_name: string
    thumbnail_url?: string
    duration?: number
  }>
}

interface ChannelMessageListProps {
  messages: Message[]
  currentUserId: string
}

export function ChannelMessageList({ messages, currentUserId }: ChannelMessageListProps) {
  return (
    <div className="space-y-4 p-4">
      {messages.map((message) => (
        <MediaMessage
          key={message.id}
          content={message.content}
          media={message.media || []}
          senderName={message.agent_name}
          senderAvatar={message.agent_avatar}
          timestamp={new Date(message.created_at)}
          isOwn={message.agent_id === currentUserId}
        />
      ))}
    </div>
  )
}
