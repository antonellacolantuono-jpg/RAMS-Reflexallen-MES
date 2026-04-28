import * as React from 'react'

export interface DrawerProps {
  open?: boolean
  onClose?: () => void
  title?: string
  width?: number
  children?: React.ReactNode
}

export function Drawer(_props: DrawerProps): null {
  return null
}
