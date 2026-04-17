import { describe, it, expect } from 'vitest'
import { sourcetypes } from '../data/sourcetypes'

describe('platform assignments', () => {
  it('all EDR sourcetypes have platforms defined', () => {
    const edrs = sourcetypes.filter(s => s.category === 'edr')
    for (const edr of edrs) {
      expect(edr.platforms, `${edr.name} missing platforms`).toBeDefined()
      expect(edr.platforms!.length, `${edr.name} has empty platforms`).toBeGreaterThan(0)
    }
  })

  it('Defender only supports Windows', () => {
    const defender = sourcetypes.find(s => s.id === 'edr-defender')!
    expect(defender.platforms).toEqual(['windows'])
  })

  it('CrowdStrike supports all three OSes', () => {
    const cs = sourcetypes.find(s => s.id === 'edr-crowdstrike')!
    expect(cs.platforms).toContain('windows')
    expect(cs.platforms).toContain('linux')
    expect(cs.platforms).toContain('macos')
  })

  it('Carbon Black does not support macOS', () => {
    const cb = sourcetypes.find(s => s.id === 'edr-carbonblack')!
    expect(cb.platforms).toContain('windows')
    expect(cb.platforms).toContain('linux')
    expect(cb.platforms).not.toContain('macos')
  })

  it('Windows sourcetypes are in windows category', () => {
    const winSources = sourcetypes.filter(s => s.category === 'windows')
    expect(winSources.length).toBeGreaterThanOrEqual(3)
    const names = winSources.map(s => s.id)
    expect(names).toContain('win-security')
    expect(names).toContain('sysmon')
    expect(names).toContain('win-powershell')
  })

  it('Linux sourcetypes are in linux category', () => {
    const linSources = sourcetypes.filter(s => s.category === 'linux')
    expect(linSources.length).toBeGreaterThanOrEqual(2)
    const names = linSources.map(s => s.id)
    expect(names).toContain('linux-auditd')
    expect(names).toContain('linux-sysmon')
  })

  it('macOS sourcetypes are in macos category', () => {
    const macSources = sourcetypes.filter(s => s.category === 'macos')
    expect(macSources.length).toBeGreaterThanOrEqual(2)
    const names = macSources.map(s => s.id)
    expect(names).toContain('macos-unified')
    expect(names).toContain('macos-esf')
  })

  it('non-OS sourcetypes do not have platforms set', () => {
    const nonOs = sourcetypes.filter(s => !['windows', 'linux', 'macos', 'edr'].includes(s.category))
    for (const src of nonOs) {
      expect(src.platforms, `${src.name} (${src.category}) should not have platforms`).toBeUndefined()
    }
  })
})
