import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <this.props.fallback error={this.state.error} resetError={this.resetError} />;
      }

      return <DefaultErrorFallback error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error?: Error;
  resetError: () => void;
}

function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="w-16 h-16 mx-auto mb-4 text-destructive">
          <AlertTriangle className="w-full h-full" />
        </div>
        
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Something went wrong
        </h2>
        
        <p className="text-muted-foreground mb-6">
          {error?.message || "An unexpected error occurred. Please try again."}
        </p>
        
        <div className="space-x-3">
          <Button onClick={resetError} variant="default">
            Try Again
          </Button>
          
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
          >
            Reload Page
          </Button>
        </div>
        
        {process.env.NODE_ENV === "development" && error && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm text-muted-foreground">
              Error Details
            </summary>
            <pre className="mt-2 text-xs bg-muted p-3 rounded overflow-auto">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}