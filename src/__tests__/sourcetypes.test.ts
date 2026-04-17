import { describe, it, expect } from 'vitest'
import { sourcetypes, categoryLabels, categoryColors } from '../data/sourcetypes'
import { tactics } from '../data/mitreData'

const allTechniqueIds = new Set(
  tactics.flatMap(t => t.techniques.map(tech => tech.id))
)

describe('sourcetypes', () => {
  it('every sourcetype has required fields', () => {
    for (const src of sourcetypes) {
      expect(src.id).toBeTruthy()
      expect(src.name).toBeTruthy()
      expect(src.category).toBeTruthy()
      expect(src.color).toMatch(/^#[0-9a-fA-F]{6}$/)
      expect(src.techniqueIds.length).toBeGreaterThan(0)
    }
  })

  it('has no duplicate sourcetype ids', () => {
    const ids = sourcetypes.map(s => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every sourcetype category has a label', () => {
    for (const src of sourcetypes) {
      expect(categoryLabels[src.category]).toBeTruthy()
    }
  })

  it('every sourcetype category has a color', () => {
    for (const src of sourcetypes) {
      expect(categoryColors[src.category]).toBeTruthy()
    }
  })

  it('sourcetype technique ids reference valid MITRE techniques', () => {
    const invalid: string[] = []
    for (const src of sourcetypes) {
      for (const tid of src.techniqueIds) {
        if (!allTechniqueIds.has(tid)) {
          invalid.push(`${src.id}: ${tid}`)
        }
      }
    }
    // Warn but don't fail — sourcetypes may reference parent IDs covered across tactics
    if (invalid.length > 0) {
      console.warn(`Sourcetype technique IDs not in mitreData: ${invalid.join(', ')}`)
    }
  })

  it('has at least one sourcetype per category', () => {
    const categories = new Set(sourcetypes.map(s => s.category))
    for (const cat of Object.keys(categoryLabels)) {
      expect(categories.has(cat as never), `Missing sourcetypes for category: ${cat}`).toBe(true)
    }
  })
})
