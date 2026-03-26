export interface StoredSession {
  homeserverUrl: string
  accessToken: string
  userId: string
  deviceId: string
}

export interface LoginResult {
  accessToken: string
  userId: string
  deviceId: string
  homeserver: string
}

export const SESSION_STORAGE_KEY = "wingwork_session"
