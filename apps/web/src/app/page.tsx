'use client'
import * as React from 'react'
import Image from 'next/image'
import {
  Button,
  Input,
  Card,
  Badge,
  StatusBadge,
  PhaseBadge,
  Skeleton,
  Dot,
  Progress,
  KPI,
  Tabs,
  Field,
  Select,
} from '@mes/ui'
import { ThemeToggle } from '../components/ThemeToggle'

const TABS = ['Components', 'Colors', 'Typography'] as const
type Tab = (typeof TABS)[number]

export default function ShowcasePage() {
  const [activeTab, setActiveTab] = React.useState<Tab>('Components')
  const [inputVal, setInputVal] = React.useState('')
  const [selectVal, setSelectVal] = React.useState('')

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-line">
        <div className="flex items-center gap-3">
          <picture>
            <source srcSet="/brand/logo-dark.svg" media="(prefers-color-scheme: dark)" />
            <img src="/brand/logo-light.svg" alt="Reflexallen" className="h-8" />
          </picture>
          <span className="text-ink-3 text-sm">Design System Showcase</span>
        </div>
        <ThemeToggle />
      </header>

      {/* Tab bar */}
      <div className="px-6 pt-4">
        <Tabs
          tabs={TABS.map((t) => ({ id: t, label: t }))}
          value={activeTab}
          onChange={(v) => setActiveTab(v as Tab)}
        />
      </div>

      <main className="px-6 py-6 space-y-10 max-w-4xl">
        {activeTab === 'Components' && (
          <>
            {/* Buttons */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Button</h2>
              <div className="space-y-3">
                {(['primary', 'secondary', 'ghost', 'danger'] as const).map((variant) => (
                  <div key={variant} className="flex flex-wrap gap-2 items-center">
                    <span className="text-sm text-ink-3 w-20">{variant}</span>
                    {(['sm', 'md', 'lg', 'hmi'] as const).map((size) => (
                      <Button key={size} variant={variant} size={size}>
                        {size}
                      </Button>
                    ))}
                    <Button variant={variant} disabled>disabled</Button>
                    <Button variant={variant} loading>loading</Button>
                  </div>
                ))}
              </div>
            </section>

            {/* Badges */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Badge</h2>
              <div className="flex flex-wrap gap-2">
                {(['neutral', 'ok', 'warn', 'bad', 'info', 'accent'] as const).map((tone) => (
                  <Badge key={tone} tone={tone}>{tone}</Badge>
                ))}
                {(['neutral', 'ok', 'warn', 'bad', 'info', 'accent'] as const).map((tone) => (
                  <Badge key={`${tone}-dot`} tone={tone} dot>{tone} + dot</Badge>
                ))}
              </div>
            </section>

            {/* StatusBadge */}
            <section>
              <h2 className="text-lg font-semibold mb-4">StatusBadge</h2>
              <div className="flex flex-wrap gap-2">
                {(['ok', 'warn', 'bad', 'info'] as const).map((s) => (
                  <StatusBadge key={s} status={s} />
                ))}
              </div>
            </section>

            {/* PhaseBadge */}
            <section>
              <h2 className="text-lg font-semibold mb-4">PhaseBadge</h2>
              <div className="flex flex-wrap gap-2">
                {(['inbound', 'setup', 'production', 'quality_control', 'outbound', 'teardown'] as const).map((p) => (
                  <PhaseBadge key={p} phase={p} />
                ))}
              </div>
            </section>

            {/* Dots */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Dot</h2>
              <div className="flex flex-wrap gap-3 items-center">
                {(['ok', 'warn', 'bad', 'info', 'neutral', 'accent'] as const).map((tone) => (
                  <div key={tone} className="flex items-center gap-1.5">
                    <Dot tone={tone} />
                    <span className="text-sm">{tone}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Card */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Card</h2>
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <Card.Header>Card Header</Card.Header>
                  <Card.Body>Card body content with some text to demonstrate the layout.</Card.Body>
                  <Card.Footer>
                    <Button size="sm" variant="secondary">Cancel</Button>
                    <Button size="sm">Confirm</Button>
                  </Card.Footer>
                </Card>
                <Card padded>
                  <p className="text-sm text-ink-2">Padded card variant with no header/footer.</p>
                </Card>
              </div>
            </section>

            {/* Input + Field + Select */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Form Elements</h2>
              <div className="space-y-4 max-w-sm">
                <Field label="Normal input" hint="Enter a value" required>
                  <Input
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    placeholder="Type here…"
                  />
                </Field>
                <Field label="Error state">
                  <Input value="bad value" error="This field is invalid" onChange={() => {}} />
                </Field>
                <Field label="Select example">
                  <Select value={selectVal} onChange={(e) => setSelectVal(e.target.value)}>
                    <option value="">Choose…</option>
                    <option value="a">Option A</option>
                    <option value="b">Option B</option>
                  </Select>
                </Field>
              </div>
            </section>

            {/* Progress */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Progress</h2>
              <div className="space-y-2 max-w-sm">
                <Progress value={30} max={100} showLabel />
                <Progress value={65} max={100} tone="ok" showLabel />
                <Progress value={80} max={100} tone="warn" showLabel />
                <Progress value={20} max={100} tone="bad" showLabel />
              </div>
            </section>

            {/* KPI */}
            <section>
              <h2 className="text-lg font-semibold mb-4">KPI</h2>
              <div className="flex flex-wrap gap-4">
                <KPI label="OEE" value="87.4" unit="%" trend="up" tone="ok" />
                <KPI label="Scrap Rate" value="2.1" unit="%" trend="down" tone="bad" />
                <KPI label="Cycle Time" value="48" unit="s" trend="flat" />
                <KPI label="Produced" value="1240" unit="pz" sub="target 1500" />
              </div>
            </section>

            {/* Skeleton */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Skeleton</h2>
              <div className="space-y-2 max-w-sm">
                <Skeleton h="1rem" className="w-3/4" />
                <Skeleton h="0.75rem" className="w-full" />
                <Skeleton h="0.75rem" className="w-5/6" />
              </div>
            </section>
          </>
        )}

        {activeTab === 'Colors' && (
          <>
            {/* Surface colors */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Surfaces</h2>
              <div className="flex gap-2">
                {[
                  { name: 'paper', cls: 'bg-paper border border-line' },
                  { name: 'paper-2', cls: 'bg-paper-2' },
                  { name: 'paper-3', cls: 'bg-paper-3' },
                ].map(({ name, cls }) => (
                  <div key={name} className="flex flex-col items-center gap-1">
                    <div className={`w-20 h-14 rounded-2 ${cls}`} />
                    <span className="text-xs text-ink-3">{name}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Status colors */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Status Colors</h2>
              {(['ok', 'warn', 'bad', 'info'] as const).map((tone) => (
                <div key={tone} className="flex gap-2 mb-2 items-center">
                  <span className="text-sm text-ink-3 w-12">{tone}</span>
                  <div className={`w-14 h-10 rounded-2 bg-${tone}`} />
                  <div className={`w-14 h-10 rounded-2 bg-${tone}-soft`} />
                  <div className={`w-14 h-10 rounded-2 bg-${tone}-ink`} />
                  <span className="text-xs text-ink-3">full / soft / ink</span>
                </div>
              ))}
            </section>

            {/* Phase colors */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Phase Colors</h2>
              <div className="flex flex-wrap gap-3">
                {([
                  { key: 'inbound', label: 'inbound' },
                  { key: 'setup', label: 'setup' },
                  { key: 'production', label: 'production' },
                  { key: 'qc', label: 'qc' },
                  { key: 'outbound', label: 'outbound' },
                  { key: 'teardown', label: 'teardown' },
                ] as const).map(({ key, label }) => (
                  <div key={key} className="flex flex-col items-center gap-1">
                    <div className={`w-16 h-10 rounded-2 bg-c-${key}`} />
                    <span className="text-xs text-ink-3">{label}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Accent */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Accent</h2>
              <div className="flex gap-2">
                {[
                  { name: 'accent', cls: 'bg-accent' },
                  { name: 'accent-2', cls: 'bg-accent-2' },
                  { name: 'accent-soft', cls: 'bg-accent-soft' },
                ].map(({ name, cls }) => (
                  <div key={name} className="flex flex-col items-center gap-1">
                    <div className={`w-20 h-14 rounded-2 ${cls}`} />
                    <span className="text-xs text-ink-3">{name}</span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {activeTab === 'Typography' && (
          <>
            <section>
              <h2 className="text-lg font-semibold mb-4">Avenir Next Cyr — Font Weights</h2>
              <div className="space-y-3">
                {[
                  { weight: 'font-light', label: 'Light (300)' },
                  { weight: 'font-normal', label: 'Regular (400)' },
                  { weight: 'font-medium', label: 'Medium (500)' },
                  { weight: 'font-semibold', label: 'Demi Bold (600)' },
                  { weight: 'font-bold', label: 'Bold (700)' },
                ].map(({ weight, label }) => (
                  <div key={weight} className={`text-2xl ${weight}`}>
                    {label} — The quick brown fox
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-4">Type Scale</h2>
              <div className="space-y-2">
                {[
                  { cls: 'text-2xl', label: '2xl — 22px' },
                  { cls: 'text-xl', label: 'xl — 18px' },
                  { cls: 'text-lg', label: 'lg — 15px' },
                  { cls: 'text-base', label: 'base — 13px' },
                  { cls: 'text-sm', label: 'sm — 12px' },
                  { cls: 'text-xs', label: 'xs — 10.5px' },
                ].map(({ cls, label }) => (
                  <p key={cls} className={`${cls} text-ink`}>{label} — Reflexallen MES</p>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-4">Ink Scale</h2>
              <div className="space-y-1">
                {[
                  { cls: 'text-ink', label: 'ink — Primary text' },
                  { cls: 'text-ink-2', label: 'ink-2 — Secondary text' },
                  { cls: 'text-ink-3', label: 'ink-3 — Tertiary / labels' },
                  { cls: 'text-ink-4', label: 'ink-4 — Disabled / placeholders' },
                ].map(({ cls, label }) => (
                  <p key={cls} className={`text-base ${cls}`}>{label}</p>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
