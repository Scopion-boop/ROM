'use client';
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class CaptureErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            textAlign: 'center',
            padding: 40,
            background: 'var(--bg-secondary)',
            borderRadius: 12,
            border: '1px solid var(--border-primary)',
          }}
        >
          <AlertTriangle size={40} style={{ color: 'var(--data-borderline)', marginBottom: 16 }} />
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: 8,
            }}
          >
            Capture Error
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: 14 }}>
            {this.state.error?.message || 'Something went wrong during measurement capture.'}
          </p>
          <button
            className="btn btn-primary"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              this.props.onReset?.();
            }}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
