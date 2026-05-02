'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export type EmptyStateKind = 'select' | 'no-data' | 'no-results' | 'error' | 'success'

export interface EmptyStateCTA {
  label: string
  onClick: () => void
  disabled?: boolean
}

export interface EmptyStateProps {
  kind?: EmptyStateKind
  title: string
  body?: string
  cta?: EmptyStateCTA
  compact?: boolean
  className?: string
}

export function EmptyState({ kind = 'select', title, body, cta, compact, className }: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        'flex flex-col items-center justify-center text-center gap-3',
        compact ? 'p-6' : 'p-12',
        className,
      )}
    >
      <Illust kind={kind} />
      <div>
        <div className="text-base font-semibold text-ink">{title}</div>
        {body && <div className="text-sm text-ink-3 mt-1 max-w-[340px]">{body}</div>}
      </div>
      {cta && (
        <button
          type="button"
          onClick={cta.onClick}
          disabled={cta.disabled}
          className="rounded-1 border border-line bg-paper px-3 py-1.5 text-sm font-medium text-ink hover:bg-paper-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cta.label}
        </button>
      )}
    </div>
  )
}

function Illust({ kind }: { kind: EmptyStateKind }) {
  switch (kind) {
    case 'select':
      return <FactorySvg />
    case 'no-results':
      return <SearchSvg />
    case 'no-data':
      return <DataSvg />
    case 'error':
      return <ErrorSvg />
    case 'success':
      return <SuccessSvg />
  }
}

function FactorySvg() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden>
      <rect x="6" y="32" width="52" height="22" stroke="var(--ink-3)" strokeWidth="1.5" />
      <path d="M6 32l10-7v7M16 32l10-7v7M26 32l10-7v7M36 32l10-7v7" stroke="var(--ink-3)" strokeWidth="1.5" />
      <rect x="46" y="14" width="6" height="18" stroke="var(--ink-3)" strokeWidth="1.5" />
      <path d="M48 14l-2-4 4-2-2-4" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="12" y="40" width="6" height="14" fill="var(--paper-2)" stroke="var(--ink-3)" strokeWidth="1.2" />
      <rect x="22" y="40" width="6" height="14" fill="var(--paper-2)" stroke="var(--ink-3)" strokeWidth="1.2" />
      <rect x="32" y="40" width="6" height="14" fill="var(--paper-2)" stroke="var(--ink-3)" strokeWidth="1.2" />
      <rect x="42" y="40" width="6" height="14" fill="var(--paper-2)" stroke="var(--ink-3)" strokeWidth="1.2" />
    </svg>
  )
}

function SearchSvg() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden>
      <circle cx="26" cy="26" r="14" stroke="var(--ink-3)" strokeWidth="1.5" />
      <path d="M37 37l12 12" stroke="var(--ink-3)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M22 26h8M26 22v8" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  )
}

function DataSvg() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden>
      <rect x="8" y="14" width="48" height="36" stroke="var(--ink-3)" strokeWidth="1.5" />
      <path d="M8 22h48M20 14v36M32 14v36M44 14v36" stroke="var(--ink-3)" strokeWidth="1" />
      <path
        d="M14 32l4-3 4 3M26 36l4-3 4 3M38 30l4-3 4 3"
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.4"
      />
    </svg>
  )
}

function ErrorSvg() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden>
      <path d="M32 8L4 56h56L32 8z" stroke="var(--bad)" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M32 28v12M32 48v.5" stroke="var(--bad)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function SuccessSvg() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
      data-empty-state-illust="success"
    >
      <circle cx="32" cy="32" r="22" stroke="var(--ok)" strokeWidth="1.5" />
      <path
        d="M22 32l7 7 14-14"
        stroke="var(--ok)"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
