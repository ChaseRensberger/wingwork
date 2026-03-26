import { lazy, Suspense } from "react"
import { createRootRoute, Outlet } from "@tanstack/react-router"
import { ErrorBoundary } from "@/components/error-boundary"

const TanStackRouterDevtools =
  process.env.NODE_ENV === "production"
    ? () => null
    : lazy(() =>
        import("@tanstack/router-devtools").then((res) => ({
          default: res.TanStackRouterDevtools,
        })),
      )

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <ErrorBoundary>
      <Outlet />
      <Suspense>
        <TanStackRouterDevtools />
      </Suspense>
    </ErrorBoundary>
  )
}
