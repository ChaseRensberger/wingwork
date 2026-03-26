import * as sdk from "matrix-js-sdk"
import type { MatrixClient } from "matrix-js-sdk"
import { ClientEvent, SyncState } from "matrix-js-sdk"
import type { LoginResult } from "./types"

/**
 * Create an unauthenticated Matrix client for a given homeserver.
 */
export function createMatrixClient(baseUrl: string): MatrixClient {
  return sdk.createClient({ baseUrl })
}

/**
 * Authenticate with a Matrix homeserver using username/password.
 */
export async function loginWithPassword(
  client: MatrixClient,
  userId: string,
  password: string,
): Promise<LoginResult> {
  const response = await client.loginWithPassword(userId, password)
  return {
    accessToken: response.access_token,
    userId: response.user_id,
    deviceId: response.device_id,
    homeserver: client.getHomeserverUrl(),
  }
}

/**
 * Create an authenticated Matrix client from stored credentials.
 */
export function restoreSession(
  baseUrl: string,
  accessToken: string,
  userId: string,
  deviceId: string,
): MatrixClient {
  return sdk.createClient({
    baseUrl,
    accessToken,
    userId,
    deviceId,
  })
}

/**
 * Start the sync loop. Resolves once the client reaches the PREPARED state.
 */
export function startSync(client: MatrixClient): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const onSync = (state: string): void => {
      if (state === SyncState.Prepared) {
        client.removeListener(ClientEvent.Sync, onSync)
        resolve()
      } else if (state === SyncState.Error) {
        client.removeListener(ClientEvent.Sync, onSync)
        reject(new Error("Sync failed"))
      }
    }
    client.on(ClientEvent.Sync, onSync)
    client.startClient({ initialSyncLimit: 20 })
  })
}

/**
 * Stop the sync loop.
 */
export function stopSync(client: MatrixClient): void {
  client.stopClient()
}

/**
 * Discover which login flows a homeserver supports.
 */
export async function discoverLoginFlows(
  baseUrl: string,
): Promise<{ flows: Array<{ type: string }> }> {
  const url = `${baseUrl}/_matrix/client/r0/login`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to discover login flows: ${response.status}`)
  }
  return response.json() as Promise<{ flows: Array<{ type: string }> }>
}
