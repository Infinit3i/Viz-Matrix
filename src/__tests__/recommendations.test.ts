import { describe, it, expect } from 'vitest'
import { sourcetypes } from '../data/sourcetypes'

// Replicate the recommendation logic for testing
function getRecommendations(
  activeSources: typeof sourcetypes,
  inScopeIds: Set<string>,
  activeEnvCategories: Set<string>,
) {
  const hasEdr = activeSources.some(s => s.category === 'edr')
  const activeOsList = [...activeEnvCategories].filter(c => ['windows', 'linux', 'macos'].includes(c))

  const inactive = sourcetypes.filter(s => {
    if (activeSources.some(a => a.id === s.id)) return false
    if (hasEdr && s.category === 'edr') return false
    if (activeEnvCategories.size > 0 && !activeEnvCategories.has(s.category)) return false
    if (s.platforms && s.platforms.length > 0 && activeOsList.length > 0) {
      if (!s.platforms.some(p => activeOsList.includes(p))) return false
    }
    return true
  })

  return inactive.map(src => {
    let blindSpotsFilled = 0
    let singlePointsFixed = 0
    for (const tid of src.techniqueIds) {
      const currentCount = activeSources.filter(s => s.techniqueIds.includes(tid)).length
      const isInScope = inScopeIds.has(tid)
      if (isInScope && currentCount === 0) blindSpotsFilled++
      else if (isInScope && currentCount === 1) singlePointsFixed++
    }
    const score = blindSpotsFilled * 3 + singlePointsFixed * 2
    return { sourcetype: src, blindSpotsFilled, singlePointsFixed, score }
  })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
}

function getInScopeIds(sourceIds: string[]): Set<string> {
  const ids = new Set<string>()
  for (const s of sourcetypes) {
    if (sourceIds.includes(s.id)) {
      for (const tid of s.techniqueIds) ids.add(tid)
    }
  }
  return ids
}

describe('recommendations', () => {
  it('does not recommend Windows sources when only Linux is selected', () => {
    const envCats = new Set(['linux', 'edr'])
    const linuxSources = sourcetypes.filter(s => s.id === 'linux-auditd')
    const inScope = getInScopeIds(linuxSources.map(s => s.id))
    const recs = getRecommendations(linuxSources, inScope, envCats)

    for (const rec of recs) {
      expect(rec.sourcetype.category, `${rec.sourcetype.name} should not be recommended for Linux-only`).not.toBe('windows')
    }
  })

  it('does not recommend Defender for Endpoint on Linux-only', () => {
    const envCats = new Set(['linux', 'edr'])
    const inScope = getInScopeIds(['linux-auditd'])
    const recs = getRecommendations(
      sourcetypes.filter(s => s.id === 'linux-auditd'),
      inScope,
      envCats,
    )
    const defenderRec = recs.find(r => r.sourcetype.id === 'edr-defender')
    expect(defenderRec, 'Defender should not be recommended for Linux').toBeUndefined()
  })

  it('does recommend CrowdStrike on Linux', () => {
    const envCats = new Set(['linux', 'edr'])
    // CrowdStrike supports linux, so it should not be filtered out
    const allInactive = sourcetypes.filter(s => {
      if (s.id === 'linux-auditd') return false
      if (envCats.size > 0 && !envCats.has(s.category)) return false
      if (s.platforms && s.platforms.length > 0) {
        if (!s.platforms.includes('linux')) return false
      }
      return true
    })
    const csInList = allInactive.find(s => s.id === 'edr-crowdstrike')
    expect(csInList, 'CrowdStrike should be eligible for Linux').toBeTruthy()
    // Defender should NOT be in the list
    const defInList = allInactive.find(s => s.id === 'edr-defender')
    expect(defInList, 'Defender should not be eligible for Linux').toBeUndefined()
  })

  it('does not recommend a second EDR if one is already active', () => {
    const envCats = new Set(['windows', 'edr'])
    const active = sourcetypes.filter(s => s.id === 'edr-crowdstrike')
    const inScope = getInScopeIds(active.map(s => s.id))
    const recs = getRecommendations(active, inScope, envCats)

    for (const rec of recs) {
      expect(rec.sourcetype.category, `${rec.sourcetype.name} is EDR but one is already active`).not.toBe('edr')
    }
  })

  it('does not recommend cloud sources when no cloud is selected', () => {
    const envCats = new Set(['windows', 'edr'])
    const active = sourcetypes.filter(s => s.id === 'win-security')
    const inScope = getInScopeIds(active.map(s => s.id))
    const recs = getRecommendations(active, inScope, envCats)

    for (const rec of recs) {
      expect(rec.sourcetype.category, `${rec.sourcetype.name} is cloud but no cloud selected`).not.toBe('cloud')
    }
  })

  it('does not recommend email sources when no email is selected', () => {
    const envCats = new Set(['linux', 'edr'])
    const active = sourcetypes.filter(s => s.id === 'linux-auditd')
    const inScope = getInScopeIds(active.map(s => s.id))
    const recs = getRecommendations(active, inScope, envCats)

    for (const rec of recs) {
      expect(rec.sourcetype.category, `${rec.sourcetype.name} is email but no email selected`).not.toBe('email')
    }
  })

  it('does not recommend SaaS sources when no SaaS is selected', () => {
    const envCats = new Set(['windows', 'edr', 'network'])
    const active = sourcetypes.filter(s => s.id === 'win-security')
    const inScope = getInScopeIds(active.map(s => s.id))
    const recs = getRecommendations(active, inScope, envCats)

    for (const rec of recs) {
      expect(rec.sourcetype.category, `${rec.sourcetype.name} is saas but no saas selected`).not.toBe('saas')
    }
  })

  it('returns empty when all relevant sourcetypes are active', () => {
    const envCats = new Set(['linux', 'edr'])
    const allLinux = sourcetypes.filter(s => s.category === 'linux' || (s.category === 'edr' && s.platforms?.includes('linux')))
    const inScope = getInScopeIds(allLinux.map(s => s.id))
    const recs = getRecommendations(allLinux, inScope, envCats)

    expect(recs.length).toBe(0)
  })
})
