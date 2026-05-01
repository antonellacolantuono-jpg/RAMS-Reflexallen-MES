'use client'

import { useNodeBadge } from '../validation-context'

/**
 * Tiny visual indicator rendered on the top-right of every workflow node when
 * the validation context reports errors targeting that node id. Uses a native
 * <span title> tooltip — no extra primitive needed for v1.
 */
export function NodeErrorBadge({ nodeId }: { nodeId: string }) {
  const messages = useNodeBadge(nodeId)
  if (messages.length === 0) return null

  const tooltip = messages.join('\n')

  return (
    <span
      title={tooltip}
      aria-label={`${messages.length} errori di validazione`}
      className="inline-flex items-center justify-center text-red-600 text-[10px] leading-none font-bold select-none"
    >
      ▲
    </span>
  )
}
