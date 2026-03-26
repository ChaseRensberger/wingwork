import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { EventType, Preset, Visibility } from "matrix-js-sdk"
import { useAuthStore } from "@/stores/auth"
import { useRoomsStore } from "@/stores/rooms"

interface RoomActionsProps {
  activeAction: "join" | "create" | "dm" | null
  onClose: () => void
}

export function RoomActions({ activeAction, onClose }: RoomActionsProps) {
  if (!activeAction) return null

  return (
    <div className="p-2 border-b border-sidebar-border">
      {activeAction === "join" && <JoinRoomForm onClose={onClose} />}
      {activeAction === "create" && <CreateRoomForm onClose={onClose} />}
      {activeAction === "dm" && <StartDmForm onClose={onClose} />}
    </div>
  )
}

interface FormProps {
  onClose: () => void
}

function JoinRoomForm({ onClose }: FormProps) {
  const navigate = useNavigate()
  const client = useAuthStore((s) => s.client)
  const refreshRooms = useRoomsStore((s) => s.refreshRooms)
  const setActiveRoom = useRoomsStore((s) => s.setActiveRoom)

  const [roomIdOrAlias, setRoomIdOrAlias] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleJoin() {
    if (!client || !roomIdOrAlias.trim()) return
    setLoading(true)
    setError(null)
    try {
      const result = await client.joinRoom(roomIdOrAlias.trim())
      const roomId = result.roomId
      refreshRooms()
      setActiveRoom(roomId)
      void navigate({ to: "/room/$roomId", params: { roomId } })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to join room")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">
        join room
      </label>
      <input
        type="text"
        value={roomIdOrAlias}
        onChange={(e) => setRoomIdOrAlias(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleJoin()}
        placeholder="!room:matrix.org or #alias:server"
        className="w-full bg-input border border-border p-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground mb-2"
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => void handleJoin()}
          disabled={loading}
          className="text-xs bg-foreground text-background px-2 py-1 font-mono hover:opacity-90 transition-opacity"
        >
          {loading ? "[joining...]" : "[join]"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          [cancel]
        </button>
      </div>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  )
}

function CreateRoomForm({ onClose }: FormProps) {
  const navigate = useNavigate()
  const client = useAuthStore((s) => s.client)
  const refreshRooms = useRoomsStore((s) => s.refreshRooms)
  const setActiveRoom = useRoomsStore((s) => s.setActiveRoom)

  const [name, setName] = useState("")
  const [topic, setTopic] = useState("")
  const [isPrivate, setIsPrivate] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    if (!client || !name.trim()) return
    setLoading(true)
    setError(null)
    try {
      const result = await client.createRoom({
        name: name.trim(),
        topic: topic.trim() || undefined,
        visibility: isPrivate ? Visibility.Private : Visibility.Public,
        preset: isPrivate ? Preset.PrivateChat : Preset.PublicChat,
      })
      const roomId = result.room_id
      refreshRooms()
      setActiveRoom(roomId)
      void navigate({ to: "/room/$roomId", params: { roomId } })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to create room")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">
        create channel
      </label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="room-name"
        className="w-full bg-input border border-border p-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground mb-2"
      />
      <input
        type="text"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="optional topic"
        className="w-full bg-input border border-border p-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground mb-2"
      />
      <button
        type="button"
        onClick={() => setIsPrivate((p) => !p)}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer mb-2 block"
      >
        [{isPrivate ? "x" : " "}] private
      </button>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => void handleCreate()}
          disabled={loading}
          className="text-xs bg-foreground text-background px-2 py-1 font-mono hover:opacity-90 transition-opacity"
        >
          {loading ? "[creating...]" : "[create]"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          [cancel]
        </button>
      </div>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  )
}

function StartDmForm({ onClose }: FormProps) {
  const navigate = useNavigate()
  const client = useAuthStore((s) => s.client)
  const refreshRooms = useRoomsStore((s) => s.refreshRooms)
  const setActiveRoom = useRoomsStore((s) => s.setActiveRoom)

  const [userId, setUserId] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleStart() {
    if (!client || !userId.trim()) return
    setLoading(true)
    setError(null)
    try {
      const targetUserId = userId.trim()
      const result = await client.createRoom({
        is_direct: true,
        invite: [targetUserId],
        preset: Preset.TrustedPrivateChat,
      })
      const roomId = result.room_id

      // update m.direct account data
      const existingDirect =
        (client.getAccountData(EventType.Direct)?.getContent() as Record<string, string[]> | undefined) ?? {}
      const existingRooms = existingDirect[targetUserId] ?? []
      await client.setAccountData(EventType.Direct, {
        ...existingDirect,
        [targetUserId]: [...existingRooms, roomId],
      })

      refreshRooms()
      setActiveRoom(roomId)
      void navigate({ to: "/room/$roomId", params: { roomId } })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to start dm")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">
        new message
      </label>
      <input
        type="text"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleStart()}
        placeholder="@user:matrix.org"
        className="w-full bg-input border border-border p-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground mb-2"
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => void handleStart()}
          disabled={loading}
          className="text-xs bg-foreground text-background px-2 py-1 font-mono hover:opacity-90 transition-opacity"
        >
          {loading ? "[starting...]" : "[start]"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          [cancel]
        </button>
      </div>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  )
}
