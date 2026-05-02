'use client'

import { STEP_CATEGORIES, STEP_KINDS } from '@mes/domain'
import { PaletteItem } from './PaletteItem'

export function WorkflowPalette() {
  return (
    <div className="h-full flex flex-col overflow-y-auto">
      <div className="px-3 py-2 hairline-b">
        <span className="uppercase-label">Step Categories</span>
      </div>
      <div className="px-3 py-2 flex flex-col gap-1.5">
        {STEP_CATEGORIES.map((cat) => (
          <PaletteItem
            key={cat.id}
            source="category"
            id={cat.id}
            labelIt={cat.labelIt}
            descriptionIt={cat.descriptionIt}
            iconName={cat.iconName}
          />
        ))}
      </div>

      <div className="px-3 py-2 hairline-b hairline-t">
        <span className="uppercase-label">Step Kinds</span>
      </div>
      <div className="px-3 py-2 flex flex-col gap-1.5">
        {STEP_KINDS.map((kind) => (
          <PaletteItem
            key={kind.id}
            source="kind"
            id={kind.id}
            labelIt={kind.labelIt}
            descriptionIt={kind.descriptionIt}
            iconName={kind.iconName}
          />
        ))}
      </div>
    </div>
  )
}
