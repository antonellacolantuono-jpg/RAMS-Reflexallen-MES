import * as React from 'react'

export interface ModalProps {
  open?: boolean
  onClose?: () => void
  title?: string
  width?: number
  children?: React.ReactNode
}

export function Modal(_props: ModalProps): null {
  return null
}
