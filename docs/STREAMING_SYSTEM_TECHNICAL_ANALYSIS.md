# Video & Audio Streaming System — Critical Technical Analysis

**Platform:** Dataflex Ghana  
**Document type:** Architecture & feature audit  
**Scope:** Teacher channel streaming, admin conference tools, iframe/embed playback, support calls, UI chrome, APIs, and data layer  
**Last reviewed:** June 2026  

---

## Executive summary

The platform implements **five separate media layers**, not one monolithic “streaming system”:

| Layer | Technology | Primary users |
|-------|------------|---------------|
| **Real-time conferences** | LiveKit (WebRTC under the hood) | Admin hosts, regional agents |
| **Teacher channel live** | LiveKit (audio or video rooms) | Channel teachers/hosts, subscribed members |
| **Support calls** | LiveKit (audio-only, 2-party) | Agents ↔ single designated admin |
| **Embedded VOD** | Vimeo / YouTube **iframes** | Agent tutorial feed, channel embed posts |
| **Uploaded / streamed VOD** | HTML5 `<video>`, R2 HTTP range audio | Channel lessons, audio classroom |

**Critical insight:** LiveKit powers all **interactive live** experiences. **iframes are never used for live streaming** — they are strictly for third-party hosted on-demand video (Vimeo/YouTube). Live video uses `VoiceVideoFrame` + LiveKit `VideoTrack`, not `<iframe>`.

Shared UX is coordinated by **`StreamingSessionProvider`** and **`streaming-routes.ts`**, which hide floating action buttons (call widget, announcements, back-to-top) during immersive sessions.

---

## 1. Architecture overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Next.js App Router)                      │
├─────────────────────────────────────────────────────────────────────────┤
│  StreamingSessionProvider  →  useShouldHideStreamingChrome()             │
│  AgentFloatingChrome / AdminFloatingChrome (call FAB)                    │
├──────────────────┬──────────────────────┬───────────────────────────────┤
│ Channel Live     │ Admin Voice Rooms    │ Support Calls                 │
│ ChannelLiveSection│ VoiceRoomsAdminTab  │ AgentCallWidget / AdminCall   │
│        ↓         │        ↓             │        ↓                      │
│ VoiceRoomAdmin   │ VoiceRoomAdminControl│ CallAudioSession              │
│ Control (host)   │ (admin host)         │ (audio only)                  │
│ VoiceRoomAgent   │ VoiceRoomAgentClient │                               │
│ Client (member)  │ (agent listener)     │                               │
├──────────────────┴──────────────────────┴───────────────────────────────┤
│  StableLiveKitRoom → VoiceVideoFrame / VoiceStageFilmstrip / VoIP chrome │
├─────────────────────────────────────────────────────────────────────────┤
│  Embed path (NO LiveKit): tutorial-embed.ts → iframe in feed / channel   │
│  VOD path: HTML5 video (uploads) | R2 range stream (audio lectures)      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Next.js API routes (service-role Supabase) + LiveKit Server SDK         │
│  livekit-server.ts | channel-live-server.ts | call-sessions-server.ts    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
            LiveKit Cloud                    Supabase Postgres
         (rooms, tokens, egress)          (sessions, chat, call state)
                    │                               │
                    └──── Supabase Realtime ──────────┘
                  (channel_live_sessions, call_sessions)
