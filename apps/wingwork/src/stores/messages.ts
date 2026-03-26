import { create } from "zustand"
import type { MatrixClient, MatrixEvent, Room } from "matrix-js-sdk"
import { EventType, MsgType, RoomEvent } from "matrix-js-sdk"
import type { IRoomTimelineData } from "matrix-js-sdk"

export interface MessageEntry {
  id: string
  roomId: string
  senderId: string
  senderName: string
  content: string
  timestamp: number
  type: string
  isLocal: boolean
}

interface MessagesState {
  messages: Record<string, MessageEntry[]>
  isLoadingHistory: boolean

  loadMessages: (roomId: string) => void
  sendMessage: (roomId: string, content: string) => Promise<void>
  loadOlderMessages: (roomId: string) => Promise<boolean>
  initialize: (client: MatrixClient) => void
  cleanup: () => void
}

function eventToMessage(event: MatrixEvent): MessageEntry | null {
  if (event.getType() !== "m.room.message") return null
  const content = event.getContent()
  return {
    id: event.getId() ?? `local-${event.getTs()}`,
    roomId: event.getRoomId() ?? "",
    senderId: event.getSender() ?? "",
    senderName: event.sender?.name ?? event.getSender() ?? "Unknown",
    content: content.body ?? "",
    timestamp: event.getTs(),
    type: (content.msgtype as string) ?? "m.text",
    isLocal: event.status !== null,
  }
}

let _client: MatrixClient | null = null
let _onTimeline:
  | ((
      event: MatrixEvent,
      room: Room | undefined,
      toStartOfTimeline: boolean | undefined,
      removed: boolean,
      data: IRoomTimelineData,
    ) => void)
  | null = null

export const useMessagesStore = create<MessagesState>()((set, get) => ({
  messages: {},
  isLoadingHistory: false,

  loadMessages: (roomId) => {
    if (!_client) return
    const room = _client.getRoom(roomId)
    if (!room) return

    const events = room.getLiveTimeline().getEvents()
    const messages = events
      .map(eventToMessage)
      .filter((m): m is MessageEntry => m !== null)

    set((state) => ({
      messages: { ...state.messages, [roomId]: messages },
    }))
  },

  sendMessage: async (roomId, content) => {
    if (!_client) throw new Error("Client not initialized")
    await _client.sendEvent(roomId, EventType.RoomMessage, {
      msgtype: MsgType.Text,
      body: content,
    })
  },

  loadOlderMessages: async (roomId) => {
    if (!_client) return false
    const room = _client.getRoom(roomId)
    if (!room) return false

    set({ isLoadingHistory: true })
    try {
      const beforeCount = room.getLiveTimeline().getEvents().length
      await _client.scrollback(room, 30)
      const afterCount = room.getLiveTimeline().getEvents().length

      // Reload the full message list for this room from the timeline.
      const events = room.getLiveTimeline().getEvents()
      const messages = events
        .map(eventToMessage)
        .filter((m): m is MessageEntry => m !== null)

      set((state) => ({
        messages: { ...state.messages, [roomId]: messages },
        isLoadingHistory: false,
      }))

      return afterCount > beforeCount
    } catch {
      set({ isLoadingHistory: false })
      return false
    }
  },

  initialize: (client) => {
    get().cleanup()
    _client = client

    _onTimeline = (
      event: MatrixEvent,
      _room: Room | undefined,
      toStartOfTimeline: boolean | undefined,
    ) => {
      // Only handle live (new) events, not backfill.
      if (toStartOfTimeline) return
      const message = eventToMessage(event)
      if (!message) return
      const roomId = message.roomId
      if (!roomId) return

      set((state) => {
        const existing = state.messages[roomId] ?? []
        // Deduplicate: replace local echo with server echo if IDs differ.
        const filtered = existing.filter((m) => m.id !== message.id)
        return {
          messages: { ...state.messages, [roomId]: [...filtered, message] },
        }
      })
    }

    client.on(
      RoomEvent.Timeline,
      _onTimeline as (...args: unknown[]) => void,
    )
  },

  cleanup: () => {
    if (_client && _onTimeline) {
      _client.removeListener(
        RoomEvent.Timeline,
        _onTimeline as (...args: unknown[]) => void,
      )
    }
    _client = null
    _onTimeline = null
    set({ messages: {}, isLoadingHistory: false })
  },
}))
