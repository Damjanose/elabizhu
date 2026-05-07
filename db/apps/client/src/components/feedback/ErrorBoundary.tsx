import { Component, type ErrorInfo, type ReactNode } from "react"
import { ErrorPage } from "../../pages/ErrorPage"

type Props = {
  children: ReactNode
  fallback?: ReactNode
}

type State = {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[Aurelia] Uncaught render error", error, info)
  }

  reset = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <ErrorPage onRetry={this.reset} />
    }
    return this.props.children
  }
}
