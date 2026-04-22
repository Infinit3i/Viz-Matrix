import { sourcetypes } from '../data/sourcetypes'

// MITRE Navigator Layer format interfaces
export interface NavigatorLayer {
  name: string
  versions: {
    attack: string
    navigator: string
    layer: string
  }
  domain: string
  description: string
  filters?: {
    platforms?: string[]
  }
  sorting: number
  layout?: {
    layout: string
    showID: boolean
    showName: boolean
    showAggregateScores: boolean
    countUnscored: boolean
  }
  hideDisabled: boolean
  techniques: NavigatorTechnique[]
  gradient: {
    colors: string[]
    minValue: number
    maxValue: number
  }
  legendItems?: LegendItem[]
  metadata?: Metadata[]
  links?: Link[]
}

export interface NavigatorTechnique {
  techniqueID: string
  tactic?: string
  comment?: string
  enabled: boolean
  score?: number
  color?: string
  metadata?: Metadata[]
  links?: Link[]
  showSubtechniques?: boolean
}

export interface LegendItem {
  label: string
  color: string
}

export interface Metadata {
  name: string
  value: string
}

export interface Link {
  label: string
  url: string
}

/**
 * Export current Viz-Matrix state to MITRE Navigator layer format
 */
export function exportToNavigator(
  activeSourceIds: Set<string>,
  layerName = 'Viz-Matrix Coverage',
  description = 'Coverage matrix exported from Viz-Matrix'
): NavigatorLayer {
  // Get active sourcetypes
  const activeSources = sourcetypes.filter(s => activeSourceIds.has(s.id))

  // Calculate technique coverage
  const techniqueScores = new Map<string, number>()
  const techniqueComments = new Map<string, string>()

  // Get all unique technique IDs from active sources
  const allTechniqueIds = new Set<string>()
  activeSources.forEach(source => {
    source.techniqueIds.forEach(tid => allTechniqueIds.add(tid))
  })

  // Calculate coverage count for each technique
  for (const techniqueId of allTechniqueIds) {
    const coveringSources = activeSources.filter(s => s.techniqueIds.includes(techniqueId))
    techniqueScores.set(techniqueId, coveringSources.length)

    // Add comment with covering sources
    if (coveringSources.length > 0) {
      const sourceNames = coveringSources.map(s => s.name).sort().join(', ')
      techniqueComments.set(techniqueId, `Covered by: ${sourceNames}`)
    }
  }

  // Find max score for gradient
  const maxScore = Math.max(...techniqueScores.values(), 1)

  // Create techniques array
  const techniques: NavigatorTechnique[] = Array.from(allTechniqueIds).map(techniqueId => ({
    techniqueID: techniqueId,
    enabled: true,
    score: techniqueScores.get(techniqueId) || 0,
    comment: techniqueComments.get(techniqueId) || '',
    metadata: [
      {
        name: 'coverage_count',
        value: (techniqueScores.get(techniqueId) || 0).toString()
      }
    ]
  }))

  // Create layer
  const layer: NavigatorLayer = {
    name: layerName,
    versions: {
      attack: '14',
      navigator: '4.5',
      layer: '4.5'
    },
    domain: 'enterprise-attack',
    description: description,
    sorting: 0,
    layout: {
      layout: 'side',
      showID: true,
      showName: true,
      showAggregateScores: false,
      countUnscored: true
    },
    hideDisabled: false,
    techniques: techniques,
    gradient: {
      colors: ['#ff6b6b', '#feca57', '#48dbfb'],  // Red -> Yellow -> Blue
      minValue: 0,
      maxValue: maxScore
    },
    metadata: [
      {
        name: 'exported_from',
        value: 'Viz-Matrix'
      },
      {
        name: 'export_timestamp',
        value: new Date().toISOString()
      },
      {
        name: 'active_source_count',
        value: activeSources.length.toString()
      }
    ]
  }

  return layer
}

/**
 * Import MITRE Navigator layer and extract active source configuration
 */
