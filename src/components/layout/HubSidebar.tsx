import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { ChevronRight, ChevronLeft, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/common/Avatar'
import { ContextMenu, ContextMenuItem } from '@/components/common/ContextMenu'
import { useWindow } from '@/components/common/WindowManager'
import { PanelSize } from '@/app/slices/panelSlice'
import { hubMenuConfig, HubCategory, MainMenuItem, SubMenuItem } from '@/lib/hubMenuConfig'
import { useGetMeQuery } from '@/api/endpoints/authApi'
import { getUserAvatarUrl } from '@/lib/avatar'
import { useAppDispatch } from '@/app/hooks'
import { logout } from '@/app/slices/authSlice'
import { useNavigate } from 'react-router-dom'
import { useUnreadMailCount } from '@/hooks/useUnreadMailCount'
import { useGetPlanetsQuery } from '@/api/endpoints/planetsApi'
import { getPlanetRegionAndSystem } from '@/lib/galaxyUtils'
import { Planet } from '@/types/api.types'

interface HubSidebarProps {
  constructionCount?: number
}

export function HubSidebar({ constructionCount = 0 }: HubSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('command')
  const [expandedMainMenuItem, setExpandedMainMenuItem] = useState<string | null>(null)
  const [viewportWidth, setViewportWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1024)
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
  const { data: planetsData } = useGetPlanetsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  })
  
  const sidebarRef = useRef<HTMLDivElement>(null)
  const mainMenuRef = useRef<HTMLDivElement>(null)
  const subMenuRef = useRef<HTMLDivElement>(null)
  // Hover timers for delayed expansion
  const hoverMainTimerRef = useRef<number | null>(null)

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = (_e: MouseEvent) => {
      if (contextMenuState.isOpen) {
        setContextMenuState({ isOpen: false, position: { x: 0, y: 0 }, category: null })
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [contextMenuState.isOpen])

  // Track viewport width (throttled with rAF) to keep submenu panels on-screen and animate reposition
  useEffect(() => {
    let raf: number | null = null
    const onResize = () => {
      if (raf) cancelAnimationFrame(raf)
      raf = window.requestAnimationFrame(() => {
        setViewportWidth(window.innerWidth)
        raf = null
      })
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  // Note: hover timers are cleared on mouse leave; no additional unmount cleanup required

  // Get selected category config
  const selectedCategoryConfig = useMemo(
    () => hubMenuConfig.find((cat) => cat.id === selectedCategory),
    [selectedCategory]
  )

  // Handle main menu item click
  const handleMainMenuItemClick = useCallback(
    (item: MainMenuItem, e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault()
        e.stopPropagation()
      }
      
      // Check if item has submenu first
      if (item.subMenuItems && item.subMenuItems.length > 0) {
        // Expand the submenu for this item
        setExpandedMainMenuItem(item.id)
        return // Don't proceed to other handlers if there's a submenu
      }
      
      // No submenu, handle other actions
      if (item.navigateTo) {
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
    [openPanel, navigate]
  )

  // Handle submenu item click - opens panels/windows or navigates
  const handleSubMenuItemClick = useCallback(
    (item: SubMenuItem, e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault()
        e.stopPropagation()
      }
      
      // Submenu items can navigate or open panels/windows
      if (item.navigateTo) {
        navigate(item.navigateTo)
        setIsCollapsed(true)
        setExpandedMainMenuItem(null)
      } else if (item.panelType) {
        openPanel(item.panelType, item.panelSize || PanelSize.MEDIUM, item.panelData)
        setIsCollapsed(true)
        setExpandedMainMenuItem(null)
      } else if (item.onClick) {
        item.onClick()
        setIsCollapsed(true)
        setExpandedMainMenuItem(null)
      }
    },
    [openPanel, navigate]
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

  // Handle main menu close
  const handleMainMenuClose = useCallback(
    (e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault()
        e.stopPropagation()
      }
      setIsCollapsed(true)
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
      if (categoryId === 'colonies' && constructionCount > 0) {
        return constructionCount
      }
      if (categoryId === 'command' && unreadCount > 0) {
        return unreadCount
      }
      return undefined
    },
    [constructionCount, unreadCount]
  )

  return (
    <>
      {/* Icon Sidebar - Slimmer and darker */}
      <div
        ref={sidebarRef}
        className={cn(
          'fixed left-0 top-0 bottom-0 z-20 transition-all duration-300 ease-out',
          isCollapsed ? 'translate-x-0' : 'translate-x-0',
          'pointer-events-none'
        )}
        style={{ width: '48px' }}
      >
        <div
          className={cn(
            'w-full h-full flex flex-col items-center pb-3 gap-2',
            'bg-gray-900/95 backdrop-blur-md',
            'pointer-events-auto'
          )}
        >
          {/* Avatar at top - full width, square, at top */}
          <button
            onClick={() => {
              setSelectedCategory('command')
              setIsCollapsed(false)
            }}
            className="w-full h-[48px] bg-transparent border-0 p-0 cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0 flex items-center justify-center"
          >
            <Avatar
              src={getUserAvatarUrl(meData?.user)}
              name={meData?.user?.username || 'User'}
              size="sm"
              className="border-0 w-[48px] h-[48px] rounded-none [&>div]:w-full [&>div]:h-full [&>div]:rounded-none [&>div]:bg-[rgb(9_14_23/95%)] [&>div]:backdrop-blur-sm [&>div>div]:bg-[rgb(9_14_23/95%)] [&>div>div]:text-white [&>div>span]:text-white"
            />
          </button>

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
                    'w-10 h-10 transition-all duration-200 rounded-none relative',
                    'bg-transparent border-0',
                    'flex items-center justify-center',
                    'hover:text-cyan-400 active:text-cyan-400',
                    isSelected && 'text-cyan-400'
                  )}
                  aria-label={category.label}
                >
                  <Icon className={cn(
                    'w-4 h-4 transition-colors',
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
                'w-10 h-10 transition-all duration-200 rounded-none',
                'bg-transparent border-0',
                'flex items-center justify-center',
                'text-red-400 hover:text-red-300 active:text-red-300'
              )}
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
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
            'fixed left-[48px] top-0 bottom-0 z-30 w-64',
            'bg-gray-900/95 backdrop-blur-md',
            'transition-all duration-300 ease-out',
            'pointer-events-auto',
            'animate-in slide-in-from-left duration-300'
          )}
          style={{ height: '100vh' }}
        >
          <div className="h-full flex flex-col">
            {/* Header */}
            <div 
              className="flex-shrink-0 px-4 py-3 border-b border-cyan-500/20 bg-gradient-to-b from-gray-900/95 to-gray-900/90"
              onClick={(e) => {
                // Only stop propagation if not clicking the close button
                if ((e.target as HTMLElement).closest('button[aria-label="Close menu"]')) {
                  return
                }
                e.stopPropagation()
              }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-cyan-300">
                  {selectedCategoryConfig.label}
                </h3>
                <button
                  type="button"
                  onClick={handleMainMenuClose}
                  className="w-8 h-8 flex items-center justify-center bg-transparent border-0 text-gray-300 hover:text-cyan-400 hover:bg-gray-800/50 active:bg-gray-800/70 transition-colors cursor-pointer rounded-none relative z-10"
                  aria-label="Close menu"
                  title="Close menu"
                >
                  <ChevronLeft className="w-4 h-4 pointer-events-none" />
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
                    onClick={(e) => handleMainMenuItemClick(item, e)}
                    onMouseEnter={() => {
                      if (!hasSubMenu) return
                      if (hoverMainTimerRef.current) clearTimeout(hoverMainTimerRef.current)
                      hoverMainTimerRef.current = window.setTimeout(() => {
                        setExpandedMainMenuItem(item.id)
                      }, 150)
                    }}
                    onMouseLeave={() => {
                      if (hoverMainTimerRef.current) {
                        clearTimeout(hoverMainTimerRef.current)
                        hoverMainTimerRef.current = null
                      }
                    }}
                    className={cn(
                      'w-full px-4 py-3 flex items-center justify-between',
                      'text-left transition-all duration-200',
                      'hover:bg-gray-800/50 hover:text-cyan-300',
                      'text-white border-b border-gray-800/50',
                      'cursor-pointer',
                      expandedMainMenuItem === item.id && 'bg-gray-800/30 text-cyan-300'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {Icon && (
                        <Icon className="w-5 h-5 flex-shrink-0" />
                      )}
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    {hasSubMenu && (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
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
        // Find the expanded item with submenu
        const expandedItem = selectedCategoryConfig.mainMenuItems.find(
          (item) => item.id === expandedMainMenuItem
        )
        
        // Check if item exists and has submenu items
        if (!expandedItem || !expandedItem.subMenuItems || expandedItem.subMenuItems.length === 0) {
          return null
        }
        
        return (
          <div
            ref={subMenuRef}
            className={cn(
              'fixed top-0 bottom-0 z-40 w-64',
              'bg-gray-900/95 backdrop-blur-md',
              'transition-all duration-300 ease-out',
              'pointer-events-auto',
              'animate-in slide-in-from-left duration-300'
            )}
            style={{ height: '100vh', left: Math.min(48 + 256, Math.max(48, viewportWidth - 256)) }}
          >
            <div className="h-full flex flex-col">
              {/* Submenu Header */}
              <div className="flex-shrink-0 px-4 py-3 border-b border-cyan-500/20 bg-gradient-to-b from-gray-900/95 to-gray-900/90">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-cyan-300">
                    {expandedItem.label}
                  </h3>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setExpandedMainMenuItem(null)
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    className="w-8 h-8 flex items-center justify-center bg-transparent border-0 text-gray-300 hover:text-cyan-400 hover:bg-gray-800/50 transition-colors cursor-pointer rounded-none"
                    aria-label="Close submenu"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Submenu Items - Full height container */}
              {/* All submenu items open panels/windows or navigate */}
              <div className="flex-1 overflow-y-auto py-2 min-h-0">
                {expandedItem.subMenuItems!.map((subItem) => {
                  // Handle dynamic planet list
                  if (subItem.isDynamic && subItem.id === 'planets-list') {
                    const planets = Array.isArray(planetsData?.planets) ? planetsData.planets : []
                    
                    if (planets.length === 0) {
                      return (
                        <div
                          key={subItem.id}
                          className={cn(
                            'w-full px-4 py-3 flex items-center',
                            'text-left',
                            'text-gray-500 border-b border-gray-800/50',
                          )}
                        >
                          <span className="text-sm font-medium">No planets owned</span>
                        </div>
                      )
                    }
                    
                    return (
                      <React.Fragment key={subItem.id}>
                        {planets.map((planet: Planet) => {
                          const { region, system } = getPlanetRegionAndSystem(planet)
                          if (!region || !system || !planet.id) return null
                          
                          const planetName = planet.name || `Planet ${planet.id}`
                          const navigatePath = `/map/system/${region}/${system}?planet=${planet.id}`
                          
                          return (
                            <button
                              key={`planet-${planet.id}`}
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                navigate(navigatePath)
                                setIsCollapsed(true)
                                setExpandedMainMenuItem(null)
                              }}
                              className={cn(
                                'w-full px-4 py-3 flex items-center',
                                'text-left transition-all duration-200',
                                'hover:bg-gray-800/50 hover:text-cyan-300',
                                'text-white border-b border-gray-800/50',
                                'cursor-pointer'
                              )}
                            >
                              <span className="text-sm font-medium">{planetName}</span>
                            </button>
                          )
                        })}
                      </React.Fragment>
                    )
                  }
                  
                  // Regular submenu item
                  return (
                    <button
                      key={subItem.id}
                      onClick={(e) => handleSubMenuItemClick(subItem, e)}
                      className={cn(
                        'w-full px-4 py-3 flex items-center',
                        'text-left transition-all duration-200',
                        'hover:bg-gray-800/50 hover:text-cyan-300',
                        'text-white border-b border-gray-800/50',
                        'cursor-pointer'
                      )}
                    >
                      <span className="text-sm font-medium">{subItem.label}</span>
                    </button>
                  )
                })}
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

