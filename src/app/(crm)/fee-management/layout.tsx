import ModuleGate from '@/components/ModuleGate'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleGate module="fee_management" title="Fee Management">
      {children}
    </ModuleGate>
  )
}
