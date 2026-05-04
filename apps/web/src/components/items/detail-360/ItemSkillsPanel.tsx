'use client'

import type { Item360SkillRequired } from '@mes/sdk'

export interface ItemSkillsPanelProps {
  skills: Item360SkillRequired[]
}

export function ItemSkillsPanel({ skills }: ItemSkillsPanelProps) {
  return (
    <section
      data-testid="item-skills-panel"
      className="rounded-md border border-neutral-200 bg-white"
    >
      <header className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
        <h2 className="text-sm font-semibold text-neutral-900">Competenze richieste</h2>
        <span className="text-xs text-neutral-500">{skills.length} competenze</span>
      </header>

      {skills.length === 0 ? (
        <div className="p-6 text-sm text-neutral-500 text-center">
          Nessuna competenza specifica richiesta dai workflow di questo articolo.
        </div>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {skills.map((skill) => (
            <li
              key={skill.id}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-50"
            >
              <span className="text-sm font-medium text-neutral-800 shrink-0 w-32">
                {skill.code}
              </span>
              <span className="text-sm text-neutral-700 flex-1 truncate">{skill.name}</span>
              <span className="rounded bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-700 shrink-0">
                {skill.category}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
