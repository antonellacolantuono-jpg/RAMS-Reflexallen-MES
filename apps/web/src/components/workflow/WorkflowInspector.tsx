'use client'

import { useState } from 'react'
import { Tabs } from '@mes/ui'
import type { Tab } from '@mes/ui'
import { useWorkflowStore } from './store'
import { PropertiesTab } from './inspector/PropertiesTab'
import { MetadataTab } from './inspector/MetadataTab'
import { AuditTab } from './inspector/AuditTab'
import { loadAuditTimeline } from '../../lib/audit-adapter'

type TabId = 'properties' | 'metadata' | 'audit'

export function WorkflowInspector() {
  const [activeTab, setActiveTab] = useState<TabId>('properties')
  const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId)
  const selectedNodeType = useWorkflowStore((s) => s.selectedNodeType)

  const auditCount =
    selectedNodeId && selectedNodeType
      ? loadAuditTimeline({
          entityType:
            selectedNodeType === 'phaseNode'
              ? 'Phase'
              : selectedNodeType === 'groupNode'
                ? 'Group'
                : 'Step',
          entityId: selectedNodeId,
        }).length
      : 0

  const tabs: Tab[] = [
    { id: 'properties', label: 'Properties' },
    { id: 'metadata', label: 'Metadata' },
    { id: 'audit', label: 'Audit', count: auditCount },
  ]

  return (
    <div className="h-full flex flex-col" data-inspector="root">
      <div className="px-1 pt-1 shrink-0">
        <Tabs
          tabs={tabs}
          value={activeTab}
          onChange={(id) => setActiveTab(id as TabId)}
        />
      </div>
      <div className="flex-1 flex flex-col overflow-y-auto">
        {activeTab === 'properties' && <PropertiesTab />}
        {activeTab === 'metadata' && <MetadataTab />}
        {activeTab === 'audit' && <AuditTab />}
      </div>
    </div>
  )
}
