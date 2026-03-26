import { create } from "zustand"
import type { MatrixClient } from "matrix-js-sdk"
import { ClientEvent } from "matrix-js-sdk"
import {
  createMatrixClient,
  loginWithPassword,
  restoreSession,
  startSync,
  stopSync,
} from "@/lib/matrix/client"
import { SESSION_STORAGE_KEY } from "@/lib/matrix/types"
import type { StoredSession } from "@/lib/matrix/types"

interface AuthState {
  client: MatrixClient | null
  userId: string | null
  accessToken: string | null
  deviceId: string | null
  homeserverUrl: string | null
  isLoggedIn: boolean
  isLoading: boolean
  isSyncing: boolean
  syncState: string | null
  error: string | null

  login: (homeserverUrl: string, userId: string, password: string) => Promise<void>
  logout: () => Promise<void>
  restoreSession: () => Promise<boolean>
  clearError: () => void
}

function persistSession(session: StoredSession): void {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
}

function loadSession(): StoredSession | null {
  const raw = localStorage.getItem(SESSION_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredSession
  } catch {
    return null
  }
}

function clearSession(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY)
}

function attachSyncListener(
  client: MatrixClient,
  set: (partial: Partial<AuthState>) => void,
): void {
  client.on(ClientEvent.Sync, (state: string) => {
    set({
      syncState: state,
      isSyncing: state === "SYNCING" || state === "PREPARED",
    })
  })
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  client: null,
  userId: null,
  accessToken: null,
  deviceId: null,
  homeserverUrl: null,
  isLoggedIn: false,
  isLoading: false,
  isSyncing: false,
  syncState: null,
  error: null,

  login: async (homeserverUrl, userId, password) => {
    set({ isLoading: true, error: null })
    try {
      const client = createMatrixClient(homeserverUrl)
      const result = await loginWithPassword(client, userId, password)

      persistSession({
        homeserverUrl,
        accessToken: result.accessToken,
        userId: result.userId,
        deviceId: result.deviceId,
      })

      set({
        client,
        userId: result.userId,
        accessToken: result.accessToken,
        deviceId: result.deviceId,
        homeserverUrl,
        isLoggedIn: true,
      })

      attachSyncListener(client, set)
      await startSync(client)

      set({ isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : "Login failed",
      })
      throw err
    }
  },

  logout: async () => {
    const { client } = get()
    if (client) {
      stopSync(client)
    }
    clearSession()
    set({
      client: null,
      userId: null,
      accessToken: null,
      deviceId: null,
      homeserverUrl: null,
      isLoggedIn: false,
      isLoading: false,
      isSyncing: false,
      syncState: null,
      error: null,
    })
  },

  restoreSession: async () => {
    const session = loadSession()
    if (!session) return false

    set({ isLoading: true, error: null })
    try {
      const client = restoreSession(
        session.homeserverUrl,
        session.accessToken,
        session.userId,
        session.deviceId,
      )

      set({
        client,
        userId: session.userId,
        accessToken: session.accessToken,
        deviceId: session.deviceId,
        homeserverUrl: session.homeserverUrl,
        isLoggedIn: true,
      })

      attachSyncListener(client, set)
      await startSync(client)

      set({ isLoading: false })
      return true
    } catch (err) {
      clearSession()
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : "Session restore failed",
      })
      return false
    }
  },

  clearError: () => set({ error: null }),
}))
