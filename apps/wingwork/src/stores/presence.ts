import { create } from "zustand"
import type { MatrixClient, User } from "matrix-js-sdk"
import { UserEvent } from "matrix-js-sdk"

export type PresenceStatus = "online" | "unavailable" | "offline"

interface PresenceEntry {
  userId: string
  presence: PresenceStatus
  statusMsg: string | null
  lastActiveAgo: number | null
}

interface PresenceState {
  presence: Record<string, PresenceEntry>

  getPresence: (userId: string) => PresenceEntry | null
  initialize: (client: MatrixClient) => void
  cleanup: () => void
}

function mapPresence(raw: string | undefined): PresenceStatus {
  if (raw === "online") return "online"
  if (raw === "unavailable") return "unavailable"
  return "offline"
}

function userToEntry(user: User): PresenceEntry {
  return {
    userId: user.userId,
    presence: mapPresence(user.presence),
    statusMsg: user.presenceStatusMsg ?? null,
    lastActiveAgo: user.lastActiveAgo ?? null,
  }
}

let _client: MatrixClient | null = null
let _onPresence: ((event: unknown, user: User) => void) | null = null

export const usePresenceStore = create<PresenceState>()((set, get) => ({
  presence: {},

  getPresence: (userId) => {
    return get().presence[userId] ?? null
  },

  initialize: (client) => {
    get().cleanup()
    _client = client

    // Seed presence from already-known users.
    const initialPresence: Record<string, PresenceEntry> = {}
    const users = client.getUsers()
    for (const user of users) {
      initialPresence[user.userId] = userToEntry(user)
    }
    set({ presence: initialPresence })

    _onPresence = (_event: unknown, user: User) => {
      const entry = userToEntry(user)
      set((state) => ({
        presence: { ...state.presence, [entry.userId]: entry },
      }))
    }

    client.on(
      UserEvent.Presence,
      _onPresence as (...args: unknown[]) => void,
    )
  },

  cleanup: () => {
    if (_client && _onPresence) {
      _client.removeListener(
        UserEvent.Presence,
        _onPresence as (...args: unknown[]) => void,
      )
    }
    _client = null
    _onPresence = null
    set({ presence: {} })
  },
}))
