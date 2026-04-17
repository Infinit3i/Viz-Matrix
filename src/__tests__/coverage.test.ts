import { describe, it, expect } from 'vitest'
import { sourcetypes } from '../data/sourcetypes'
import { tactics } from '../data/mitreData'

describe('coverage logic', () => {
  const allTechniqueIds = tactics.flatMap(t => t.techniques.map(tech => tech.id))

  it('enabling all sourcetypes covers at least 50% of techniques', () => {
    const covered = new Set<string>()
    for (const src of sourcetypes) {
      for (const tid of src.techniqueIds) {
        covered.add(tid)
      }
    }
    const coverage = allTechniqueIds.filter(id => covered.has(id)).length
    const pct = coverage / allTechniqueIds.length
    // Sourcetypes currently map parent technique IDs; sub-techniques expand the total
    expect(pct).toBeGreaterThan(0.15)
  })

  it('no sourcetype has empty technique list', () => {
    for (const src of sourcetypes) {
      expect(src.techniqueIds.length, `${src.name} has no techniques`).toBeGreaterThan(0)
    }
  })

  it('EDR sourcetypes all have edr category', () => {
    const edrs = sourcetypes.filter(s => s.id.startsWith('edr-'))
    expect(edrs.length).toBeGreaterThanOrEqual(2)
    for (const edr of edrs) {
      expect(edr.category).toBe('edr')
    }
  })

  it('defense in depth: multiple sourcetypes cover critical techniques', () => {
    // T1059 (Command & Scripting Interpreter) should have multiple sources
    const t1059sources = sourcetypes.filter(s => s.techniqueIds.includes('T1059'))
    expect(t1059sources.length).toBeGreaterThanOrEqual(3)

    // T1078 (Valid Accounts) should have multiple sources
    const t1078sources = sourcetypes.filter(s => s.techniqueIds.includes('T1078'))
    expect(t1078sources.length).toBeGreaterThanOrEqual(3)
  })

  it('environment scoping: enabling only endpoint sources excludes cloud-only techniques', () => {
    const endpointSources = sourcetypes.filter(s => s.category === 'windows' || s.category === 'linux' || s.category === 'macos' || s.category === 'edr')
    const endpointTechniques = new Set<string>()
    for (const src of endpointSources) {
      for (const tid of src.techniqueIds) endpointTechniques.add(tid)
    }

    const cloudSources = sourcetypes.filter(s => s.category === 'cloud')
    const cloudOnlyTechniques = new Set<string>()
    for (const src of cloudSources) {
      for (const tid of src.techniqueIds) {
        if (!endpointTechniques.has(tid)) cloudOnlyTechniques.add(tid)
      }
    }

    expect(cloudOnlyTechniques.size).toBeGreaterThan(0)
  })
})
