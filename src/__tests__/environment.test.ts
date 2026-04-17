import { describe, it, expect } from 'vitest'
import { sourcetypes } from '../data/sourcetypes'
import { tactics } from '../data/mitreData'

describe('environment scoping', () => {
  const allTechniqueIds = new Set(
    tactics.flatMap(t => t.techniques.map(tech => tech.id))
  )

  function getInScopeIds(relevantSourceIds: string[]): Set<string> {
    const ids = new Set<string>()
    for (const s of sourcetypes) {
      if (relevantSourceIds.includes(s.id)) {
        for (const tid of s.techniqueIds) {
          if (allTechniqueIds.has(tid)) ids.add(tid)
        }
      }
    }
    return ids
  }

  it('windows and linux scopes are both substantial', () => {
    const winSources = sourcetypes.filter(s => s.category === 'windows' || (s.category === 'edr' && s.platforms?.includes('windows')))
    const linSources = sourcetypes.filter(s => s.category === 'linux' || (s.category === 'edr' && s.platforms?.includes('linux')))

    const winScope = getInScopeIds(winSources.map(s => s.id))
    const linScope = getInScopeIds(linSources.map(s => s.id))

    expect(winScope.size).toBeGreaterThan(50)
    expect(linScope.size).toBeGreaterThan(50)
  })

  it('adding cloud expands scope beyond endpoint-only', () => {
    const endpointOnly = sourcetypes.filter(s => s.category === 'windows')
    const withCloud = [...endpointOnly, ...sourcetypes.filter(s => s.category === 'cloud')]

    const endpointScope = getInScopeIds(endpointOnly.map(s => s.id))
    const combinedScope = getInScopeIds(withCloud.map(s => s.id))

    expect(combinedScope.size).toBeGreaterThan(endpointScope.size)
  })

  it('cloud-only techniques exist that endpoints cannot see', () => {
    const endpointIds = new Set<string>()
    for (const s of sourcetypes.filter(s => ['windows', 'linux', 'macos', 'edr'].includes(s.category))) {
      for (const tid of s.techniqueIds) endpointIds.add(tid)
    }

    const cloudOnlyIds = new Set<string>()
    for (const s of sourcetypes.filter(s => s.category === 'cloud')) {
      for (const tid of s.techniqueIds) {
        if (!endpointIds.has(tid) && allTechniqueIds.has(tid)) cloudOnlyIds.add(tid)
      }
    }

    expect(cloudOnlyIds.size).toBeGreaterThan(0)
  })

  it('email scope includes phishing techniques', () => {
    const emailSources = sourcetypes.filter(s => s.category === 'email')
    const emailScope = getInScopeIds(emailSources.map(s => s.id))

    expect(emailScope.has('T1566')).toBe(true)
  })

  it('cicd scope includes supply chain techniques', () => {
    const cicdSources = sourcetypes.filter(s => s.category === 'cicd')
    const cicdScope = getInScopeIds(cicdSources.map(s => s.id))

    expect(cicdScope.has('T1195')).toBe(true)
  })

  it('saas scope includes credential techniques', () => {
    const saasSources = sourcetypes.filter(s => s.category === 'saas')
    const saasScope = getInScopeIds(saasSources.map(s => s.id))

    expect(saasScope.has('T1078')).toBe(true)
    expect(saasScope.has('T1528')).toBe(true)
  })

  it('per-OS coverage: sysmon covers windows T1059 but not linux T1059', () => {
    const sysmon = sourcetypes.find(s => s.id === 'sysmon')!
    expect(sysmon.category).toBe('windows')
    expect(sysmon.techniqueIds).toContain('T1059')

    // Sysmon for Linux is a separate sourcetype
    const linuxSysmon = sourcetypes.find(s => s.id === 'linux-sysmon')!
    expect(linuxSysmon.category).toBe('linux')
    expect(linuxSysmon.techniqueIds).toContain('T1059')

    // They are different sourcetypes in different categories
    expect(sysmon.category).not.toBe(linuxSysmon.category)
  })

  it('selecting no environment results in empty scope', () => {
    const scope = getInScopeIds([])
    expect(scope.size).toBe(0)
  })
})