```

### Environment dependencies

| Variable | Purpose |
|----------|---------|
| `LIVEKIT_HOST` | LiveKit server URL for clients |
| `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` | Token minting, room CRUD, egress |
| `LIVEKIT_RECORDING_ENABLED` | Optional auto audio egress on admin room create |
| `CALL_SUPPORT_ADMIN_ID` | Target admin for agent support calls (fallback: first active admin) |
| R2 / Blob credentials | On-demand audio lecture streaming, video uploads |

---

## 2. Streaming chrome framework

Floating UI is suppressed so it does not collide with live controls (especially bottom-right call FAB).

### Core files

| File | Role |
|------|------|
| `lib/streaming-session.tsx` | React context: `useRegisterStreamingSession()`, `useShouldHideStreamingChrome()` |
| `lib/streaming-routes.ts` | Path-based rules for “immersive media” pages |
| `components/agent/AgentFloatingChrome.tsx` | Wraps `AgentCallWidget` |
| `components/admin/AdminFloatingChrome.tsx` | Wraps `AdminCallWidget` |
| `app/agent/layout.tsx` / `app/admin/layout.tsx` | Mount `StreamingSessionProvider` |

### Paths that auto-hide chrome

| Path pattern | Reason |
|--------------|--------|
| `/agent/tutorials` | Full-screen vertical video feed |
| `/agent/teaching/*` | Teaching hub + channel views |
| `/agent/voice-room/*` (not list) | Agent in admin conference |
| `/admin/voice-rooms` | Admin conference management |

### Overlay-based hide

When `VoiceRoomAdminControl` or similar full-screen overlays mount, they call `useRegisterStreamingSession(true)` so chrome hides even on routes not in the list above (e.g. admin controlling a room from the main dashboard tab).

---

## 3. Teacher channel streaming

### Entry points

| Route / component | Audience |
|-------------------|----------|
| `/agent/teaching/[channelId]` | Teachers (`TeacherChannelDashboard`) and members (`MemberChannelView`) |
| `components/channel/ChannelLiveSection.tsx` | Live UI embedded in both views |

### Host flow (teacher / channel admin)

1. Host sees **Channel Live** card with:
   - **Audio live** — starts audio-only LiveKit room
   - **Video live** — starts video-capable room
2. `POST /api/agent/channels/[channelId]/live` with `{ sessionType, title }`:
   - Creates LiveKit room: `channel_{audio|video}_{channelId}_{timestamp}`
   - Inserts row in `channel_live_sessions`
   - Returns host JWT + `serverUrl`
3. Full-screen **`VoiceRoomAdminControl`** opens with:
   - `moderationApiBase=/api/channel-live/{sessionId}`
   - `hideRecording` — **no egress/recording for channel live**
   - `hideNotify` — **no regional agent push** (unlike admin conferences)
   - `recordingEnabled={false}`
4. Parallel **`ChannelLiveChat`** — DB-backed text chat (not LiveKit data channel).

### Member flow

1. **LIVE** badge via `GET .../live` + Supabase Realtime on `channel_live_sessions`.
2. **Join live** → `GET .../live/join` → listener token.
3. **`VoiceRoomAgentClient`** full-screen overlay + **Leave live** (top-right).
4. Hand-raise → host approves via channel-live moderation APIs → client **reconnects with upgraded token** (`speak=1`, `video=1`).

### Rejoin

If host navigates away while session is active: **Rejoin as host** fetches a fresh token via join endpoint.

### Channel non-live media (same teaching hub)

| Feature | UI | Backend |
|---------|-----|---------|
| Uploaded videos | `VideoPostDisplay` | `videos` table, native `<video>` |
| Embed videos | `ChannelEmbedVideoDisplay` | Sanitized iframe (`lib/tutorial-embed.ts`) |
| YouTube posts | `YouTubeVideoDisplay` | `youtube_videos` table |
| Audio lectures | `AudioPlayer`, admin upload UI | R2 via `/api/channel/audio/[lectureId]/stream` |

---

## 4. Admin streaming tools (Agent Conferences)

### Entry points

| Surface | File |
|---------|------|
| Admin dashboard tab | `components/admin/tabs/VoiceRoomsAdminTab.tsx` |
| Dedicated page | `app/admin/voice-rooms/page.tsx` |
| Agent join | `app/agent/voice-rooms/page.tsx` → `/agent/voice-room/[roomName]` |

### Admin capabilities

| Action | API / behavior |
|--------|----------------|
| Create regional room | `POST /api/admin/voice-rooms` — LiveKit room `voice-{slug}-{timestamp}`, notifies agents in region |
| Open host control | `POST /api/admin/voice-rooms/[id]/token` → `VoiceRoomAdminControl` |
| End conference | `POST .../end` |
| Mute / unmute / mute-all | `POST .../mute`, `.../unmute`, `.../mute-all` |
| Video permission per participant | `POST .../video-permission` |
| Kick, assign role | `POST .../kick`, `.../assign-role` |
| Notify agents live | `POST .../notify-live` (**admin only**, not channel live) |
| Recording | `GET/POST .../recording` if `LIVEKIT_RECORDING_ENABLED` |
| Persisted chat | `voice_room_chats` via chat APIs |
| Download / delete recordings | UI in `VoiceRoomsAdminTab` |

### Agent join constraints

- **Region gate:** `voiceRegionsMatch()` — agent must match room region.
- Listener token from `GET /api/agent/voice-rooms/token?roomName=...`
- Same hand-raise, reactions, chat, polls, file share as channel live.

### Admin Teacher Hub (distinction)

`TeacherHubTab` (admin) manages channels, teachers, subscriptions — **it does not host live streams**. All teacher live control is **agent-side** in `ChannelLiveSection`.

---

## 5. Video rendering: iframe vs LiveKit frame

### A. iframe embeds (on-demand only)

**File:** `lib/tutorial-embed.ts`

- Whitelist: `player.vimeo.com`, `youtube.com`, `youtube-nocookie.com`
- `sanitizeTutorialEmbed()` — strips to a single safe iframe
- `prepareAgentFeedEmbed()` — autoplay/muted/controls for TikTok-style tutorial feed

| Surface | Component | Player behavior |
|---------|-----------|-----------------|
| `/agent/tutorials` | `TutorialVideoSlide` + Swiper | Vimeo: `@vimeo/player` custom controls; YouTube: passive iframe |
| Channel embed posts | `ChannelEmbedVideoDisplay` | `dangerouslySetInnerHTML` of prepared iframe |
| Admin tutorials | `TutorialsAdminTab` | Admin pastes raw embed HTML |

**Security note:** Embed path relies on domain whitelist + sanitization. YouTube iframes have limited programmatic control compared to Vimeo.

### B. LiveKit video frame (real-time live)

**File:** `components/voice/VoiceVideoFrame.tsx`

- Renders LiveKit `VideoTrack` (not iframe)
- Variants: `main` | `preview` | `chip`
- Layout: **square 720×720 capture** inside **9:16 wrapper** (`lib/voice-video-utils.ts`, `app/globals.css`)
- Badges: admin, agent, host, speaker, screen, user
- Optional fullscreen (`enableFullscreen`)
- 5s subscription-fail timeout → “camera unavailable” UX

### C. Stage layout

| Component | Role |
|-----------|------|
| `VoiceStageFilmstrip.tsx` | Multi-participant strip |
| `AgentLocalVideoPip.tsx` / `AdminLocalVideoPreview.tsx` | Local camera preview |
| `VoiceVoipChrome.tsx` | Glass panel, floating actions, status bar |

---

## 6. Support calls (audio-only LiveKit)

Separate from conferences and channel live — **1:1 agent → admin**.

| File | Role |
|------|------|
| `components/agent-call-widget.tsx` | Fixed `bottom-6 right-6` phone FAB |
| `components/admin-call-widget.tsx` | Incoming ring + accept/decline |
| `hooks/use-call-widget.ts` | State: idle → calling → in_call / declined / busy_wait |
| `components/calls/CallAudioSession.tsx` | LiveKit room, camera forced off |
| `lib/call-sessions-server.ts` | Room `call_agent_{agentId}_{timestamp}`, max 2 participants |

**APIs:** `/api/calls/initiate`, `incoming`, `respond`, `end`, `availability`

**Limits:**
- One global active `ringing`/`active` call at a time
- Single support admin target (`CALL_SUPPORT_ADMIN_ID` or first admin)

---

## 7. Complete button & control inventory

### Channel Live (`ChannelLiveSection`)

| Control | Who | Action |
|---------|-----|--------|
| Audio live | Host | Start audio session |
| Video live | Host | Start video session |
| Rejoin as host | Host | Re-enter active session |
| Join live | Member | Enter as listener |
| Leave live | Member | Exit overlay (top-right) |

### Host / Admin control panel (`VoiceRoomAdminControl`)

| Control | Voice rooms | Channel live |
|---------|-------------|--------------|
| Mic on/off | ✓ | ✓ |
| Camera on/off | ✓ (video rooms) | ✓ (video sessions) |
| Invite to speak / approve hand | ✓ | ✓ |
| Mute participant / mute all | ✓ | ✓ |
| Video permission toggle | ✓ | ✓ |
| Kick / assign role | ✓ | ✓ |
| End room | ✓ | ✓ |
| Notify agents | ✓ | ✗ (`hideNotify`) |
| Start/stop recording | ✓ (if enabled) | ✗ (`hideRecording`) |
| Share file (image/PDF) | ✓ | ✓ |
| Participants sheet | ✓ | ✓ |
| Chat panel | ✓ | ✓ (+ `ChannelLiveChat`) |
| Polls | ✓ | ✓ |
| Stream stats | ✓ | ✓ |
| Reactions (👏🔥💡❤️) | ✓ | ✓ |
| Close / end overlay | ✓ | ✓ |

### Agent participant (`VoiceRoomAgentClient`)

| Control | When available |
|---------|----------------|
| Join conference | Pre-join |
| Raise hand | Listener |
| Reactions | In room |
| Mic mute/unmute | After approved to speak |
| Camera on/off | When video allowed |
| Chat / shared files | In room |
| End call / leave | Always |

### Support call widgets

| Side | Controls |
|------|----------|
| Agent | Call Support, Cancel, Hang Up, Mute |
| Admin | Accept, Decline, Hang Up, Mute |

### Tutorial feed (iframe)

Enable sound, swipe navigation, comments, Vimeo play/pause/seek/volume.

---

## 8. LiveKit client patterns

### Stable connection

`StableLiveKitRoom.tsx` defers `connect` until after mount — mitigates React Strict Mode double-connect/disconnect.

### Token upgrade (permission elevation)

Listeners cannot publish until promoted. Flow:

1. Host/admin calls unmute API
2. Server sends LiveKit **data message** (`unmute-command`, `video-permission`)
3. Client fetches **new JWT** with `speak=1` / `video=1`
4. Client **disconnects and reconnects** with upgraded token

### Data channel topics (`lib/voice-room-topics.ts`)

Hand-raise, unmute commands, video permission, reactions, admin file share, polls — ephemeral over LiveKit data, separate from persisted DB chat.

### Roles (`VoiceParticipantRole`)

`admin` | `moderator` | `co-host` | `speaker` | `listener` — mapped from channel membership for teacher sessions.

---

## 9. API endpoint reference

### Channel live (agent auth)

| Method | Endpoint |
|--------|----------|
| GET | `/api/agent/channels/[channelId]/live` |
| POST | `/api/agent/channels/[channelId]/live` |
| GET | `/api/agent/channels/[channelId]/live/join` |
| POST | `/api/channel-live/[sessionId]/end` |
| POST | `/api/channel-live/[sessionId]/mute` |
| POST | `/api/channel-live/[sessionId]/unmute` |
| POST | `/api/channel-live/[sessionId]/video-permission` |
| GET/POST | `/api/channel-live/[sessionId]/messages` |

### Admin voice rooms (admin auth)

| Method | Endpoint |
|--------|----------|
| GET/POST | `/api/admin/voice-rooms` |
| POST | `/api/admin/voice-rooms/[id]/token` |
| POST | `/api/admin/voice-rooms/[id]/end` |
| POST | `/api/admin/voice-rooms/[id]/mute` |
| POST | `/api/admin/voice-rooms/[id]/unmute` |
| POST | `/api/admin/voice-rooms/[id]/mute-all` |
| POST | `/api/admin/voice-rooms/[id]/video-permission` |
| POST | `/api/admin/voice-rooms/[id]/kick` |
| POST | `/api/admin/voice-rooms/[id]/assign-role` |
| GET/POST | `/api/admin/voice-rooms/[id]/recording` |
| POST | `/api/admin/voice-rooms/[id]/notify-live` |
| GET/POST/DELETE | `/api/admin/voice-rooms/chats/[roomName]` |

### Agent voice rooms (agent auth)

| Method | Endpoint |
|--------|----------|
| GET | `/api/agent/voice-rooms` |
| GET | `/api/agent/voice-rooms/token` |
| GET/POST | `/api/agent/voice-rooms/[roomName]/chats` |

### Support calls

| Method | Endpoint |
|--------|----------|
| POST | `/api/calls/initiate` |
| GET | `/api/calls/incoming` |
| POST | `/api/calls/respond` |
| POST | `/api/calls/end` |
| GET | `/api/calls/availability` |

### On-demand media (non-LiveKit)

| Method | Endpoint |
|--------|----------|
| GET | `/api/channel/audio/[lectureId]/stream` |
| GET | `/api/agent/tutorials` |

---

## 10. Database tables

| Table | Migration | Purpose |
|-------|-----------|---------|
| `voice_rooms` | `072_voice_rooms.sql` | Admin conference metadata |
| `voice_room_chats` | `073_voice_room_chats.sql` | Persisted conference chat |
| `channel_live_sessions` | `075_channel_live_sessions.sql` | Teacher live sessions |
| `channel_live_messages` | `075_channel_live_sessions.sql` | Live session text chat |
| `call_sessions` | `074_agent_admin_calls.sql` | Support call state |
| `channel_audio_lectures` | `082_audio_classroom.sql` | On-demand audio |
| `videos` | `01-create-video-tables.sql` | Uploaded channel video |
| `youtube_videos` | `025_create_youtube_videos_table.sql` | YouTube link posts |
| `teaching_channels`, `channel_members` | teaching schemas | Access & roles |

**RLS:** Streaming tables use restrictive policies; clients access via Next.js API routes with service role (`getAdminClient()`).

**Realtime publications:** `call_sessions`, `channel_live_sessions`, `channel_live_messages`.

---

## 11. Key source files index

| Path | Purpose |
|------|---------|
| `lib/livekit-server.ts` | Server LiveKit SDK — tokens, rooms, moderation, egress |
| `lib/channel-live-server.ts` | Channel live domain logic |
| `lib/call-sessions-server.ts` | Support call rooms |
| `lib/tutorial-embed.ts` | iframe sanitization |
| `lib/voice-room-topics.ts` | LiveKit data topics |
| `lib/voice-video-utils.ts` | Mobile layout, 720×720 defaults |
| `lib/livekit-error-utils.ts` | Transient error filtering |
| `components/voice/VoiceRoomAdminControl.tsx` | Shared host/admin control (~1500 lines) |
| `components/voice/VoiceRoomAgentClient.tsx` | Shared agent/member client |
| `components/voice/StableLiveKitRoom.tsx` | Connection lifecycle |
| `hooks/use-call-widget.ts` | Support call state machine |

---

## 12. Critical analysis

### Strengths

1. **Smart component reuse** — `VoiceRoomAdminControl` and `VoiceRoomAgentClient` serve both admin conferences and teacher channel live via `moderationApiBase` and props (`hideRecording`, `hideNotify`). Reduces duplication but increases coupling.
2. **Clear separation of live vs VOD** — LiveKit for interactive; iframes/HTML5/R2 for passive consumption.
3. **Chrome suppression** — Path + overlay context prevents FAB collisions during immersive UI (wallet rewards slide-up uses similar z-index thinking).
4. **Idempotent session patterns** — One active live per channel (409 on duplicate start); global single support call lock.
5. **Defense in depth on embeds** — Domain whitelist + single-iframe sanitization.
6. **Token upgrade pattern** — Correct LiveKit model for listener → speaker promotion.

### Gaps & risks

| Area | Severity | Detail |
|------|----------|--------|
| **No channel live recording** | Medium | Teachers cannot replay lives; admin conferences can (if egress enabled). Product gap if compliance/replay needed. |
| **No channel live regional notify** | Low | Admin rooms push to agents; teacher lives rely on members already on channel page + Realtime. |
| **Single support admin** | High (scale) | `CALL_SUPPORT_ADMIN_ID` — no queue, no round-robin, no multi-admin. |
| **Global call lock** | Medium | Only one ringing/active support call platform-wide. |
| **YouTube tutorial controls** | Low | Passive iframe vs rich Vimeo `@vimeo/player` — inconsistent UX. |
| **Reconnect on token upgrade** | Medium | Brief disconnect during speak/video promotion; acceptable but visible to users on poor networks. |
| **Square 720 video in 9:16 shell** | Low | Intentional TikTok-style layout; may crop oddly on some devices/desktop. |
| **RLS blocks direct client DB** | Info | Correct for security; all features depend on API route availability. |
| **ffmpeg in repo** | Info | Used for upload/transcode pipelines, not live ingest — do not confuse with RTMP streaming. |
| **Paystack / unrelated** | — | Wallet top-up uses separate Paystack inline flow; not part of this streaming stack. |

### iframe vs LiveKit — common confusion

| Question | Answer |
|----------|--------|
| Is live video in an iframe? | **No.** Live uses LiveKit `VideoTrack` in `VoiceVideoFrame`. |
| When are iframes used? | Tutorials feed, channel embed posts (Vimeo/YouTube URLs). |
| Can teacher stream via YouTube Live embed? | **Not implemented.** Would be embed-only, no hand-raise/moderation. |

### Operational recommendations

1. **Document LiveKit dashboard** — Room names follow predictable prefixes: `voice-*`, `channel_audio_*`, `channel_video_*`, `call_agent_*`.
2. **Monitor egress costs** — Recording only on admin rooms when `LIVEKIT_RECORDING_ENABLED=true`.
3. **Support call scaling** — If volume grows, replace single-admin model with queue + multiple `admin_users` availability.
4. **Teacher replay** — If required, enable egress for `channel_live_sessions` with retention policy (currently explicitly disabled in UI).
5. **Mobile WebView** — LiveKit and iframe embeds may fail in in-app browsers; document “open in Chrome/Safari” for agents (same class of issue as Paystack checkout).

---

## 13. End-to-end data flows

### Admin conference

```
Admin creates room (region) → LiveKit + voice_rooms row → notify regional agents
→ Admin: VoiceRoomAdminControl (host token)
→ Agent: /agent/voice-room/[name] → VoiceRoomAgentClient (listener)
→ Hand raise → admin unmute → token upgrade → speaker
→ Optional: recording egress → download from VoiceRoomsAdminTab
```

### Teacher channel live

```
Host: Audio/Video live → channel_live_sessions + LiveKit room
→ Realtime updates members on channel page
→ Host: VoiceRoomAdminControl (channel-live APIs, no record/notify)
→ Member: Join live → VoiceRoomAgentClient + ChannelLiveChat
→ Host ends → POST channel-live/.../end → room deleted
```

### Agent support call

```
Agent Call Support → call_sessions (ringing) → admin Realtime + incoming API
→ Admin accept → both in CallAudioSession (audio only)
→ Either hangs up → call_sessions ended
```

### Passive video (no LiveKit)

```
Tutorial: GET /api/agent/tutorials → iframe in Swiper feed
Channel embed: stored HTML → sanitizeTutorialEmbed → ChannelEmbedVideoDisplay
Uploaded video: videos table → HTML5 <video src="...">
Audio lecture: R2 → GET /api/channel/audio/[id]/stream (range requests)
```

---

## 14. Related routes (quick reference)

| Route | Feature |
|-------|---------|
| `/agent/teaching/[channelId]` | Channel dashboard + `ChannelLiveSection` |
| `/agent/voice-rooms` | Conference list |
| `/agent/voice-room/[roomName]` | Join admin conference |
| `/agent/tutorials` | Vertical iframe tutorial feed |
| `/admin` → Agent Conference tab | `VoiceRoomsAdminTab` |
| `/admin/voice-rooms` | Full conference admin |
| `/admin/agent-calls` | Support call history |

---

*This document reflects the codebase as of the wallet top-up / streaming chrome upgrades branch. For schema details see `scripts/072`–`075`, `082`, and `docs/COMPLETE_PLATFORM_REFERENCE.md`.*
