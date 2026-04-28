'use client'
import * as React from 'react'
import { Button, Input, Field } from '@mes/ui'
import { PinKeypad } from '../components/PinKeypad'

type Step = 'badge' | 'pin'

export default function HMILoginPage() {
  const [step, setStep] = React.useState<Step>('badge')
  const [badge, setBadge] = React.useState('')
  const [pin, setPin] = React.useState('')
  const [error, setError] = React.useState('')

  function handleBadgeContinue() {
    if (!badge.trim()) {
      setError('Inserire il numero badge')
      return
    }
    setError('')
    setPin('')
    setStep('pin')
  }

  function handlePinConfirm() {
    if (pin.length < 4) {
      setError('Il PIN deve essere di 4 cifre')
      return
    }
    setError('')
    // placeholder — real auth wired in PROMPT_2
    alert(`Accesso con badge ${badge} e PIN ****`)
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="mb-8">
        <img src="/brand/logo-light.svg" alt="Reflexallen" className="h-10" />
      </div>

      <div className="w-full max-w-xs glass rounded-3 p-6 flex flex-col gap-5">
        <h1 className="text-xl font-semibold text-center text-ink">Accesso Operatore</h1>

        {step === 'badge' && (
          <>
            <Field label="Numero Badge" required>
              <Input
                value={badge}
                onChange={(e) => {
                  setBadge(e.target.value)
                  setError('')
                }}
                placeholder="Scansiona o digita il badge…"
                autoFocus
                error={error}
              />
            </Field>
            <Button
              size="hmi"
              className="w-full"
              onClick={handleBadgeContinue}
            >
              Continua
            </Button>
          </>
        )}

        {step === 'pin' && (
          <>
            <p className="text-sm text-ink-3 text-center">
              Badge: <span className="font-semibold text-ink">{badge}</span>
            </p>
            <p className="text-sm text-center text-ink">Inserire PIN (4 cifre)</p>
            {error && (
              <p className="text-sm text-bad text-center">{error}</p>
            )}
            <PinKeypad
              value={pin}
              onChange={(v) => {
                setPin(v)
                setError('')
              }}
              onConfirm={handlePinConfirm}
              maxLength={4}
            />
            <Button
              size="sm"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setStep('badge')
                setPin('')
                setError('')
              }}
            >
              Cambia badge
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
