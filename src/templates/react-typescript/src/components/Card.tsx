import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/helpers';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
}

interface CardSectionProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * Card component with header, body, and footer sections
 */
function Card({ children, hover = false, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-md overflow-hidden',
        hover && 'transition-shadow duration-200 hover:shadow-lg',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Card Header component
 */
function CardHeader({ children, className, ...props }: CardSectionProps) {
  return (
    <div className={cn('px-6 py-4 border-b border-gray-200', className)} {...props}>
      {children}
    </div>
  );
}

/**
 * Card Body component
 */
function CardBody({ children, className, ...props }: CardSectionProps) {
  return (
    <div className={cn('px-6 py-4', className)} {...props}>
      {children}
    </div>
  );
}

/**
 * Card Footer component
 */
function CardFooter({ children, className, ...props }: CardSectionProps) {
  return (
    <div className={cn('px-6 py-4 border-t border-gray-200 bg-gray-50', className)} {...props}>
      {children}
    </div>
  );
}

// Attach sub-components to Card
Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
