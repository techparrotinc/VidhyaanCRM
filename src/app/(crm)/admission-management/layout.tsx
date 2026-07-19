import ModuleGate from '@/components/ModuleGate'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleGate module="admission_management" title="Admission Management">
      {children}
    </ModuleGate>
  )
}
