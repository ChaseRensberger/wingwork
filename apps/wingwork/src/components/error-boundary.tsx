import { Component } from "react"
import type { ReactNode } from "react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="h-screen flex items-center justify-center">
            <div className="text-center max-w-sm">
              <div className="text-sm font-medium">something went wrong</div>
              <div className="text-xs text-muted-foreground mt-1">
                {this.state.error?.message || "unknown error"}
              </div>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-4"
              >
                [reload]
              </button>
            </div>
          </div>
        )
      )
    }
    return this.props.children
  }
}
