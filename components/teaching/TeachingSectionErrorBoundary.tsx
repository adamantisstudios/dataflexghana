"use client"

import { Component, type ReactNode } from "react"

type Props = {
  children: ReactNode
  sectionName?: string
}

type State = {
  hasError: boolean
}

export class TeachingSectionErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.error("[TeachingSectionErrorBoundary]", error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="w-full rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          role="alert"
        >
          <p className="font-semibold">
            {this.props.sectionName
              ? `Could not load ${this.props.sectionName}`
              : "Something went wrong"}
          </p>
          <p className="mt-1 text-red-700">
            Please go back and try again. If the problem continues, refresh the page.
          </p>
          <button
            type="button"
            className="mt-3 min-h-[44px] rounded-lg bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700"
            onClick={() => this.setState({ hasError: false })}
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
