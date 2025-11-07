import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { ChevronRight, ChevronLeft, LogOut, Menu as MenuIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/common/Avatar'
import { ContextMenu, ContextMenuItem } from '@/components/common/ContextMenu'
import { useWindow } from '@/components/common/WindowManager'
import { PanelType, PanelSize } from '@/app/slices/panelSlice'
import { hubMenuConfig, HubCategory, MainMenuItem, SubMenuItem } from '@/lib/hubMenuConfig'
import { useGetMeQuery } from '@/api/endpoints/authApi'
import { getUserAvatarUrl } from '@/lib/avatar'
import { useAppDispatch } from '@/app/hooks'
import { logout } from '@/app/slices/authSlice'
import { useNavigate } from 'react-router-dom'
import { useUnreadMailCount } from '@/hooks/useUnreadMailCount'

interface HubSidebarProps {
  constructionCount?: number
}

export function HubSidebar({ constructionCount = 0 }: HubSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('activities')
  const [expandedMainMenuItem, setExpandedMainMenuItem] = useState<string | null>(null)
  const [contextMenuState, setContextMenuState] = useState<{
    isOpen: boolean
    position: { x: number; y: number }
    category: HubCategory | null
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    category: null,
  })
  
  const { openPanel } = useWindow()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { data: meData } = useGetMeQuery(undefined, {
    refetchOnMountOrArgChange: true,
  })
  const { unreadCount } = useUnreadMailCount()
  
  const sidebarRef = useRef<HTMLDivElement>(null)
  const mainMenuRef = useRef<HTMLDivElement>(null)
  const subMenuRef = useRef<HTMLDivElement>(null)

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuState.isOpen) {
        setContextMenuState({ isOpen: false, position: { x: 0, y: 0 }, category: null })
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [contextMenuState.isOpen])

  // Get selected category config
  const selectedCategoryConfig = useMemo(
    () => hubMenuConfig.find((cat) => cat.id === selectedCategory),
    [selectedCategory]
  )

  // Handle main menu item click
  const handleMainMenuItemClick = useCallback(
    (item: MainMenuItem) => {
      if (item.subMenuItems && item.subMenuItems.length > 0) {
        // Toggle submenu expansion
        setExpandedMainMenuItem(
          expandedMainMenuItem === item.id ? null : item.id
        )
      } else if (item.navigateTo) {
        // Navigate to route
        navigate(item.navigateTo)
        setIsCollapsed(true)
        setExpandedMainMenuItem(null)
      } else if (item.panelType) {
        // Open panel directly
        openPanel(item.panelType, item.panelSize || PanelSize.MEDIUM, item.panelData)
        setIsCollapsed(true)
        setExpandedMainMenuItem(null)
      } else if (item.onClick) {
        item.onClick()
        setIsCollapsed(true)
        setExpandedMainMenuItem(null)
      }
    },
    [expandedMainMenuItem, openPanel, navigate]
  )

  // Handle submenu item click
  const handleSubMenuItemClick = useCallback(
    (item: SubMenuItem) => {
      if (item.panelType) {
        openPanel(item.panelType, item.panelSize || PanelSize.MEDIUM, item.panelData)
        setIsCollapsed(true)
        setExpandedMainMenuItem(null)
      } else if (item.onClick) {
        item.onClick()
        setIsCollapsed(true)
        setExpandedMainMenuItem(null)
      }
    },
    [openPanel]
  )

  // Handle category icon click
  const handleCategoryClick = useCallback(
    (category: HubCategory) => {
      setSelectedCategory(category.id)
      setIsCollapsed(false)
      setExpandedMainMenuItem(null)
    },
    []
  )

  // Handle category icon right-click
  const handleCategoryRightClick = useCallback(
    (e: React.MouseEvent, category: HubCategory) => {
      e.preventDefault()
      e.stopPropagation()
      setContextMenuState({
        isOpen: true,
        position: { x: e.clientX, y: e.clientY },
        category,
      })
    },
    []
  )

  // Handle logout
  const handleLogout = useCallback(() => {
    dispatch(logout())
    navigate('/login')
  }, [dispatch, navigate])

  // Build context menu items for a category
  const buildContextMenuItems = useCallback(
    (category: HubCategory | null): ContextMenuItem[] => {
      if (!category) return []

      const items: ContextMenuItem[] = []
      
      // Add quick access to all main menu items
      category.mainMenuItems.forEach((mainItem) => {
        if (mainItem.panelType) {
          items.push({
            label: mainItem.label,
            icon: mainItem.icon,
            onClick: () => {
              openPanel(mainItem.panelType!, mainItem.panelSize || PanelSize.MEDIUM, mainItem.panelData)
              setContextMenuState({ isOpen: false, position: { x: 0, y: 0 }, category: null })
            },
          })
        }
      })

      if (items.length > 0) {
        items.push({ label: '', onClick: () => {}, separator: true })
      }

      // Add submenu items as nested entries
      category.mainMenuItems.forEach((mainItem) => {
        if (mainItem.subMenuItems && mainItem.subMenuItems.length > 0) {
          mainItem.subMenuItems.forEach((subItem) => {
            if (subItem.panelType) {
              items.push({
                label: `${mainItem.label} > ${subItem.label}`,
                icon: subItem.panelType ? undefined : mainItem.icon,
                onClick: () => {
                  openPanel(subItem.panelType!, subItem.panelSize || PanelSize.MEDIUM, subItem.panelData)
                  setContextMenuState({ isOpen: false, position: { x: 0, y: 0 }, category: null })
                },
              })
            }
          })
        }
      })

      return items
    },
    [openPanel]
  )

  const contextMenuItems = useMemo(
    () => buildContextMenuItems(contextMenuState.category),
    [contextMenuState.category, buildContextMenuItems]
  )

  // Get notification badges
  const getCategoryBadgeCount = useCallback(
    (categoryId: string): number | undefined => {
      if (categoryId === 'industry' && constructionCount > 0) {
        return constructionCount
      }
      if (categoryId === 'social') {
        return unreadCount > 0 ? unreadCount : undefined
      }
      return undefined
    },
    [constructionCount, unreadCount]
  )

  return (
    <>
      {/* Icon Sidebar */}
      <div
        ref={sidebarRef}
        className={cn(
          'fixed left-0 top-0 bottom-0 z-20 transition-all duration-300 ease-out',
          isCollapsed ? 'translate-x-0' : 'translate-x-0',
          'pointer-events-none'
        )}
        style={{ width: '64px' }}
      >
        <div
          className={cn(
            'w-full h-full flex flex-col items-center pt-4 pb-4 gap-2',
            'panel-glass border-r border-cyan-500/30 backdrop-blur-md',
            'pointer-events-auto'
          )}
        >
          {/* Avatar at top */}
          <div className="relative group">
            <button
              onClick={() => {
                setSelectedCategory('personal')
                setIsCollapsed(false)
              }}
              className="bg-transparent border-0 p-0 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <Avatar
                src={getUserAvatarUrl(meData?.user)}
                name={meData?.user?.username || 'User'}
                size="sm"
                className="border-0 w-12 h-12"
              />
            </button>
            {/* Tooltip */}
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              <div className="panel-glass border border-cyan-500/30 px-3 py-1.5 rounded-none text-sm whitespace-nowrap shadow-2xl shadow-cyan-500/10">
                {meData?.user?.username || 'User'}
              </div>
            </div>
          </div>

          {/* Category Icons */}
          {hubMenuConfig.map((category) => {
            const Icon = category.icon
            const badgeCount = getCategoryBadgeCount(category.id)
            const isSelected = selectedCategory === category.id

            return (
              <div key={category.id} className="relative group">
                <button
                  onClick={() => handleCategoryClick(category)}
                  onContextMenu={(e) => handleCategoryRightClick(e, category)}
                  className={cn(
                    'w-12 h-12 transition-all duration-200 rounded-none relative',
                    'bg-transparent border-0',
                    'flex items-center justify-center',
                    'hover:text-cyan-400 active:text-cyan-400',
                    isSelected && 'text-cyan-400'
                  )}
                  aria-label={category.label}
                >
                  <Icon className={cn(
                    'w-5 h-5 transition-colors',
                    isSelected ? 'text-cyan-400' : 'text-gray-300 group-hover:text-cyan-400'
                  )} />
                  {badgeCount !== undefined && (
                    <div className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs bg-red-500 text-white rounded-none">
                      {badgeCount > 9 ? '9+' : badgeCount}
                    </div>
                  )}
                </button>
                {/* Tooltip */}
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  <div className="panel-glass border border-cyan-500/30 px-3 py-1.5 rounded-none text-sm whitespace-nowrap shadow-2xl shadow-cyan-500/10">
                    {category.label}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Logout Button */}
          <div className="relative group">
            <button
              onClick={handleLogout}
              className={cn(
                'w-12 h-12 transition-all duration-200 rounded-none',
                'bg-transparent border-0',
                'flex items-center justify-center',
                'text-red-400 hover:text-red-300 active:text-red-300'
              )}
              aria-label="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
            {/* Tooltip */}
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              <div className="panel-glass border border-red-500/30 px-3 py-1.5 rounded-none text-sm whitespace-nowrap shadow-2xl shadow-red-500/10">
                Logout
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Menu Panel - slides out from sidebar - Full height */}
      {!isCollapsed && selectedCategoryConfig && (
        <div
          ref={mainMenuRef}
          className={cn(
            'fixed left-[64px] top-0 bottom-0 z-30 w-64',
            'panel-glass border-r border-cyan-500/30 backdrop-blur-md',
            'transition-all duration-300 ease-out',
            'pointer-events-auto',
            'animate-in slide-in-from-left duration-300'
          )}
          style={{ height: '100vh' }}
        >
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 px-4 py-3 border-b border-cyan-500/20 bg-gradient-to-b from-gray-900/95 to-gray-900/90">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-cyan-300">
                  {selectedCategoryConfig.label}
                </h3>
                <button
                  onClick={() => setIsCollapsed(true)}
                  className="w-8 h-8 flex items-center justify-center bg-transparent border-0 text-gray-300 hover:text-cyan-400 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Main Menu Items - Full height container */}
            <div className="flex-1 overflow-y-auto py-2 min-h-0">
              {selectedCategoryConfig.mainMenuItems.map((item) => {
                const Icon = item.icon
                const hasSubMenu = item.subMenuItems && item.subMenuItems.length > 0

                return (
                  <button
                    key={item.id}
                    onClick={() => handleMainMenuItemClick(item)}
                    className={cn(
                      'w-full px-4 py-3 flex items-center justify-between',
                      'text-left transition-all duration-200',
                      'hover:bg-gray-800/50 hover:text-cyan-300',
                      'text-white border-b border-gray-800/50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {Icon && (
                        <Icon className="w-5 h-5 flex-shrink-0" />
                      )}
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    {hasSubMenu && (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Submenu Panel - slides out from main menu, full height */}
      {!isCollapsed && expandedMainMenuItem && selectedCategoryConfig && (() => {
        const expandedItem = selectedCategoryConfig.mainMenuItems.find(
          item => item.id === expandedMainMenuItem && item.subMenuItems && item.subMenuItems.length > 0
        )
        
        if (!expandedItem) return null
        
        return (
          <div
            ref={subMenuRef}
            className={cn(
              'fixed left-[328px] top-0 bottom-0 z-40 w-64',
              'panel-glass border-r border-cyan-500/30 backdrop-blur-md',
              'transition-all duration-300 ease-out',
              'pointer-events-auto',
              'animate-in slide-in-from-left duration-300'
            )}
            style={{ height: '100vh' }}
          >
            <div className="h-full flex flex-col">
              {/* Submenu Header */}
              <div className="flex-shrink-0 px-4 py-3 border-b border-cyan-500/20 bg-gradient-to-b from-gray-900/95 to-gray-900/90">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-cyan-300">
                    {expandedItem.label}
                  </h3>
                  <button
                    onClick={() => {
                      setExpandedMainMenuItem(null)
                    }}
                    className="w-8 h-8 flex items-center justify-center bg-transparent border-0 text-gray-300 hover:text-cyan-400 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Submenu Items - Full height container */}
              <div className="flex-1 overflow-y-auto py-2 min-h-0">
                {expandedItem.subMenuItems!.map((subItem) => (
                  <button
                    key={subItem.id}
                    onClick={() => handleSubMenuItemClick(subItem)}
                    className={cn(
                      'w-full px-4 py-3 flex items-center',
                      'text-left transition-all duration-200',
                      'hover:bg-gray-800/50 hover:text-cyan-300',
                      'text-white border-b border-gray-800/50'
                    )}
                  >
                    <span className="text-sm font-medium">{subItem.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )
      })()}


      {/* Context Menu */}
      {contextMenuState.isOpen && contextMenuItems.length > 0 && (
        <ContextMenu
          items={contextMenuItems}
          position={contextMenuState.position}
          onClose={() =>
            setContextMenuState({ isOpen: false, position: { x: 0, y: 0 }, category: null })
          }
        />
      )}
    </>
  )
}

