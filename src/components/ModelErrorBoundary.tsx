import { Component, type ReactNode } from 'react';

export default class ModelErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div role="alert" className="flex h-full items-center justify-center px-6 text-center text-sm text-white/70">
          The 3D preview is unavailable. Please reload the page to try again.
        </div>
      );
    }

    return this.props.children;
  }
}
