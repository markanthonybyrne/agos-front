import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { SlidingPanel } from '@/components/common/SlidingPanel'
import { PanelSize } from '@/app/slices/panelSlice'
import { Shield } from 'lucide-react'

export function AdminPanelWrapper({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)

  // Check if we're on an admin route
  const isAdminRoute = location.pathname.startsWith('/admin')

  // Open panel when admin route is accessed
  useEffect(() => {
    if (isAdminRoute) {
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }, [isAdminRoute])

  const handleClose = () => {
    setIsOpen(false)
    // Navigate back to holopad when closing
    navigate('/holopad')
  }

  return (
    <SlidingPanel
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-cyan-400" />
          <span className="glow-cyan">Admin Portal</span>
        </div>
      }
      description="Manage game entities and systems"
      size={PanelSize.XLARGE}
      className="!w-[70vw] !max-w-none"
    >
      {children}
    </SlidingPanel>
  )
}

