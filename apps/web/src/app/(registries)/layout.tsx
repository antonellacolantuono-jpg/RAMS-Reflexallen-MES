import { Sidebar } from '../../components/shell/Sidebar'
import { QueryProvider } from '../../components/shell/QueryProvider'
import { RegistrySyncProvider } from '../../components/shell/RegistrySyncProvider'
import { ToastProvider } from '@mes/ui'

export default function RegistriesLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ToastProvider>
        <RegistrySyncProvider>
          <div className="flex h-screen bg-[var(--paper)] text-[var(--ink)] overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-hidden flex flex-col min-w-0">
              {children}
            </main>
          </div>
        </RegistrySyncProvider>
      </ToastProvider>
    </QueryProvider>
  )
}
