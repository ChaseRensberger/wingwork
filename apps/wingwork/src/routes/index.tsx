import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
  component: Index,
})

function Index() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">wingwork</h1>
      <p className="mt-2 text-muted-foreground">Welcome to wingwork.</p>
    </div>
  )
}
