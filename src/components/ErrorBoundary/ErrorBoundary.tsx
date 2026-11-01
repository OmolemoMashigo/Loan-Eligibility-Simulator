import { Component, Fragment, type ReactNode } from 'react';
import { Alert } from '@/components/Alert/Alert';
import styles from './ErrorBoundary.module.css';

export type ErrorBoundaryProps = {
  children: ReactNode;
  onReset?: () => void;
};

type ErrorBoundaryState = {
  error: Error | null;
  resetCount: number;
};

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null, resetCount: 0 };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  handleReset(): void {
    this.props.onReset?.();
    this.setState((state) => ({
      error: null,
      resetCount: state.resetCount + 1,
    }));
  }

  render() {
    if (this.state.error) {
      return (
        <div className={styles.fallback}>
          <Alert tone="danger" title="Something went wrong">
            <p>Please try again. If it keeps happening, refresh the page.</p>
            <button
              type="button"
              className={styles.retry}
              onClick={this.handleReset}
            >
              Try again
            </button>
          </Alert>
        </div>
      );
    }

    return (
      <Fragment key={this.state.resetCount}>{this.props.children}</Fragment>
    );
  }
}
