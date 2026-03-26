import type { MatrixClient, MatrixEvent } from "matrix-js-sdk"
import { ReceiptType } from "matrix-js-sdk"

/**
 * Send a read receipt for the given event.
 */
export async function sendReadReceipt(client: MatrixClient, event: MatrixEvent): Promise<void> {
  await client.sendReadReceipt(event, ReceiptType.Read)
}

/**
 * Mark a room as read by sending a receipt for its last event.
 */
export async function markRoomAsRead(client: MatrixClient, roomId: string): Promise<void> {
  const room = client.getRoom(roomId)
  if (!room) return
  const timeline = room.getLiveTimeline()
  const events = timeline.getEvents()
  if (events.length === 0) return
  const lastEvent = events[events.length - 1]
  await sendReadReceipt(client, lastEvent)
}
