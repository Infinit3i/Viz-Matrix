import { describe, it, expect } from 'vitest'
import { tactics } from '../data/mitreData'

describe('mitreData', () => {
  it('has all 12 tactics', () => {
    expect(tactics).toHaveLength(12)
  })

  it('every tactic has an id, name, shortName, and techniques', () => {
    for (const tactic of tactics) {
      expect(tactic.id).toMatch(/^TA\d{4}$/)
      expect(tactic.name).toBeTruthy()
      expect(tactic.shortName).toBeTruthy()
      expect(tactic.techniques.length).toBeGreaterThan(0)
    }
  })

  it('every technique has a valid id and name', () => {
    for (const tactic of tactics) {
      for (const tech of tactic.techniques) {
        expect(tech.id).toMatch(/^T\d{4}(\.\d{3})?$/)
        expect(tech.name).toBeTruthy()
      }
    }
  })

  it('has no duplicate technique ids within a tactic', () => {
    for (const tactic of tactics) {
      const ids = tactic.techniques.map(t => t.id)
      const unique = new Set(ids)
      expect(unique.size).toBe(ids.length)
    }
  })

  it('sub-techniques reference existing parent techniques within the same tactic', () => {
    for (const tactic of tactics) {
      const parentIds = new Set(
        tactic.techniques.filter(t => !t.id.includes('.')).map(t => t.id)
      )
      const subTechniques = tactic.techniques.filter(t => t.id.includes('.'))
      for (const sub of subTechniques) {
        const parentId = sub.id.split('.')[0]
        expect(parentIds.has(parentId), `${sub.id} has no parent ${parentId} in ${tactic.id}`).toBe(true)
      }
    }
  })
})
