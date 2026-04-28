'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export interface EntityFormProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  onCancel?: (() => void) | undefined
  isSubmitting?: boolean | undefined
  isDirty?: boolean | undefined
  children: React.ReactNode
  title?: string | undefined
  subtitle?: string | undefined
  actions?: React.ReactNode | undefined
  className?: string | undefined
  id?: string | undefined
}

export function EntityForm({
  onSubmit,
  onCancel,
  isSubmitting,
  isDirty,
  children,
  title,
  subtitle,
  actions,
  className,
  id,
}: EntityFormProps) {
  return (
    <form
      id={id}
      onSubmit={onSubmit}
      className={cn('flex flex-col gap-0', className)}
      noValidate
    >
      {(title || subtitle) && (
        <div className="pb-4 mb-4 border-b border-neutral-200">
          {title && <h2 className="text-base font-semibold text-neutral-900">{title}</h2>}
          {subtitle && <p className="mt-0.5 text-sm text-neutral-500">{subtitle}</p>}
        </div>
      )}

      <div className="flex flex-col gap-4">{children}</div>

      <div className="flex items-center justify-between pt-5 mt-5 border-t border-neutral-200">
        <div className="flex items-center gap-2">
          {isDirty && (
            <span className="text-xs text-neutral-400">Modifiche non salvate</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="rounded-md border border-neutral-200 px-3.5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
            >
              Annulla
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-primary-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Salvataggio…' : 'Salva'}
          </button>
        </div>
      </div>
    </form>
  )
}
