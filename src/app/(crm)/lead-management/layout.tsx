import ModuleGate from '@/components/ModuleGate'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleGate module="lead_management" title="Lead Management">
      {children}
    </ModuleGate>
  )
}
