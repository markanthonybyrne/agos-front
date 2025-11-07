"use client"

import * as React from "react"
import { ChevronRight, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

export interface TreeNode {
  id: string
  label: string
  icon?: LucideIcon
  children?: TreeNode[]
  onClick?: () => void
  infoIcon?: boolean
}

interface TreeViewProps {
  nodes: TreeNode[]
  selectedId?: string
  onSelect?: (id: string) => void
  className?: string
}

interface TreeNodeProps {
  node: TreeNode
  level: number
  selectedId?: string
  onSelect?: (id: string) => void
}

const TreeNodeComponent: React.FC<TreeNodeProps> = ({
  node,
  level,
  selectedId,
  onSelect,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const hasChildren = node.children && node.children.length > 0
  const isSelected = selectedId === node.id
  const Icon = node.icon

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded-none text-sm cursor-pointer transition-all duration-200",
          "hover:bg-gray-700/50 hover:text-cyan-300",
          isSelected && "bg-gray-600/50 text-cyan-400",
          level > 0 && "pl-6"
        )}
        onClick={() => {
          if (onSelect) {
            onSelect(node.id)
          }
          if (node.onClick) {
            node.onClick()
          }
          if (hasChildren) {
            setIsExpanded(!isExpanded)
          }
        }}
      >
        {hasChildren && (
          <div className="w-4 h-4 flex items-center justify-center">
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-gray-400" />
            ) : (
              <ChevronRight className="w-3 h-3 text-gray-400" />
            )}
          </div>
        )}
        {!hasChildren && <div className="w-4" />}
        {Icon && (
          <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
        )}
        <span className="flex-1">{node.label}</span>
        {node.infoIcon && (
          <span className="text-xs text-gray-400 cursor-help">i</span>
        )}
      </div>
      {hasChildren && isExpanded && (
        <div className="ml-4">
          {node.children!.map((child) => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const TreeView = React.forwardRef<HTMLDivElement, TreeViewProps>(
  ({ nodes, selectedId, onSelect, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "w-full bg-gray-900/90 backdrop-blur-sm border border-gray-700/50 rounded-none p-1",
          className
        )}
      >
        {nodes.map((node) => (
          <TreeNodeComponent
            key={node.id}
            node={node}
            level={0}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        ))}
      </div>
    )
  }
)
TreeView.displayName = "TreeView"

export { TreeView }

