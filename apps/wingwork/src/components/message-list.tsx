import { useEffect, useRef, useMemo } from "react"
import { cn } from "@workspace/ui/lib/utils"
import { useMessagesStore, type MessageEntry } from "@/stores/messages"
import { useAuthStore } from "@/stores/auth"
import { markRoomAsRead } from "@/lib/matrix/receipts"

interface MessageListProps {
  roomId: string
}

function formatTime(ts: number): string {
  const date = new Date(ts)
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

function getDateLabel(date: Date): string {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diff = today.getTime() - target.getTime()
  const oneDay = 86_400_000

  if (diff === 0) return "today"
  if (diff === oneDay) return "yesterday"

  const weekday = date
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase()
  const month = date
    .toLocaleDateString("en-US", { month: "short" })
    .toLowerCase()
  const day = date.getDate()
  return `${weekday}, ${month} ${day}`
}

interface DateGroup {
  label: string
  messages: MessageEntry[]
}

function groupByDate(messages: MessageEntry[]): DateGroup[] {
  const groups: DateGroup[] = []
  let currentLabel: string | null = null
  let currentGroup: MessageEntry[] = []

  for (const msg of messages) {
    const label = getDateLabel(new Date(msg.timestamp))
    if (label !== currentLabel) {
      if (currentLabel !== null && currentGroup.length > 0) {
        groups.push({ label: currentLabel, messages: currentGroup })
      }
      currentLabel = label
      currentGroup = [msg]
    } else {
      currentGroup.push(msg)
    }
  }

  if (currentLabel !== null && currentGroup.length > 0) {
    groups.push({ label: currentLabel, messages: currentGroup })
  }

  return groups
}

export function MessageList({ roomId }: MessageListProps) {
  const messages = useMessagesStore((s) => s.messages[roomId] ?? [])
  const loadMessages = useMessagesStore((s) => s.loadMessages)
  const loadOlderMessages = useMessagesStore((s) => s.loadOlderMessages)
  const isLoadingHistory = useMessagesStore((s) => s.isLoadingHistory)
  const initialize = useMessagesStore((s) => s.initialize)
  const cleanup = useMessagesStore((s) => s.cleanup)

  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Initialize once
  useEffect(() => {
    const { client } = useAuthStore.getState()
    if (client) {
      initialize(client)
    }
    return () => cleanup()
  }, [initialize, cleanup])

  // Load messages when room changes and mark the room as read
  useEffect(() => {
    loadMessages(roomId)
    const { client } = useAuthStore.getState()
    if (client) {
      void markRoomAsRead(client, roomId)
    }
  }, [roomId, loadMessages])

  // Send a read receipt when new messages arrive
  useEffect(() => {
    if (messages.length === 0) return
    const { client } = useAuthStore.getState()
    if (client) {
      void markRoomAsRead(client, roomId)
    }
  }, [roomId, messages])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  function handleScroll() {
    const el = scrollContainerRef.current
    if (!el) return
    if (el.scrollTop < 50 && !isLoadingHistory) {
      const prevHeight = el.scrollHeight
      loadOlderMessages(roomId).then((hasMore) => {
        if (hasMore && el) {
          el.scrollTop = el.scrollHeight - prevHeight
        }
      })
    }
  }

  const dateGroups = useMemo(() => groupByDate(messages), [messages])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        no messages yet
      </div>
    )
  }

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4"
    >
      {isLoadingHistory && (
        <div className="text-xs text-muted-foreground text-center py-2">
          loading...
        </div>
      )}

      {dateGroups.map((group) => (
        <div key={group.label}>
          {/* date separator */}
          <div className="flex items-center gap-4 my-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">
              {group.label}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* messages */}
          {group.messages.map((msg, i) => {
            const prev = i > 0 ? group.messages[i - 1] : null
            const showUser = !prev || prev.senderId !== msg.senderId

            return (
              <div
                key={msg.id}
                className={cn(
                  "group flex gap-3",
                  showUser ? "mt-3" : "mt-0.5",
                )}
              >
                {/* timestamp */}
                <div
                  className={cn(
                    "w-16 flex-shrink-0 text-right text-xs text-muted-foreground",
                    !showUser &&
                      "opacity-0 group-hover:opacity-100 transition-opacity",
                  )}
                >
                  {formatTime(msg.timestamp)}
                </div>

                {/* content */}
                <div className="flex-1 min-w-0">
                  {showUser && (
                    <span className="text-sm font-medium mr-2">
                      {msg.senderName.toLowerCase()}
                    </span>
                  )}
                  <span className="text-sm">{msg.content}</span>
                </div>
              </div>
            )
          })}
        </div>
      ))}

      <div ref={bottomRef} />
    </div>
  )
}
