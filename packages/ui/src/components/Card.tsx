import * as React from 'react'
import { cn } from '../utils/cn'

interface CardRootProps extends React.HTMLAttributes<HTMLDivElement> {
  padded?: boolean
}

function CardRoot({ className, padded = true, children, ...props }: CardRootProps) {
  return (
    <div
      className={cn(
        'rounded-3 border border-line bg-paper shadow-sm',
        padded && 'p-4',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center justify-between border-b border-line pb-3 mb-3', className)}
      {...props}
    />
  )
}

function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('text-base text-ink', className)} {...props} />
}

function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center border-t border-line pt-3 mt-3', className)}
      {...props}
    />
  )
}

export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
})
