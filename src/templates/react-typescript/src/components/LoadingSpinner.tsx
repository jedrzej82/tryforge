import { HTMLAttributes } from 'react';
import { cn } from '@/utils/helpers';

type SpinnerSize = 'sm' | 'md' | 'lg';

interface LoadingSpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: SpinnerSize;
  color?: string;
}

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-3',
  lg: 'w-12 h-12 border-4',
};

/**
 * Loading spinner component
 */
function LoadingSpinner({ size = 'md', color = 'border-primary-600', className }: LoadingSpinnerProps) {
  return (
    <div className={cn('inline-block', className)} role="status" aria-label="Loading">
      <div
        className={cn(
          'rounded-full border-t-transparent animate-spin',
          sizeClasses[size],
          color
        )}
      />
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export default LoadingSpinner;
