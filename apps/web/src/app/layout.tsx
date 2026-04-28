import type { Metadata } from 'next'
import { ThemeProvider } from 'next-themes'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: 'Reflexallen MES',
  description: 'Manufacturing Execution System',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
