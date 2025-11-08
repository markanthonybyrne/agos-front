# Tech Tree Implementation Guide

## Quick Summary

**Research = Empire-Wide** (main progression)
**Items = Planet-Level** (what you can build, depends on planet facilities)

## Visual Mockup

```
┌─────────────────────────────────────────────────────────────────┐
│ Tech Tree                    ERA: 2  [Industrial ▼]  [All Planets ▼] │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ERA 1                                                           │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 📚 Basic Mining Research              [✅ Completed]      │ │
│  │ Cost: 1,000 T • 500 K  |  Time: 5 ticks                  │ │
│  │ Effects: +10% Tellerium Production (Empire-wide)          │ │
│  │                                                           │ │
│  │ ▼ Unlocks 3 items                                        │ │
│  │   🏭 Basic Mine                    [2 planets can build]  │ │
│  │   🏭 Advanced Mine                 [1 planet can build]   │ │
│  │   🛡️ Laser Turret                  [All planets can build]│ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 📚 Military Doctrine              [⏳ In Progress]        │ │
│  │ Researching on: Homeworld (5 ticks remaining)             │ │
│  │                                                           │ │
│  │ ▼ Unlocks 2 items                                        │ │
│  │   🚀 Scout Fighter                [2 planets can build]   │ │
│  │   🏭 Basic Shipyard               [1 planet can build]    │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 📚 Advanced Combat                  [🔒 Locked]          │ │
│  │ Missing: Military Doctrine (research prerequisite)        │ │
│  │                                                           │ │
│  │ ▼ Unlocks 4 items (locked)                               │ │
│  │   🚀 Assault Fighter              [Locked - needs research]│ │
│  │   🏭 Advanced Shipyard            [Locked - needs research]│ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. Research Card

**Visual States**:
- ✅ **Completed** (Green border): Research done, benefits active empire-wide
- ⏳ **In Progress** (Yellow border): Researching on a planet, show progress
- 🔓 **Available** (Blue border): Can start research (prerequisites met)
- 🔒 **Locked** (Gray border): Can't research (missing prerequisites or ERA)

**Information**:
- Research name and icon
- Cost (Tellerium/Krypton)
- Build time (ticks)
- Effects (empire-wide bonuses)
- Prerequisites (research - empire-wide, facilities - planet-specific)
- Status badge

**Actions**:
- **Click**: Show details panel
- **"Start Research" button**: Opens planet selector (planets with Research Lab)

### 2. Item List (Under Research)

**Visual States**:
- ✅ **Available** (Green): Can build on selected planet(s)
- ⚠️ **Some Planets** (Yellow): Can build on some planets (show count)
- 🔒 **Locked** (Gray): Can't build (missing prerequisites)
- 🔴 **ERA Locked** (Red): ERA not high enough

**Information**:
- Item name and icon
- Type (Ship/Facility/Defence)
- Planet availability count
- Prerequisites status

**Actions**:
- **Click**: Show item details + planet selector
- **"Build" button**: Build on selected planet (if available)

### 3. Planet Context Selector

**Options**:
- "All Planets" - Show items available on ANY planet
- "Planet Name" - Show items available on THAT planet

**Behavior**:
- Filters item availability
- Highlights items that can be built on selected planet
- Shows missing prerequisites for that planet

## Data Flow

### 1. Load Tech Tree Data

```javascript
// Fetch tech tree data
const response = await fetch('/api/v1/tech-tree', {
  headers: { Authorization: `Bearer ${token}` }
});
const data = await response.json();

