'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Field, HMIBigBtn, HMIShell } from '@mes/ui'
import { PinKeypad } from '../components/PinKeypad'
import { useLogin, useMe } from '../lib/queries'
import { ApiError } from '../lib/api-client'

type Step = 'badge' | 'pin'

const SHOW_DEMO_HINT = process.env['NEXT_PUBLIC_DEMO_HINT'] !== 'false'

export default function HMILoginPage() {
  const router = useRouter()
  const me = useMe()
  const login = useLogin()

  const [step, setStep] = React.useState<Step>('badge')
  const [badge, setBadge] = React.useState('')
  const [pin, setPin] = React.useState('')
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    if (me.data) {
      router.replace('/dashboard')
    }
  }, [me.data, router])

  function handleBadgeContinue() {
    const trimmed = badge.trim().toUpperCase()
    if (!trimmed) {
      setError('Inserire il numero badge')
      return
    }
    setBadge(trimmed)
    setError('')
    setPin('')
    setStep('pin')
  }

  async function handlePinConfirm() {
    if (pin.length < 4) {
      setError('Il PIN deve essere di 4 cifre')
      return
    }
    setError('')
    try {
      await login.mutateAsync({ badge, pin })
      router.replace('/dashboard')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Badge o PIN errato')
      } else {
        setError('Errore di connessione. Riprovare.')
      }
      setPin('')
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <HMIShell
        title="Accesso Operatore"
        sub="Reflexallen MES · Sign-in"
        headerRight={
          <img src="/brand/rams-logo-light.svg" alt="RAMS" className="h-7" />
        }
      >
        <div className="w-full max-w-xs mx-auto glass rounded-3 p-6 flex flex-col gap-5 mt-12">
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleBadgeContinue()
                }}
              />
            </Field>
            <HMIBigBtn
              variant="primary"
              size="big"
              className="w-full"
              onClick={handleBadgeContinue}
            >
              Continua
            </HMIBigBtn>
            {SHOW_DEMO_HINT && (
              <p className="text-xs text-ink-3 text-center">
                Demo: OP-001..OP-004 · PIN 1234 / 2222 / 3333 / 4444
              </p>
            )}
          </>
        )}

        {step === 'pin' && (
          <>
            <p className="text-sm text-ink-3 text-center">
              Badge: <span className="font-semibold text-ink">{badge}</span>
            </p>
            <p className="text-sm text-center text-ink">Inserire PIN (4 cifre)</p>
            {error && <p className="text-sm text-bad text-center">{error}</p>}
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
              disabled={login.isPending}
            >
              Cambia badge
            </Button>
          </>
        )}
        </div>
      </HMIShell>
    </div>
  )
}
