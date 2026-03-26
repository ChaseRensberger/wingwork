import { createFileRoute } from "@tanstack/react-router"
import { ChatHeader } from "@/components/chat-header"
import { MessageList } from "@/components/message-list"
import { MessageInput } from "@/components/message-input"

export const Route = createFileRoute("/_app/room/$roomId")({
  component: RoomPage,
})

function RoomPage() {
  const { roomId } = Route.useParams()

  return (
    <div className="flex flex-col h-full">
      <ChatHeader roomId={roomId} />
      <MessageList roomId={roomId} />
      <MessageInput roomId={roomId} />
    </div>
  )
}
