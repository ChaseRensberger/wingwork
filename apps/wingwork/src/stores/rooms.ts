import { create } from "zustand"
import type { MatrixClient, Room } from "matrix-js-sdk"
import { ClientEvent, EventType, RoomEvent, NotificationCountType } from "matrix-js-sdk"

export interface RoomEntry {
  id: string
  name: string
  topic: string | null
  isDirect: boolean
  dmPartnerUserId: string | null
  unreadCount: number
  lastActivity: number
  avatarUrl: string | null
  membership: string
}

interface RoomsState {
  rooms: RoomEntry[]
  activeRoomId: string | null

  setActiveRoom: (roomId: string | null) => void
  refreshRooms: () => void
  initialize: (client: MatrixClient) => void
  cleanup: () => void
}

/** Set of room IDs that are direct messages. */
function getDirectRoomIds(client: MatrixClient): Set<string> {
  const ids = new Set<string>()
  const directEvent = client.getAccountData(EventType.Direct)
  if (!directEvent) return ids
  const content = directEvent.getContent() as Record<string, string[]>
  for (const userId of Object.keys(content)) {
    const roomIds = content[userId]
    if (Array.isArray(roomIds)) {
      for (const roomId of roomIds) {
        ids.add(roomId)
      }
    }
  }
  return ids
}

function getDmPartnerUserId(room: Room, ownUserId: string): string | null {
  const members = room.getJoinedMembers()
  const partner = members.find((m) => m.userId !== ownUserId)
  return partner?.userId ?? null
}

function roomToEntry(room: Room, directRoomIds: Set<string>, ownUserId: string): RoomEntry {
  const isDirect = directRoomIds.has(room.roomId)
  const lastEvent = room.getLastLiveEvent()
  return {
    id: room.roomId,
    name: room.name || room.roomId,
    topic: room.currentState.getStateEvents("m.room.topic", "")?.getContent()?.topic ?? null,
    isDirect,
    dmPartnerUserId: isDirect ? getDmPartnerUserId(room, ownUserId) : null,
    unreadCount: room.getUnreadNotificationCount(NotificationCountType.Total) ?? 0,
    lastActivity: lastEvent ? lastEvent.getTs() : 0,
    avatarUrl: room.getAvatarUrl(room.client.getHomeserverUrl(), 48, 48, "crop") ?? null,
    membership: room.getMyMembership(),
  }
}

function buildRoomList(client: MatrixClient): RoomEntry[] {
  const directRoomIds = getDirectRoomIds(client)
  const ownUserId = client.getUserId() ?? ""
  return client
    .getRooms()
    .filter((room) => room.getMyMembership() === "join")
    .map((room) => roomToEntry(room, directRoomIds, ownUserId))
    .sort((a, b) => b.lastActivity - a.lastActivity)
}

// Store references to bound listeners so we can remove them during cleanup.
let _client: MatrixClient | null = null
let _onRoom: (() => void) | null = null
let _onTimeline: (() => void) | null = null
let _onRoomName: (() => void) | null = null
let _onReceipt: (() => void) | null = null
let _onDeleteRoom: (() => void) | null = null

export const useRoomsStore = create<RoomsState>()((set, get) => ({
  rooms: [],
  activeRoomId: null,

  setActiveRoom: (roomId) => set({ activeRoomId: roomId }),

  refreshRooms: () => {
    if (!_client) return
    set({ rooms: buildRoomList(_client) })
  },

  initialize: (client) => {
    // Clean up any previous listeners first.
    get().cleanup()

    _client = client
    set({ rooms: buildRoomList(client) })

    const refresh = (): void => {
      set({ rooms: buildRoomList(client) })
    }

    _onRoom = refresh
    _onTimeline = refresh
    _onRoomName = refresh
    _onReceipt = refresh
    _onDeleteRoom = refresh

    client.on(ClientEvent.Room, _onRoom as (...args: unknown[]) => void)
    client.on(RoomEvent.Timeline, _onTimeline as (...args: unknown[]) => void)
    client.on(RoomEvent.Name, _onRoomName as (...args: unknown[]) => void)
    client.on(RoomEvent.Receipt, _onReceipt as (...args: unknown[]) => void)
    client.on(ClientEvent.DeleteRoom, _onDeleteRoom as (...args: unknown[]) => void)
  },

  cleanup: () => {
    if (!_client) return
    const client = _client

    if (_onRoom) client.removeListener(ClientEvent.Room, _onRoom as (...args: unknown[]) => void)
    if (_onTimeline)
      client.removeListener(RoomEvent.Timeline, _onTimeline as (...args: unknown[]) => void)
    if (_onRoomName)
      client.removeListener(RoomEvent.Name, _onRoomName as (...args: unknown[]) => void)
    if (_onReceipt)
      client.removeListener(RoomEvent.Receipt, _onReceipt as (...args: unknown[]) => void)
    if (_onDeleteRoom)
      client.removeListener(ClientEvent.DeleteRoom, _onDeleteRoom as (...args: unknown[]) => void)

    _client = null
    _onRoom = null
    _onTimeline = null
    _onRoomName = null
    _onReceipt = null
    _onDeleteRoom = null

    set({ rooms: [], activeRoomId: null })
  },
}))
