import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'

const replace = vi.fn()
const push = vi.fn()
let currentSearch = new URLSearchParams('')
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'wf1' }),
  useRouter: () => ({ replace, push }),
  usePathname: () => '/workflows/wf1',
  useSearchParams: () => currentSearch,
}))

const workflowsGet = vi.fn()
vi.mock('../../../../lib/sdk', () => ({
  sdk: { workflows: { get: (...a: unknown[]) => workflowsGet(...a) } },
}))

// Stub heavy children so the test focuses on layout decisions, not on whether
// each child can render in jsdom (Canvas needs ResizeObserver, Inspector pulls
// the whole workflow store, etc.).
vi.mock('react-resizable-panels', () => ({
  Group: ({ children }: { children: React.ReactNode }) => <div data-testid="panel-group">{children}</div>,
  Panel: ({ children }: { children: React.ReactNode }) => <div data-testid="panel">{children}</div>,
  Separator: () => null,
}))
vi.mock('../../../../components/workflow/WorkflowCanvas', () => ({
  WorkflowCanvas: () => <div data-testid="workflow-canvas" />,
}))
vi.mock('../../../../components/workflow/WorkflowHierarchyTable', () => ({
  WorkflowHierarchyTable: () => <div data-testid="workflow-hierarchy-table" />,
}))
vi.mock('../../../../components/workflow/WorkflowCardView', () => ({
  WorkflowCardView: () => <div data-testid="workflow-card-view" />,
}))
vi.mock('../../../../components/workflow/WorkflowPalette', () => ({
  WorkflowPalette: () => <div data-testid="workflow-palette" />,
}))
vi.mock('../../../../components/workflow/WorkflowInspector', () => ({
  WorkflowInspector: () => <div data-testid="workflow-inspector" />,
}))
vi.mock('../../../../components/workflow/ValidationPanel', () => ({
  ValidationPanel: () => <div data-testid="validation-panel" />,
}))
vi.mock('../../../../components/workflow/StepLivePreview', () => ({
  StepLivePreview: () => <div data-testid="step-live-preview" />,
}))
vi.mock('../../../../components/workflow/validation-context', () => ({
  WorkflowValidationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
vi.mock('../../../../components/workflow/versioning/ApproveVersionModal', () => ({
  ApproveVersionModal: () => null,
}))
vi.mock('../../../../components/workflow/versioning/DeprecateVersionModal', () => ({
  DeprecateVersionModal: () => null,
}))
vi.mock('../../../../components/workflow/versioning/VersionHistorySidebar', () => ({
  VersionHistorySidebar: () => null,
}))
vi.mock('../../../../components/workflow/AddStepDialog', () => ({
  AddStepDialog: () => null,
}))
vi.mock('../../../../components/workflow/AddPhaseDrawer', () => ({
  AddPhaseDrawer: () => null,
}))
vi.mock('../../../../components/workflow/AddGroupModal', () => ({
  AddGroupModal: () => null,
}))
vi.mock('../../../../components/workflow/ValidateDrawer', () => ({
  ValidateDrawer: () => null,
}))
vi.mock('../../../../components/workflow/WorkflowTopBar', () => ({
  WorkflowTopBar: () => null,
}))

// Track openAddPhaseDrawer calls to assert the header button.
const openAddPhaseDrawer = vi.fn()
vi.mock('../../../../components/workflow/store', () => ({
  useWorkflowStore: (selector: (s: unknown) => unknown) =>
    selector({
      addPhaseDrawer: { open: false },
      addGroupModal: { open: false, phaseId: null },
      validateDrawer: { open: false },
      // DeleteNodeDialog reads these even when the slice is closed.
      deleteConfirm: { open: false, nodeId: null, kind: null },
      nodes: [],
      openAddPhaseDrawer,
      closeAddPhaseDrawer: vi.fn(),
      closeAddGroupModal: vi.fn(),
      closeValidateDrawer: vi.fn(),
      closeDeleteConfirm: vi.fn(),
      deleteNode: vi.fn(),
    }),
}))

import WorkflowEditorPage from './page'

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  replace.mockReset()
  push.mockReset()
  workflowsGet.mockReset()
  openAddPhaseDrawer.mockReset()
  currentSearch = new URLSearchParams('')
  // useRegistryView keeps a localStorage cache across tests — clear it so the
  // default `flow` view applies on each fresh render.
  window.localStorage.clear()
})

const baseWorkflow = {
  id: 'wf1',
  code: 'WF-DEMO',
  name: 'Demo Workflow',
  currentVersionId: 'v1',
  currentVersion: { id: 'v1', version: 1, status: 'draft' },
}

describe('WorkflowEditorPage layout reflow', () => {
  it('renders the 5-pane Flusso layout by default (no ?view= param)', async () => {
    workflowsGet.mockResolvedValue(baseWorkflow)
    renderWithQuery(<WorkflowEditorPage />)

    await waitFor(() => expect(screen.getByText('Validazione')).toBeInTheDocument())
    expect(screen.getByText('Palette')).toBeInTheDocument()
    expect(screen.getByText('Canvas')).toBeInTheDocument()
    expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument()
    expect(screen.queryByTestId('header-add-phase')).not.toBeInTheDocument()
  })

  it('hides Validation + Palette and shows the "+ Nuova Fase" header button when ?view=list', async () => {
    currentSearch = new URLSearchParams('view=list')
    workflowsGet.mockResolvedValue(baseWorkflow)
    renderWithQuery(<WorkflowEditorPage />)

    await waitFor(() => expect(screen.getByText('Tabella')).toBeInTheDocument())
    expect(screen.queryByText('Validazione')).not.toBeInTheDocument()
    expect(screen.queryByText('Palette')).not.toBeInTheDocument()
    expect(screen.getByTestId('workflow-hierarchy-table')).toBeInTheDocument()
    const addPhaseBtn = screen.getByTestId('header-add-phase')
    expect(addPhaseBtn).toBeInTheDocument()
    fireEvent.click(addPhaseBtn)
    expect(openAddPhaseDrawer).toHaveBeenCalledTimes(1)
  })

  it('renders Card view when ?view=card and keeps the canvas mounted (display:none)', async () => {
    currentSearch = new URLSearchParams('view=card')
    workflowsGet.mockResolvedValue(baseWorkflow)
    renderWithQuery(<WorkflowEditorPage />)

    await waitFor(() => expect(screen.getByText('Schede')).toBeInTheDocument())
    expect(screen.queryByText('Validazione')).not.toBeInTheDocument()
    expect(screen.queryByText('Palette')).not.toBeInTheDocument()
    expect(screen.getByTestId('workflow-card-view')).toBeInTheDocument()
    // Canvas component still mounted (preserves store seeding across mode switches).
    expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument()
  })
})
