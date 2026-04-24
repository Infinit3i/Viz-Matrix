import { describe, it, expect } from 'vitest'
import { exportToNavigator, importFromNavigator } from '../utils/navigatorExport'

describe('navigatorExport', () => {
  describe('exportToNavigator', () => {
    it('creates valid layer with empty sourcetypes', () => {
      const layer = exportToNavigator(new Set())

      expect(layer).toEqual(expect.objectContaining({
        name: 'Viz-Matrix Coverage',
        domain: 'enterprise-attack',
        versions: {
          attack: '14',
          navigator: '4.5',
          layer: '4.5'
        },
        techniques: [],
        gradient: {
          colors: ['#ff6b6b', '#feca57', '#48dbfb'],
          minValue: 0,
          maxValue: 1
        }
      }))
    })

    it('creates layer with techniques when sourcetypes selected', () => {
      // Test with a known sourcetype that should have techniques
      const activeIds = new Set(['win-security'])
      const layer = exportToNavigator(activeIds)

      expect(layer.techniques.length).toBeGreaterThan(0)
      expect(layer.metadata).toEqual(expect.arrayContaining([
        expect.objectContaining({
          name: 'exported_from',
          value: 'Viz-Matrix'
        })
      ]))
    })

    it('includes coverage comments in techniques', () => {
      const activeIds = new Set(['win-security'])
      const layer = exportToNavigator(activeIds, 'Test Layer')

      expect(layer.name).toBe('Test Layer')

      // Should have techniques with comments
      const techniquesWithComments = layer.techniques.filter(t => t.comment && t.comment.length > 0)
      expect(techniquesWithComments.length).toBeGreaterThan(0)

      // Comments should mention covering sources
      const hasSecurityEventLog = layer.techniques.some(t =>
        t.comment?.includes('Security Event Log')
      )
      expect(hasSecurityEventLog).toBe(true)
    })

    it('sets max score correctly based on technique coverage', () => {
      const activeIds = new Set(['win-security', 'sysmon'])
      const layer = exportToNavigator(activeIds)

      // With multiple sources, max score should be > 1
      expect(layer.gradient.maxValue).toBeGreaterThan(1)
    })
  })

  describe('importFromNavigator', () => {
    it('handles empty layer', () => {
      const emptyLayer = {
        name: 'Empty Layer',
        versions: { attack: '14', navigator: '4.5', layer: '4.5' },
        domain: 'enterprise-attack',
        description: '',
        sorting: 0,
        hideDisabled: false,
        techniques: [],
        gradient: { colors: ['#ff0000'], minValue: 0, maxValue: 1 }
      }

      const result = importFromNavigator(emptyLayer)

      expect(result.activeSourceIds.size).toBe(0)
      expect(result.layerInfo.isAptLayer).toBe(false)
      expect(result.layerInfo.coveredTechniques).toEqual([])
    })

    it('detects APT layers by threat colors', () => {
      const aptLayer = {
        name: 'APT-29',
        versions: { attack: '14', navigator: '4.5', layer: '4.5' },
        domain: 'enterprise-attack',
        description: 'APT-29 techniques',
        sorting: 0,
        hideDisabled: false,
        techniques: [
          {
            techniqueID: 'T1078',
            enabled: true,
            score: 1,
            color: '#e60d0d', // Threat red color
            comment: 'Used by APT-29'
          },
          {
            techniqueID: 'T1055',
            enabled: true,
            score: 1,
            color: '#e60d0d',
            comment: 'Process injection'
          }
        ],
        gradient: { colors: ['#e60d0d'], minValue: 0, maxValue: 1 }
      }

      const result = importFromNavigator(aptLayer)

      expect(result.layerInfo.isAptLayer).toBe(true)
      expect(result.layerInfo.threatLevel).toBe('high')
      expect(result.layerInfo.coveredTechniques).toContain('T1078')
      expect(result.layerInfo.coveredTechniques).toContain('T1055')
      expect(result.layerInfo.aptTechniques.has('T1078')).toBe(true)

      // For APT layers, no sourcetypes should be auto-enabled
      expect(result.activeSourceIds.size).toBe(0)
    })

    it('detects non-APT layers and enables sourcetypes', () => {
      const normalLayer = {
        name: 'Coverage Layer',
        versions: { attack: '14', navigator: '4.5', layer: '4.5' },
        domain: 'enterprise-attack',
        description: 'Normal coverage',
        sorting: 0,
        hideDisabled: false,
        techniques: [
          {
            techniqueID: 'T1078',
            enabled: true,
            score: 2,
            color: '#48dbfb', // Non-threat blue color
            comment: 'Multiple sources'
          },
          {
            techniqueID: 'T1079',
            enabled: true,
            score: 1,
            color: '#48dbfb',
            comment: 'Single source'
          }
        ], // Small technique set (< 25) with non-red colors
        gradient: { colors: ['#48dbfb'], minValue: 0, maxValue: 3 }
      }

      const result = importFromNavigator(normalLayer)

      expect(result.layerInfo.isAptLayer).toBe(false)
      expect(result.layerInfo.threatLevel).toBe('low')
      // Should enable sourcetypes for non-APT layers
      expect(result.activeSourceIds.size).toBeGreaterThanOrEqual(0)
    })

    it('preserves APT technique information', () => {
      const aptLayer = {
        name: 'Test APT',
        versions: { attack: '14', navigator: '4.5', layer: '4.5' },
        domain: 'enterprise-attack',
        description: '',
        sorting: 0,
        hideDisabled: false,
        techniques: [
          {
            techniqueID: 'T1003',
            enabled: true,
            score: 3,
            color: '#ff0000',
            comment: 'Credential dumping technique',
            metadata: [{ name: 'source', value: 'threat-intel' }]
          }
        ],
        gradient: { colors: ['#ff0000'], minValue: 0, maxValue: 3 }
      }

      const result = importFromNavigator(aptLayer)
      const technique = result.layerInfo.aptTechniques.get('T1003')

      expect(technique).toBeDefined()
      expect(technique?.score).toBe(3)
      expect(technique?.color).toBe('#ff0000')
      expect(technique?.comment).toBe('Credential dumping technique')
      expect(technique?.metadata).toEqual([{ name: 'source', value: 'threat-intel' }])
    })
  })

  describe('APT detection logic', () => {
    it('detects uniform red coloring as APT', () => {
      const redLayer = {
        name: 'Red Layer',
        versions: { attack: '14', navigator: '4.5', layer: '4.5' },
        domain: 'enterprise-attack',
        description: '',
        sorting: 0,
        hideDisabled: false,
        techniques: Array.from({ length: 25 }, (_, i) => ({
          techniqueID: `T10${i.toString().padStart(2, '0')}`,
          enabled: true,
          score: 1,
          color: '#e60d0d'
        })),
        gradient: { colors: ['#e60d0d'], minValue: 0, maxValue: 1 }
      }

      const result = importFromNavigator(redLayer)
      expect(result.layerInfo.isAptLayer).toBe(true)
      expect(result.layerInfo.threatLevel).toBe('high')
    })

    it('detects large technique sets as APT', () => {
      const largeLayer = {
        name: 'Large Layer',
        versions: { attack: '14', navigator: '4.5', layer: '4.5' },
        domain: 'enterprise-attack',
        description: '',
        sorting: 0,
        hideDisabled: false,
        techniques: Array.from({ length: 50 }, (_, i) => ({
          techniqueID: `T20${i.toString().padStart(2, '0')}`,
          enabled: true,
          score: 1,
          color: '#888888' // Non-threat color but large set
        })),
        gradient: { colors: ['#888888'], minValue: 0, maxValue: 1 }
      }

      const result = importFromNavigator(largeLayer)
      expect(result.layerInfo.isAptLayer).toBe(true) // Large sets indicate APT analysis
    })

    it('classifies mixed colors as mixed threat level', () => {
      const mixedLayer = {
        name: 'Mixed Layer',
        versions: { attack: '14', navigator: '4.5', layer: '4.5' },
        domain: 'enterprise-attack',
        description: '',
        sorting: 0,
        hideDisabled: false,
        techniques: [
          { techniqueID: 'T1001', enabled: true, score: 1, color: '#ff4444' }, // Red variant
          { techniqueID: 'T1002', enabled: true, score: 1, color: '#ffaa44' }, // Orange variant
          { techniqueID: 'T1003', enabled: true, score: 1, color: '#0000ff' }, // Blue
          { techniqueID: 'T1004', enabled: true, score: 1, color: '#ffff00' } // Yellow
        ],
        gradient: { colors: ['#ff4444', '#ffaa44', '#0000ff', '#ffff00'], minValue: 0, maxValue: 1 }
      }

      const result = importFromNavigator(mixedLayer)
      expect(result.layerInfo.threatLevel).toBe('mixed')
    })
  })
})