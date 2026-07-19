import ModuleGate from '@/components/ModuleGate'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleGate module="advanced_reports" title="Reports">
      {children}
    </ModuleGate>
  )
}
