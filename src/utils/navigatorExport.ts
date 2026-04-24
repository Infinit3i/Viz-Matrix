import { sourcetypes } from '../data/sourcetypes'
import { tactics } from '../data/mitreData'
import * as XLSX from 'xlsx'

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
 * Upload and parse both JSON and XLSX files
 */
export function uploadFile(): Promise<{ type: 'json' | 'xlsx', content: NavigatorLayer | ArrayBuffer }> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,.xlsx,.xls,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (!file) {
        reject(new Error('No file selected'))
        return
      }

      const fileExtension = file.name.toLowerCase().split('.').pop()
      const reader = new FileReader()

      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        reader.onload = (e) => {
          try {
            const arrayBuffer = e.target?.result as ArrayBuffer
            if (!arrayBuffer) {
              reject(new Error('Excel file is empty'))
              return
            }
            resolve({ type: 'xlsx', content: arrayBuffer })
          } catch (error) {
            reject(new Error(`Failed to read Excel file: ` + error))
          }
        }
        reader.readAsArrayBuffer(file)
      } else {
        // Assume JSON
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string
            const layer = JSON.parse(content) as NavigatorLayer

            // Basic validation
            if (!layer.name || !layer.domain || !layer.techniques) {
              reject(new Error('Invalid JSON layer file format'))
              return
            }

            resolve({ type: 'json', content: layer })
          } catch (error) {
            reject(new Error(`Failed to parse JSON file: ` + error))
          }
        }
        reader.readAsText(file)
      }
    }

    input.click()
  })
}

/**
 * Upload and parse layer file (legacy function for backward compatibility)
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

/**
 * CSV Export/Import Functions
 */

/**
 * Export current coverage data to XLSX format
 */
export function exportToXLSX(
  activeSourceIds: Set<string>
): Uint8Array {
  // Get active sourcetypes
  const activeSources = sourcetypes.filter(s => activeSourceIds.has(s.id))

  // Calculate technique coverage
  const techniqueData = new Map<string, {
    techniqueName: string
    tactic: string
    coverageCount: number
    coveringSources: string[]
  }>()

  // Create a lookup map for technique names and tactics
  const techniqueNameMap = new Map<string, string>()
  const techniqueTacticMap = new Map<string, string>()

  for (const tactic of tactics) {
    for (const technique of tactic.techniques) {
      techniqueNameMap.set(technique.id, technique.name)
      techniqueTacticMap.set(technique.id, tactic.name)
    }
  }

  // Get all unique technique IDs from active sources
  const allTechniqueIds = new Set<string>()
  activeSources.forEach(source => {
    source.techniqueIds.forEach(tid => allTechniqueIds.add(tid))
  })

  // Calculate coverage for each technique
  for (const techniqueId of allTechniqueIds) {
    const coveringSources = activeSources.filter(s => s.techniqueIds.includes(techniqueId))

    techniqueData.set(techniqueId, {
      techniqueName: techniqueNameMap.get(techniqueId) || 'Unknown Technique',
      tactic: techniqueTacticMap.get(techniqueId) || 'Unknown Tactic',
      coverageCount: coveringSources.length,
      coveringSources: coveringSources.map(s => s.name)
    })
  }

  // Create worksheet data
  const worksheetData: any[][] = []

  // Add headers
  worksheetData.push(['Technique ID', 'Technique Name', 'Tactic', 'Coverage Count', 'Covering Sources'])

  // Add data rows (sorted by technique ID)
  const sortedTechniqueIds = Array.from(allTechniqueIds).sort()
  for (const techniqueId of sortedTechniqueIds) {
    const data = techniqueData.get(techniqueId)!
    worksheetData.push([
      techniqueId,
      data.techniqueName,
      data.tactic,
      data.coverageCount,
      data.coveringSources.join(', ')
    ])
  }

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

  // Set column widths for better readability
  worksheet['!cols'] = [
    { wch: 12 }, // Technique ID
    { wch: 40 }, // Technique Name
    { wch: 20 }, // Tactic
    { wch: 15 }, // Coverage Count
    { wch: 50 }  // Covering Sources
  ]

  // Style the header row
  const range = XLSX.utils.decode_range(worksheet['!ref']!)
  for (let col = range.s.c; col <= range.e.c; col++) {
    const headerCell = worksheet[XLSX.utils.encode_cell({ r: 0, c: col })]
    if (headerCell) {
      headerCell.s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'E8E8E8' } }
      }
    }
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Coverage Matrix')

  // Generate binary data
  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
}

/**
 * Import XLSX coverage data and extract active source configuration
 */
export function importFromXLSX(
  arrayBuffer: ArrayBuffer
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
  // Parse the Excel file
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })

  // Get the first worksheet
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    throw new Error('Excel file contains no worksheets')
  }

  const worksheet = workbook.Sheets[sheetName]

  // Convert to array of arrays
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

  if (data.length < 2) {
    throw new Error('Excel file must contain at least headers and one data row')
  }

  // Parse headers
  const headers = data[0].map((h: any) => String(h || '').trim())

  // Check if this is a Viz-Matrix format (has "Technique ID" column) or MITRE Navigator format (tactic headers)
  const isVizMatrixFormat = headers.some(h => h.toLowerCase().includes('technique') && h.toLowerCase().includes('id'))

  if (isVizMatrixFormat) {
    return importVizMatrixXLSX(data)
  } else {
    return importMitreNavigatorXLSX(data, headers)
  }
}

/**
 * Import Viz-Matrix format XLSX
 */
