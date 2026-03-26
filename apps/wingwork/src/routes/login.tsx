import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useAuthStore } from "@/stores/auth"
import { useState } from "react"

export const Route = createFileRoute("/login")({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoggedIn, isLoading, error } = useAuthStore()

  const [homeserverUrl, setHomeserverUrl] = useState("https://matrix.org")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  if (isLoggedIn) {
    void navigate({ to: "/" })
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await login(homeserverUrl, username, password)
      void navigate({ to: "/" })
    } catch {
      // error is set in the store
    }
  }

  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <form onSubmit={handleSubmit} className="w-full max-w-sm p-8">
        <div className="text-lg font-medium mb-1">wingwork</div>
        <div className="text-xs text-muted-foreground mb-8">matrix client</div>

        <div className="mb-4">
          <label className="text-xs text-muted-foreground mb-1 block">
            homeserver
          </label>
          <input
            type="url"
            value={homeserverUrl}
            onChange={(e) => setHomeserverUrl(e.target.value)}
            placeholder="https://matrix.org"
            className="w-full bg-input border border-border p-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
          />
        </div>

        <div className="mb-4">
          <label className="text-xs text-muted-foreground mb-1 block">
            username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="@user:matrix.org"
            className="w-full bg-input border border-border p-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
          />
        </div>

        <div className="mb-4">
          <label className="text-xs text-muted-foreground mb-1 block">
            password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-input border border-border p-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-foreground text-background p-2 text-sm font-mono hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isLoading ? "logging in..." : "[login]"}
        </button>

        {error && <div className="text-xs text-destructive mt-4">{error}</div>}
      </form>
    </div>
  )
}
