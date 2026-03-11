import React, { ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
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

  componentDidCatch(error: Error) {
    console.error('Error caught by boundary:', error);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      return (
        <div className="error-container" style={{ padding: '3rem 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', justifyContent: 'center' }}>
            <AlertCircle size={32} style={{ color: 'var(--accent-color)' }} />
            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Something went wrong</h2>
          </div>

          <p className="text-secondary" style={{ fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            We encountered an unexpected error. The error details are shown below.
          </p>

          <details style={{ marginBottom: '2rem', textAlign: 'left' }}>
            <summary style={{ cursor: 'pointer', padding: '0.5rem', background: 'var(--surface-hover)', borderRadius: '4px', marginBottom: '0.5rem', fontWeight: 500 }}>
              Error Details
            </summary>
            <pre className="error-details" style={{
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '1rem',
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '300px'
            }}>
              {this.state.error.toString()}
              {'\n\n'}
              {this.state.error.stack}
            </pre>
          </details>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={this.handleRetry}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <RefreshCw size={16} /> Retry
            </button>

            <a
              href="/"
              className="btn btn-secondary"
            >
              Back to Home
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
