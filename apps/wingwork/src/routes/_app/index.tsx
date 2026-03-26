import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_app/")({
  component: WelcomePage,
})

function WelcomePage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
      <div className="text-lg font-medium text-foreground">wingwork</div>
      <div className="text-xs mt-1">select a channel or conversation</div>
    </div>
  )
}
