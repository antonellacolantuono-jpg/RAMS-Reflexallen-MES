// PROMPT_PNE_3 D2 + D3 — Demo Toggle Panel route.
//
// Server component: gates on NEXT_PUBLIC_DEMO_MODE and calls notFound() when
// the demo is disabled (so non-demo deployments don't ship the page bundle
// at all). All interactive logic lives in the DemoPanel client component.

import { notFound } from 'next/navigation'
import { DemoPanel } from '../../components/demo/DemoPanel'

export const dynamic = 'force-dynamic'

export default function DemoPage() {
  if (process.env['NEXT_PUBLIC_DEMO_MODE'] !== 'true') {
    notFound()
  }
  return <DemoPanel />
}
