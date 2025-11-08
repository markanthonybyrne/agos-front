import { describe, it, expect } from 'vitest'
import { buildGraph } from '@/lib/graphEngine'

const baseResearchNode = {
  era: 1,
  specialization: 'general',
  prerequisite_facilities: [],
  prerequisite_research: [],
  cost_tellerium: 100,
  cost_krypton: 0,
  cost_research_points: 5,
  build_time_ticks: 12,
  completed: true,
  available: true,
  unlocked: true,
}

const apiMock = {
  empire: {
    active_era: 1,
    specializations_unlocked: ['general'],
  },
  facilities: [
    {
      slug: 'research_lab',
      name: 'Research Lab',
      era: 1,
      specialization: 'general',
      prerequisites: ['research-basic_research'],
      base_tellerium_cost: 200,
      base_krypton_cost: 150,
      build_time_ticks: 18,
      completed: false,
      available: true,
      unlocked: true,
      can_build: true,
    },
  ],
  research: [
    {
      slug: 'basic_research',
      name: 'Basic Research',
      ...baseResearchNode,
    },
    {
      slug: 'advanced_research',
      name: 'Advanced Research',
      era: 2,
      specialization: 'general',
      prerequisite_research: ['basic_research'],
      prerequisite_facilities: [],
      cost_tellerium: 300,
      cost_krypton: 150,
      cost_research_points: 25,
      build_time_ticks: 24,
      completed: false,
      available: true,
      unlocked: true,
    },
  ],
  ships: [],
  defences: [],
}

describe('graphEngine metadata enrichment', () => {
  const graph = buildGraph(apiMock)
  const basic = graph.nodes.find((node) => node.id === 'research-basic_research')
  const advanced = graph.nodes.find((node) => node.id === 'research-advanced_research')
  const researchLab = graph.nodes.find((node) => node.id === 'facility-research_lab')

  it('calculates hierarchical columns', () => {
    expect(basic?.column).toBe(0)
    expect(advanced?.column).toBe(1)
    expect(researchLab?.column).toBe(1)
  })

  it('populates dependency metadata', () => {
    expect(advanced?.prerequisiteSummary?.depth).toBe(1)
    expect(advanced?.prerequisiteSummary?.prerequisiteCount).toBe(1)
    expect(advanced?.prerequisiteSummary?.totalCost.tellerium).toBe(100)
    expect(basic?.dependents).toContain('research-advanced_research')
    expect(basic?.unlockSummary?.research).toBe(1)
  })

  it('records dependents for cross-type edges', () => {
    expect(basic?.dependents).toContain('facility-research_lab')
    expect(basic?.unlockSummary?.facility).toBe(1)
  })
})