export function importFromNavigator(
  layer: NavigatorLayer
): {
  activeSourceIds: Set<string>
  layerInfo: {
    name: string
    description: string
    techniqueCount: number
    coveredTechniques: string[]
    isAptLayer: boolean
    aptTechniques: Map<string, AptTechniqueInfo>
    layerColors: string[]
    threatLevel: 'high' | 'medium' | 'low' | 'mixed'
  }
} {
  // Get techniques with scores > 0 (covered techniques)
  const coveredTechniques = layer.techniques
    .filter(t => t.enabled && (t.score || 0) > 0)
    .map(t => t.techniqueID)

  // Analyze layer for APT characteristics
  const aptAnalysis = analyzeAptLayer(layer)

  // Create APT technique map
  const aptTechniques = new Map<string, AptTechniqueInfo>()
  for (const technique of layer.techniques) {
    if (technique.enabled && (technique.score || 0) > 0) {
      aptTechniques.set(technique.techniqueID, {
        score: technique.score || 0,
        color: technique.color || '#666666',
        comment: technique.comment || '',
        tactic: technique.tactic,
        metadata: technique.metadata || []
      })
    }
  }

  // For APT layers: Don't auto-select sourcetypes, let user manually choose
  const activeSourceIds = new Set<string>()

  if (!aptAnalysis.isApt) {
    // Only auto-select sourcetypes for non-APT layers
    const candidateSources = new Set<string>()

    for (const techniqueId of coveredTechniques) {
      // Find all sourcetypes that cover this technique
      const coveringSources = sourcetypes.filter(s => s.techniqueIds.includes(techniqueId))
      coveringSources.forEach(s => candidateSources.add(s.id))
    }

    // Score each sourcetype based on how many covered techniques it provides
    const sourceScores = new Map<string, number>()

    for (const sourceId of candidateSources) {
      const source = sourcetypes.find(s => s.id === sourceId)
      if (!source) continue

      const matchingTechniques = source.techniqueIds.filter(tid =>
        coveredTechniques.includes(tid)
      )
      sourceScores.set(sourceId, matchingTechniques.length)
    }

    // Select sourcetypes that contribute significantly to coverage
    for (const [sourceId, score] of sourceScores.entries()) {
      if (score > 0) {
        activeSourceIds.add(sourceId)
      }
    }
  }

  return {
    activeSourceIds,
    layerInfo: {
      name: layer.name,
      description: layer.description,
      techniqueCount: layer.techniques.length,
      coveredTechniques,
      isAptLayer: aptAnalysis.isApt,
      aptTechniques,
      layerColors: aptAnalysis.colors,
      threatLevel: aptAnalysis.threatLevel
    }
  }
}

interface AptTechniqueInfo {
  score: number
  color: string
  comment: string
  tactic?: string
  metadata: Metadata[]
  platforms?: string[]
}

/**
 * Analyze layer to detect APT characteristics
 */
function analyzeAptLayer(layer: NavigatorLayer): {
  isApt: boolean
  threatLevel: 'high' | 'medium' | 'low' | 'mixed'
  colors: string[]
} {
  const techniques = layer.techniques.filter(t => t.enabled && (t.score || 0) > 0)

  if (techniques.length === 0) {
    return { isApt: false, threatLevel: 'low', colors: [] }
  }

  // Collect unique colors
  const colors = [...new Set(techniques.map(t => t.color).filter((color): color is string => Boolean(color)))]

  // Detect APT patterns:
  // 1. Uniform coloring (common in APT layers)
  // 2. Red/orange colors (threat indicators)
  // 3. Uniform scoring (threat activity levels)

  const scores = techniques.map(t => t.score || 0)
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
  const uniformScoring = scores.every(s => s === scores[0])
  const uniformColoring = colors.length <= 2

  // Check for threat colors (red variants)
  const threatColors = colors.filter(color => {
    if (!color) return false
    const hex = color.toLowerCase().replace('#', '')
    // Check if red-dominant (high red component, lower green/blue)
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    return r > 180 && r > g && r > b
  })

  const isApt = (uniformScoring && uniformColoring) || threatColors.length > 0 ||
                techniques.length > 20 // Large technique sets often indicate APT analysis

  let threatLevel: 'high' | 'medium' | 'low' | 'mixed' = 'low'

  if (threatColors.length > 0 && avgScore >= 1) {
    threatLevel = 'high'
  } else if (uniformColoring && avgScore > 0.5) {
    threatLevel = 'medium'
  } else if (colors.length > 3) {
    threatLevel = 'mixed'
  }

  return {
    isApt,
    threatLevel,
    colors
  }
}

/**
 * Download layer as JSON file
 */
export function downloadLayer(layer: NavigatorLayer, filename?: string) {
  const blob = new Blob([JSON.stringify(layer, null, 2)], {
    type: 'application/json'
  })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename || `${layer.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Upload and parse layer file
 */
export function uploadLayer(): Promise<NavigatorLayer> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'

    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (!file) {
        reject(new Error('No file selected'))
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const layer = JSON.parse(content) as NavigatorLayer

          // Basic validation
          if (!layer.name || !layer.domain || !layer.techniques) {
            reject(new Error('Invalid layer file format'))
            return
          }

          resolve(layer)
        } catch (error) {
          reject(new Error('Failed to parse layer file: ' + error))
        }
      }
      reader.readAsText(file)
    }

    input.click()
  })
}