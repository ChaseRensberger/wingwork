import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { useAuthStore } from "@/stores/auth"
import { ChatSidebar } from "@/components/chat-sidebar"

export const Route = createFileRoute("/_app")({
  beforeLoad: async () => {
    const state = useAuthStore.getState()
    if (!state.isLoggedIn) {
      const restored = await state.restoreSession()
      if (!restored) {
        throw redirect({ to: "/login" })
      }
    }
  },
  component: AppLayout,
})

function AppLayout() {
  const isLoading = useAuthStore((s) => s.isLoading)
  const syncState = useAuthStore((s) => s.syncState)

  if (isLoading || (syncState !== "PREPARED" && syncState !== "SYNCING")) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-sm font-medium">wingwork</div>
          <div className="text-xs text-muted-foreground mt-1">
            {syncState === "ERROR" ? "sync failed, retrying..." : "syncing..."}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex">
      <ChatSidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <Outlet />
      </main>
    </div>
  )
}
