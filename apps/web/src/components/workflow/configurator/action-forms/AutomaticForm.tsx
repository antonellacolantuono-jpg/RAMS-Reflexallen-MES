'use client'

import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Field, Input, Select } from '@mes/ui'
import { sdk } from '../../../../lib/sdk'
import {
  AutomaticSchema,
  defaultAutomatic,
  ON_NOK_VALUES,
  type AutomaticValues,
} from '../../../../lib/step-validation-schemas'

const ON_NOK_LABEL: Record<(typeof ON_NOK_VALUES)[number], string> = {
  stop: 'Stop e avvisa',
  recovery: 'Avvia sotto-flusso recupero',
  block: 'Blocca WO',
  continue: 'Continua',
}

export interface AutomaticFormProps {
  value: AutomaticValues
  onChange: (next: AutomaticValues) => void
  selectedDeviceIds: string[]
  selectedRecipeId: string | null
}

export function AutomaticForm({
  value,
  onChange,
  selectedDeviceIds,
  selectedRecipeId,
}: AutomaticFormProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AutomaticValues>({
    resolver: zodResolver(AutomaticSchema),
    defaultValues: { ...defaultAutomatic, ...value },
    mode: 'onBlur',
  })

  // Fetch the selected recipe so we can auto-fill cycle time. Only enabled
  // when a recipe is selected and the cycleTimeSec input is currently empty.
  const recipeQuery = useQuery({
    queryKey: ['recipe', selectedRecipeId],
    queryFn: () => sdk.recipes.get(selectedRecipeId as string),
    enabled: !!selectedRecipeId,
  })

  // Recovery sub-flow autocomplete (only relevant when onNok = 'recovery').
  const workflowsQuery = useQuery({
    queryKey: ['workflows', 'all'],
    queryFn: () => sdk.workflows.list({ limit: 200 }),
  })

  const allowsParallel = watch('allowsParallel')
  const onNok = watch('onNok')
  const cycleTimeSec = watch('cycleTimeSec')

  // Auto-fill cycle time from recipe.parameters when recipe loads + the field
  // is empty. Operator can override afterwards.
  useEffect(() => {
    if (!recipeQuery.data) return
    if (cycleTimeSec !== '' && cycleTimeSec != null) return
    const params = (recipeQuery.data as unknown as {
      parameters?: Array<{ key: string; value: string | number | boolean }>
    }).parameters
    const cycleParam = params?.find((p) => p.key === 'cycleTimeSec')
    if (cycleParam && typeof cycleParam.value === 'number') {
      setValue('cycleTimeSec', cycleParam.value)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipeQuery.data])

  useEffect(() => {
    const sub = watch((v) => onChange(v as AutomaticValues))
    return () => sub.unsubscribe()
  }, [watch, onChange])

  const noDeviceSelected = selectedDeviceIds.length === 0
  const noRecipeSelected = selectedRecipeId == null

  const recoveryWorkflowOptions = useMemo(() => {
    const items = workflowsQuery.data?.data ?? []
    return items.map((w) => ({
      value: w.id,
      label: `${w.code} — ${w.name}`,
    }))
  }, [workflowsQuery.data])

  return (
    <form
      className="flex flex-col gap-3"
      data-action-form="automatic"
      onSubmit={(e) => e.preventDefault()}
    >
      <Field
        label="Dispositivo"
        hint={
          noDeviceSelected
            ? 'Seleziona un dispositivo nella tab Risorse'
            : `${selectedDeviceIds.length} selezionat${selectedDeviceIds.length === 1 ? 'o' : 'i'}`
        }
      >
        <Input
          readOnly
          disabled={noDeviceSelected}
          value={
            noDeviceSelected
              ? ''
              : selectedDeviceIds.length === 1
                ? selectedDeviceIds[0]!
                : `${selectedDeviceIds.length} dispositivi`
          }
          data-automatic-device-readonly
          placeholder="—"
        />
      </Field>

      <Field
        label="Ricetta"
        hint={
          noRecipeSelected
            ? 'Seleziona una ricetta nella tab Risorse'
            : selectedRecipeId!
        }
      >
        <Input
          readOnly
          disabled={noRecipeSelected}
          value={noRecipeSelected ? '' : selectedRecipeId!}
          data-automatic-recipe-readonly
          placeholder="—"
        />
      </Field>

      <Field label="Tempo di ciclo (sec)" error={errors.cycleTimeSec?.message}>
        <Input
          type="number"
          min={1}
          {...register('cycleTimeSec')}
          placeholder="es. 45"
          data-automatic-cycle-time
        />
      </Field>

      <Field
        label="Buffer step paralleli (sec)"
        hint="Tempo di buffer per gli step paralleli, prima del termine del ciclo"
        error={errors.parallelStepsBufferSec?.message}
      >
        <Input
          type="number"
          min={0}
          {...register('parallelStepsBufferSec')}
          placeholder="es. 5"
        />
      </Field>

      <label className="flex items-center gap-2 text-sm text-ink-2">
        <input
          type="checkbox"
          {...register('allowsParallel')}
          className="h-4 w-4 rounded border-line text-accent focus:ring-accent"
        />
        Consenti step paralleli
      </label>

      {allowsParallel && (
        <div
          className="rounded-md border border-dashed border-neutral-200 bg-neutral-50/50 p-3 text-xs text-ink-3"
          data-automatic-parallel-placeholder
        >
          Picker step paralleli: <strong>TODO PNE_4</strong> (rendering HMI dei sub-step paralleli).
        </div>
      )}

      <Field label="Su NOK" error={errors.onNok?.message}>
        <Select
          {...register('onNok')}
          options={ON_NOK_VALUES.map((v) => ({
            value: v,
            label: ON_NOK_LABEL[v],
          }))}
        />
      </Field>

      {onNok === 'recovery' && (
        <Field
          label="Sotto-flusso di recupero"
          hint="Workflow da innescare in caso di NOK"
          error={errors.onNokWorkflowId?.message}
        >
          <Select
            {...register('onNokWorkflowId')}
            placeholder="— Seleziona —"
            options={recoveryWorkflowOptions}
          />
        </Field>
      )}

      <Field
        label="Soglia di pass (note)"
        hint="Es. 'leak_rate_max_mbar_min: 0.5' — schema dinamico in F2"
        error={errors.passThresholdNote?.message}
      >
        <Input
          {...register('passThresholdNote')}
          placeholder="—"
        />
      </Field>
    </form>
  )
}
