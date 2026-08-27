"use client";

import React from "react";
import { StateNotice } from "./StateNotice";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // POST to /api/errors
    fetch("/api/errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "ui",
        message: error.message,
        stack: error.stack,
        context: { componentStack: errorInfo.componentStack },
      }),
    }).catch(() => {
      // silently ignore reporting failures
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-96 items-center justify-center px-region">
          <StateNotice
            tone="error"
            title="오류가 발생했습니다"
            description={this.state.error?.message || "알 수 없는 오류"}
            actionLabel="다시 시도"
            onAction={() => this.setState({ hasError: false, error: null })}
            className="max-w-md"
          />
        </div>
      );
    }

    return this.props.children;
  }
}
