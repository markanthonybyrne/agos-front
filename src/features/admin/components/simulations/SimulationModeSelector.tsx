import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Beaker, Database, Shield, Sword } from 'lucide-react'

type SimulationMode = 'single' | 'batch' | 'fleet-test' | 'defence-test'

interface SimulationModeSelectorProps {
  mode: SimulationMode
  onModeChange: (mode: SimulationMode) => void
}

export function SimulationModeSelector({ mode, onModeChange }: SimulationModeSelectorProps) {
  return (
    <Tabs value={mode} onValueChange={(value) => onModeChange(value as SimulationMode)}>
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="single" className="flex items-center gap-2">
          <Beaker className="w-4 h-4" />
          Single
        </TabsTrigger>
        <TabsTrigger value="batch" className="flex items-center gap-2">
          <Database className="w-4 h-4" />
          Batch
        </TabsTrigger>
        <TabsTrigger value="fleet-test" className="flex items-center gap-2">
          <Sword className="w-4 h-4" />
          Test Fleet
        </TabsTrigger>
        <TabsTrigger value="defence-test" className="flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Test Defence
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

