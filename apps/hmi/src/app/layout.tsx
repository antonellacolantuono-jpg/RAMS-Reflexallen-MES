import type { Metadata } from 'next'
import { ThemeProvider } from 'next-themes'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: 'Reflexallen MES — HMI',
  description: 'Human Machine Interface',
}

export default function HMILayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" data-mode="hmi" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
