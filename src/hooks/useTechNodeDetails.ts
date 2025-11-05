import { useState, useCallback, useRef } from 'react'
import { TechNodeData } from '@/types/tech-tree.types'

interface UseTechNodeDetailsReturn {
  selectedNode: TechNodeData | null
  isOpen: boolean
  history: string[] // Stack of visited node IDs
  openDetails: (node: TechNodeData | null) => void
  closeDetails: () => void
  goBack: () => void
  clearHistory: () => void
}

/**
 * Hook for managing tech node details panel state
 */
export function useTechNodeDetails(): UseTechNodeDetailsReturn {
  const [selectedNode, setSelectedNode] = useState<TechNodeData | null>(null)
  const historyRef = useRef<string[]>([])
  
  const openDetails = useCallback((node: TechNodeData | null) => {
    if (node) {
      // Add to history if we have a current node
      if (selectedNode) {
        historyRef.current.push(selectedNode.id)
      }
      setSelectedNode(node)
    } else {
      setSelectedNode(null)
    }
  }, [selectedNode])
  
  const closeDetails = useCallback(() => {
    setSelectedNode(null)
    historyRef.current = []
  }, [])
  
  const goBack = useCallback(() => {
    if (historyRef.current.length > 0) {
      const previousNodeId = historyRef.current.pop()
      // In a real implementation, you'd fetch the node data here
      // For now, we just clear the current selection
      // The parent component should handle fetching and setting the previous node
      setSelectedNode(null)
      return previousNodeId
    }
    return null
  }, [])
  
  const clearHistory = useCallback(() => {
    historyRef.current = []
  }, [])
  
  return {
    selectedNode,
    isOpen: selectedNode !== null,
    history: historyRef.current,
    openDetails,
    closeDetails,
    goBack,
    clearHistory,
  }
}
