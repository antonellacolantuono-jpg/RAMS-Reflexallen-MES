import * as React from 'react'
import { cn } from '../utils/cn'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  h?: string
  w?: string
}

export function Skeleton({ h = '1rem', w = '100%', className, style, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('skel rounded-2 bg-paper-3', className)}
      style={{ height: h, width: w, ...style }}
      {...props}
    />
  )
}
