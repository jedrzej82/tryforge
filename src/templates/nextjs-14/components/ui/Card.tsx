import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
}

export function Card({
  title,
  description,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md',
        className
      )}
      {...props}
    >
      {title && (
        <h3 className="mb-2 text-lg font-semibold text-gray-900">
          {title}
        </h3>
      )}
      {description && (
        <p className="text-gray-600">
          {description}
        </p>
      )}
      {children}
    </div>
  )
}
