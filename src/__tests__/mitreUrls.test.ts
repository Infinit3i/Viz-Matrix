import { describe, it, expect } from 'vitest'
import { tactics } from '../data/mitreData'

describe('MITRE ATT&CK URLs', () => {
  function getMitreUrl(techniqueId: string): string {
    const base = 'https://attack.mitre.org/techniques/'
    const parts = techniqueId.split('.')
    if (parts.length === 2) return `${base}${parts[0]}/${parts[1]}/`
    return `${base}${parts[0]}/`
  }

  it('parent techniques generate correct URLs', () => {
    expect(getMitreUrl('T1059')).toBe('https://attack.mitre.org/techniques/T1059/')
    expect(getMitreUrl('T1078')).toBe('https://attack.mitre.org/techniques/T1078/')
  })

  it('sub-techniques generate correct URLs', () => {
    expect(getMitreUrl('T1059.001')).toBe('https://attack.mitre.org/techniques/T1059/001/')
    expect(getMitreUrl('T1078.004')).toBe('https://attack.mitre.org/techniques/T1078/004/')
  })

  it('every technique id produces a valid URL pattern', () => {
    for (const tactic of tactics) {
      for (const tech of tactic.techniques) {
        const url = getMitreUrl(tech.id)
        expect(url).toMatch(/^https:\/\/attack\.mitre\.org\/techniques\/T\d{4}\/((\d{3}\/)?$)/)
      }
    }
  })
})
