import { ImmersiveLayout } from './ImmersiveLayout'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  // Use immersive single-screen layout
  return <ImmersiveLayout>{children}</ImmersiveLayout>
}