// Data structure:
// {
//   empire: { active_era, specializations_unlocked, completed_research, research_in_progress },
//   research: [...], // All research definitions with status
//   items: { ships: [...], facilities: [...], defences: [...] }
// }
```

### 2. Render Research Nodes

```javascript
function renderResearchNode(research, empire) {
  // Determine status
  const status = determineResearchStatus(research, empire);
  
  // Status logic:
  // - If in empire.completed_research → "completed"
  // - If in empire.research_in_progress → "in_progress"
  // - If prerequisites met (empire-wide) → "available"
  // - Otherwise → "locked"
  
  return (
    <ResearchCard
      research={research}
      status={status}
      unlocks={getUnlockedItems(research, items)}
      onStartResearch={handleStartResearch}
    />
  );
}
```

### 3. Render Item Lists

```javascript
function renderItemList(items, selectedPlanet, empire) {
  return items.map(item => {
    // Check if item can be built
    const availability = checkItemAvailability(item, selectedPlanet, empire);
    
    // Availability logic:
    // - Check research prerequisites (empire-wide)
    // - Check facility prerequisites (planet-specific)
    // - Check ERA requirement (empire-level)
    
    return (
      <ItemCard
        item={item}
        availability={availability}
        canBuildOnPlanets={availability.availablePlanets}
        onBuild={handleBuildItem}
      />
    );
  });
}
```

### 4. Check Item Availability

```javascript
function checkItemAvailability(item, selectedPlanet, empire) {
  // Check research prerequisites (empire-wide)
  const researchMet = item.prerequisite_research.every(slug => 
    empire.completed_research.includes(slug)
  );
  
  // Check facility prerequisites (planet-specific)
  const facilityMet = selectedPlanet === 'all' 
    ? checkAnyPlanetHasFacilities(item.prerequisite_facilities, empire.planets)
    : checkPlanetHasFacilities(item.prerequisite_facilities, selectedPlanet);
  
  // Check ERA
  const eraMet = empire.active_era >= item.era;
  
  return {
    available: researchMet && facilityMet && eraMet,
    missingResearch: item.prerequisite_research.filter(slug => 
      !empire.completed_research.includes(slug)
    ),
    missingFacilities: item.prerequisite_facilities.filter(facility =>
      !hasFacility(selectedPlanet, facility)
    ),
    availablePlanets: getPlanetsThatCanBuild(item, empire.planets)
  };
}
```

## API Endpoints

### GET `/api/v1/tech-tree`

Returns complete tech tree data with empire status.

**Response**:
```json
{
  "empire": {
    "active_era": 2,
    "specializations_unlocked": ["industrial"],
    "completed_research": ["basic_mining", "military_doctrine"],
    "research_in_progress": [
      {
        "slug": "advanced_combat",
        "planet_id": 1,
        "planet_name": "Homeworld",
        "ticks_remaining": 5
      }
    ]
  },
  "research": [
    {
      "slug": "basic_mining",
      "name": "Basic Mining Research",
      "era": 1,
      "status": "completed",
      "can_research": false,
      "unlocks": {
        "ships": [],
        "facilities": ["basic_mine", "advanced_mine"],
        "defences": ["laser_turret"]
      }
    }
  ],
  "items": {
    "ships": [...],
    "facilities": [...],
    "defences": [...]
  }
}
```

### POST `/api/v1/planets/{planetId}/research/start`

Start research on a planet.

**Request**:
```json
{
  "research_slug": "advanced_combat"
}
```

### POST `/api/v1/planets/{planetId}/ships/build`

Build ships on a planet.

**Request**:
```json
{
  "ship_slug": "scout_fighter",
  "quantity": 10
}
```

## React Component Example

```jsx
function TechTree() {
  const [techTree, setTechTree] = useState(null);
  const [selectedPlanet, setSelectedPlanet] = useState('all');
  const [selectedResearch, setSelectedResearch] = useState(null);
  const [expandedResearch, setExpandedResearch] = useState([]);
  
  useEffect(() => {
    loadTechTree();
  }, []);
  
  const loadTechTree = async () => {
    const data = await fetchTechTree();
    setTechTree(data);
  };
  
  const handleStartResearch = async (researchSlug, planetId) => {
    await startResearch(planetId, researchSlug);
    loadTechTree(); // Refresh
  };
  
  const handleBuildItem = async (itemType, itemSlug, planetId, quantity) => {
    await buildItem(planetId, itemType, itemSlug, quantity);
    // Show success message
  };
  
  const toggleResearchExpansion = (researchSlug) => {
    setExpandedResearch(prev => 
      prev.includes(researchSlug)
        ? prev.filter(slug => slug !== researchSlug)
        : [...prev, researchSlug]
    );
  };
  
  if (!techTree) return <Loading />;
  
  return (
    <div className="tech-tree">
      <TechTreeHeader 
        era={techTree.empire.active_era}
        specialization={techTree.empire.specializations_unlocked[0]}
        selectedPlanet={selectedPlanet}
        onPlanetChange={setSelectedPlanet}
      />
      
      <div className="tech-tree-content">
        {techTree.research.map(research => (
          <ResearchCard
            key={research.slug}
            research={research}
            status={research.status}
            isExpanded={expandedResearch.includes(research.slug)}
            onToggleExpand={() => toggleResearchExpansion(research.slug)}
            onStartResearch={handleStartResearch}
          >
            {research.isExpanded && (
              <ItemList
                items={research.unlocks}
                selectedPlanet={selectedPlanet}
                empire={techTree.empire}
                onBuild={handleBuildItem}
              />
            )}
          </ResearchCard>
        ))}
      </div>
    </div>
  );
}
```

## Key Implementation Points

### 1. Research Status Determination

```javascript
function determineResearchStatus(research, empire) {
  // Check if completed
  if (empire.completed_research.includes(research.slug)) {
    return 'completed';
  }
  
  // Check if in progress
  if (empire.research_in_progress.some(r => r.slug === research.slug)) {
    return 'in_progress';
  }
  
  // Check prerequisites (empire-wide for research, planet-specific for facilities)
  const researchPrereqsMet = research.prerequisite_research.every(slug =>
    empire.completed_research.includes(slug)
  );
  
  // Check ERA
  const eraMet = empire.active_era >= research.era;
  
  if (researchPrereqsMet && eraMet) {
    return 'available';
  }
  
  return 'locked';
}
```

### 2. Item Availability Check

```javascript
function checkItemAvailability(item, selectedPlanet, empire) {
  // Research prerequisites (empire-wide)
  const researchMet = item.prerequisite_research.every(slug =>
    empire.completed_research.includes(slug)
  );
  
  // Facility prerequisites (planet-specific)
  let facilityMet = false;
  let availablePlanets = [];
  
  if (selectedPlanet === 'all') {
    // Check all planets
    availablePlanets = empire.planets.filter(planet =>
      item.prerequisite_facilities.every(facility =>
        planetHasFacility(planet, facility)
      )
    );
    facilityMet = availablePlanets.length > 0;
  } else {
    // Check specific planet
    const planet = empire.planets.find(p => p.id === selectedPlanet);
    facilityMet = item.prerequisite_facilities.every(facility =>
      planetHasFacility(planet, facility)
    );
    if (facilityMet) {
      availablePlanets = [planet];
    }
  }
  
  // ERA check
  const eraMet = empire.active_era >= item.era;
  
  return {
    available: researchMet && facilityMet && eraMet,
    availablePlanets,
    missingResearch: item.prerequisite_research.filter(slug =>
      !empire.completed_research.includes(slug)
    ),
    missingFacilities: item.prerequisite_facilities.filter(facility =>
      !availablePlanets.some(planet => planetHasFacility(planet, facility))
    )
  };
}
```

### 3. Planet Selector for Research

```javascript
function ResearchPlanetSelector({ research, onStart }) {
  const [planets, setPlanets] = useState([]);
  
  useEffect(() => {
    // Fetch planets with Research Lab
    fetchPlanetsWithFacility('research_lab').then(setPlanets);
  }, []);
  
  return (
    <Modal title="Start Research">
      <p>Select a planet with Research Lab:</p>
      {planets.map(planet => (
        <PlanetOption
          key={planet.id}
          planet={planet}
          onClick={() => onStart(research.slug, planet.id)}
        />
      ))}
    </Modal>
  );
}
```

## Summary

1. **Research is Primary**: Main tree shows research (empire-wide)
2. **Items are Secondary**: Shown as unlocked items (planet-level)
3. **Planet Context**: Filter items by planet building capability
4. **Clear Visual Distinction**: Research (solid) vs Items (dashed)
5. **Action-Oriented**: Direct actions from tech tree
6. **Status-Driven**: Clear status indicators for availability

This design makes it clear what's empire-wide (research) vs planet-level (items), while providing a smooth user experience for planning and building.

