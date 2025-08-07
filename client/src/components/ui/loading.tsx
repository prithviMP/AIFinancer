import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-current border-t-transparent",
        sizeClasses[size],
        className
      )}
    />
  );
}

interface LoadingSkeletonProps {
  className?: string;
  variant?: "text" | "rectangular" | "circular";
}

export function LoadingSkeleton({ className, variant = "rectangular" }: LoadingSkeletonProps) {
  const variantClasses = {
    text: "h-4 rounded",
    rectangular: "rounded-md",
    circular: "rounded-full",
  };

  return (
    <div
      className={cn(
        "animate-pulse bg-muted",
        variantClasses[variant],
        className
      )}
    />
  );
}

interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
}

export function LoadingOverlay({
  isLoading,
  children,
  loadingText = "Loading...",
  className,
}: LoadingOverlayProps) {
  return (
    <div className={cn("relative", className)}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="flex items-center gap-3 text-foreground">
            <LoadingSpinner size="md" />
            <span className="text-sm font-medium">{loadingText}</span>
          </div>
        </div>
      )}
    </div>
  );
}