function importVizMatrixXLSX(data: any[][]): {
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
  const headers = data[0].map((h: any) => String(h || '').trim())

  // Check if headers match (allow for different casing and extra columns)
  const headerMap = new Map<string, number>()
  for (let i = 0; i < headers.length; i++) {
    const normalizedHeader = headers[i].toLowerCase().replace(/[^a-z]/g, '')
    headerMap.set(normalizedHeader, i)
  }

  // Find required column indices
  const techniqueIdIndex = headerMap.get('techniqueid') ?? 0
  const coverageCountIndex = headerMap.get('coveragecount') ?? 3
  const coveringSourcesIndex = headerMap.get('coveringsources') ?? 4

  const coveredTechniques: string[] = []
  const aptTechniques = new Map<string, AptTechniqueInfo>()
  const activeSourceIds = new Set<string>()
  const allMentionedSources = new Set<string>()

  // Parse data rows
  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    if (!row || row.length === 0) continue

    const techniqueId = String(row[techniqueIdIndex] || '').trim()
    const coverageCount = parseInt(String(row[coverageCountIndex] || '0').trim()) || 0
    const coveringSources = String(row[coveringSourcesIndex] || '').trim()

    if (techniqueId && coverageCount > 0) {
      coveredTechniques.push(techniqueId)

      aptTechniques.set(techniqueId, {
        score: coverageCount,
        color: '#3b82f6',
        comment: `Covered by: ${coveringSources}`,
        metadata: []
      })

      if (coveringSources) {
        const sourceNames = coveringSources.split(',').map(s => s.trim())
        for (const sourceName of sourceNames) {
          allMentionedSources.add(sourceName)

          const matchingSource = sourcetypes.find(s =>
            s.name.toLowerCase() === sourceName.toLowerCase() ||
            s.id.toLowerCase() === sourceName.toLowerCase()
          )
          if (matchingSource) {
            activeSourceIds.add(matchingSource.id)
          }
        }
      }
    }
  }

  const isAptLayer = coveredTechniques.length > 15 || allMentionedSources.size === 0

  if (!isAptLayer && activeSourceIds.size < allMentionedSources.size * 0.5) {
    const sourceScores = new Map<string, number>()

    for (const source of sourcetypes) {
      const matchingTechniques = source.techniqueIds.filter(tid =>
        coveredTechniques.includes(tid)
      )
      if (matchingTechniques.length > 0) {
        sourceScores.set(source.id, matchingTechniques.length)
      }
    }

    const sortedSources = Array.from(sourceScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, Math.max(10, activeSourceIds.size))

    for (const [sourceId] of sortedSources) {
      activeSourceIds.add(sourceId)
    }
  }

  return {
    activeSourceIds,
    layerInfo: {
      name: 'Imported Excel Coverage',
      description: `Coverage data imported from Excel with ${coveredTechniques.length} techniques`,
      techniqueCount: coveredTechniques.length,
      coveredTechniques,
      isAptLayer,
      aptTechniques,
      layerColors: ['#3b82f6'],
      threatLevel: coveredTechniques.length > 50 ? 'high' : coveredTechniques.length > 20 ? 'medium' : 'low'
    }
  }
}

/**
 * Import MITRE Navigator format XLSX (matrix with tactic headers)
 */
function importMitreNavigatorXLSX(data: any[][], headers: string[]): {
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
  // Create a mapping of tactic names to their column indices
  const tacticColumns = new Map<string, number>()
  for (let i = 0; i < headers.length; i++) {
    const tacticName = headers[i].toLowerCase()
    tacticColumns.set(tacticName, i)
  }

  // Create a technique name to ID mapping
  const techniqueNameToId = new Map<string, { id: string, tactic: string }>()
  for (const tactic of tactics) {
    for (const technique of tactic.techniques) {
      techniqueNameToId.set(technique.name.toLowerCase(), {
        id: technique.id,
        tactic: tactic.name.toLowerCase()
      })
    }
  }

  const coveredTechniques: string[] = []
  const aptTechniques = new Map<string, AptTechniqueInfo>()

  // Parse technique names from the matrix
  for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
    const row = data[rowIndex]
    if (!row) continue

    for (let colIndex = 0; colIndex < row.length; colIndex++) {
      const cellValue = String(row[colIndex] || '').trim()
      if (!cellValue) continue

      // Try to find this technique name in our mapping
      const techniqueInfo = techniqueNameToId.get(cellValue.toLowerCase())
      if (techniqueInfo) {
        // Verify this technique belongs to the correct tactic column
        const tacticName = headers[colIndex]?.toLowerCase()
        if (tacticName && (tacticName.includes(techniqueInfo.tactic.split(' ')[0]) ||
                          techniqueInfo.tactic.includes(tacticName.split(' ')[0]))) {

          if (!coveredTechniques.includes(techniqueInfo.id)) {
            coveredTechniques.push(techniqueInfo.id)

            aptTechniques.set(techniqueInfo.id, {
              score: 1, // Default score for navigator imports
              color: '#dc2626', // Red color for threat techniques
              comment: `Technique from MITRE Navigator layer`,
              metadata: []
            })
          }
        }
      }
    }
  }

  return {
    activeSourceIds: new Set<string>(), // Don't auto-select sourcetypes for navigator imports
    layerInfo: {
      name: 'MITRE Navigator Layer',
      description: `MITRE Navigator layer imported with ${coveredTechniques.length} techniques`,
      techniqueCount: coveredTechniques.length,
      coveredTechniques,
      isAptLayer: true, // Navigator layers are typically APT/threat layers
      aptTechniques,
      layerColors: ['#dc2626'],
      threatLevel: coveredTechniques.length > 50 ? 'high' : coveredTechniques.length > 20 ? 'medium' : 'low'
    }
  }
}

/**
 * Download XLSX file
 */
export function downloadXLSX(xlsxData: Uint8Array, filename?: string) {
  const blob = new Blob([xlsxData.buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename || `viz_matrix_coverage_${new Date().toISOString().split('T')[0]}.xlsx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

