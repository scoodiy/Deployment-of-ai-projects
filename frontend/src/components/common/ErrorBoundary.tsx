import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
          <div className="mb-6 text-6xl">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-3">
            页面出了点问题
          </h1>
          <p className="text-gray-400 mb-6 max-w-md">
            抱歉，页面加载时遇到了意外错误。请尝试刷新页面或点击下方按钮重试。
          </p>
          {this.state.error && (
            <details className="mb-6 w-full max-w-lg">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-300">
                查看错误详情
              </summary>
              <pre className="mt-2 p-4 bg-gray-900 rounded-lg text-sm text-red-400 text-left overflow-auto">
                {this.state.error.message}
                {'\n\n'}
                {this.state.error.stack}
              </pre>
            </details>
          )}
          <button
            onClick={this.handleRetry}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
          >
            🔄 重试
          </button>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            ↻ 刷新页面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
