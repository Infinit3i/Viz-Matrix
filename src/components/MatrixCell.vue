<script setup lang="ts">
import { computed } from 'vue'
import type { Sourcetype } from '../data/sourcetypes'
import { sourcetypes as allSourcetypes } from '../data/sourcetypes'

const props = defineProps<{
  techniqueId: string
  techniqueName: string
  activeSources: Sourcetype[]
  inScope: boolean
  highlightedSourceId: string | null
  activeOs: string[]
  isCrownJewel: boolean
  aptInfo?: { score: number; color: string; comment: string }
}>()

const emit = defineEmits<{
  hover: [techniqueId: string, sources: Sourcetype[]]
  leave: []
}>()

const matchingSources = computed(() =>
  props.activeSources.filter(s => s.techniqueIds.includes(props.techniqueId))
)

const coverageCount = computed(() => {
  const sourceCount = matchingSources.value.length
  // Subtract the number of active APT groups targeting this technique
  const aptThreatCount = props.aptInfo ? 1 : 0 // Each aptInfo represents one active APT group
  return Math.max(0, sourceCount - aptThreatCount) // Don't go below 0
})

// Map OS environment values → sourcetype categories that provide coverage for that OS
const osCategoryMap: Record<string, string[]> = {
  windows: ['windows', 'edr', 'network', 'identity', 'cloud', 'email', 'application', 'cicd', 'saas'],
  linux: ['linux', 'edr', 'network', 'identity', 'cloud', 'application', 'cicd', 'saas'],
  macos: ['macos', 'edr', 'network', 'identity', 'cloud', 'application', 'cicd', 'saas'],
}

// Which OS environments have this technique in scope?
const relevantOs = computed(() =>
  props.activeOs.filter(os => {
    const cats = osCategoryMap[os] || []
    return allSourcetypes.some(
      s => cats.includes(s.category) && s.techniqueIds.includes(props.techniqueId)
    )
  })
)

// Per-OS coverage: does any active sourcetype in that OS's categories cover this technique?
const osCoverage = computed(() =>
  relevantOs.value.map(os => {
    const cats = osCategoryMap[os] || []
    const covered = props.activeSources.some(
      s => cats.includes(s.category) && s.techniqueIds.includes(props.techniqueId)
    )
    return { os, covered }
  })
)

const hasMultipleOs = computed(() => relevantOs.value.length > 1)

// Overall color when NOT doing per-OS split (single OS or non-OS technique)
const cellColor = computed(() => {
  // APT layer overrides normal coloring
  if (props.aptInfo) {
    return props.aptInfo.color + 'CC' // Add some transparency
  }

  if (!props.inScope) return 'rgba(39, 39, 42, 0.2)'
  if (coverageCount.value === 0) return 'rgba(220, 50, 40, 0.85)'
  if (coverageCount.value === 1) return 'rgba(210, 180, 40, 0.85)'
  return 'rgba(30, 200, 80, 0.9)'
})

function segmentColor(covered: boolean): string {
  // APT layer overrides for multi-OS segments
  if (props.aptInfo && covered) {
    return props.aptInfo.color + 'CC' // Add some transparency
  }

  if (!covered) return 'rgba(220, 50, 40, 0.85)'
  const count = coverageCount.value
  if (count === 1) return 'rgba(210, 180, 40, 0.85)'
  return 'rgba(30, 200, 80, 0.9)'
}

const osLabels: Record<string, string> = { windows: 'W', linux: 'L', macos: 'M' }

const isBlindSpot = computed(() => props.inScope && coverageCount.value === 0)

const isHighlighted = computed(() => {
  if (!props.highlightedSourceId) return false
  const src = allSourcetypes.find(s => s.id === props.highlightedSourceId)
  return src ? src.techniqueIds.includes(props.techniqueId) : false
})

const highlightColor = computed(() => {
  if (!isHighlighted.value || !props.highlightedSourceId) return null
  const src = allSourcetypes.find(s => s.id === props.highlightedSourceId)
  return src?.color ?? null
})

const mitreUrl = computed(() => {
  const base = 'https://attack.mitre.org/techniques/'
  const parts = props.techniqueId.split('.')
  if (parts.length === 2) return `${base}${parts[0]}/${parts[1]}/`
  return `${base}${parts[0]}/`
})

const isCrownBlindSpot = computed(() => isBlindSpot.value && props.isCrownJewel)

const statusLabel = computed(() => {
  const aptPrefix = props.aptInfo ? 'APT TECHNIQUE — ' : ''
  const jewel = props.isCrownJewel ? ' [CROWN JEWEL]' : ''
  const aptComment = props.aptInfo?.comment ? `\nAPT Info: ${props.aptInfo.comment}` : ''

  if (!props.inScope) return `${aptPrefix}N/A${aptComment}`
  if (coverageCount.value === 0) return `${aptPrefix}Blind Spot${jewel}${aptComment}`
  if (hasMultipleOs.value) {
    const missing = osCoverage.value.filter(o => !o.covered).map(o => o.os)
    if (missing.length > 0) return `${aptPrefix}Partial — missing: ${missing.join(', ')}${aptComment}`
  }
  if (coverageCount.value === 1) return `${aptPrefix}${coverageCount.value} source — single point of failure${aptComment}`
  return `${aptPrefix}${coverageCount.value} sources${aptComment}`
})

function onMouseEnter() {
  emit('hover', props.techniqueId, matchingSources.value)
}

function onClick() {
  window.open(mitreUrl.value, '_blank', 'noopener')
}
</script>

<template>
  <div
    class="cell-hover relative rounded-sm overflow-hidden h-[14px] lg:h-[28px] cursor-pointer"
    style="transition: background-color 1s ease-out, border-color 1s ease-out, outline-color 1s ease-out;"
    :style="{
      width: '100%',
      minWidth: '8px',
      outline: isHighlighted ? `2px solid ${highlightColor}`
        : isCrownBlindSpot ? '2px solid rgba(245, 158, 11, 0.8)'
        : isCrownJewel && inScope ? '1px solid rgba(245, 158, 11, 0.35)'
        : 'none',
      outlineOffset: '-1px',
      boxShadow: isHighlighted ? `0 0 8px ${highlightColor}80`
        : isCrownBlindSpot ? '0 0 10px rgba(245, 158, 11, 0.4)'
        : 'none',
      backgroundColor: !hasMultipleOs || !inScope ? cellColor : 'transparent',
    }"
    :title="`${techniqueId}: ${techniqueName}\n${statusLabel}`"
    @mouseenter="onMouseEnter"
    @mouseleave="emit('leave')"
    @click="onClick"
  >
    <!-- Multi-OS split view (conditionally displayed) -->
    <div
      v-show="hasMultipleOs && inScope"
      class="flex flex-col h-full w-full absolute inset-0"
    >
      <div
        v-for="seg in osCoverage"
        :key="seg.os"
        class="flex-1 flex items-center justify-center relative"
        :style="{
          backgroundColor: segmentColor(seg.covered),
          transition: 'background-color 1s ease-out'
        }"
      >
        <span
          v-if="!seg.covered"
          class="text-[6px] font-mono font-bold text-white/70 leading-none"
        >{{ osLabels[seg.os] }}</span>
      </div>
    </div>

    <!-- Single view (always rendered) -->
    <div class="absolute inset-0" :style="{ opacity: hasMultipleOs && inScope ? 0 : 1, transition: 'opacity 1s ease-out' }">
      <!-- Show technique ID if: no sources active, has coverage, OR is in scope (even if red blind spot) -->
      <span
        v-if="activeSources.length === 0 || coverageCount > 0 || inScope"
        class="absolute inset-0 flex items-center justify-center text-[7px] font-mono font-semibold text-white leading-none"
        style="transition: opacity 1s ease-out;"
        :class="isBlindSpot ? 'underline decoration-white/40' : ''"
      >
        {{ techniqueId }}
      </span>

      <!-- Coverage count bubble in top-right corner -->
      <span
        v-if="coverageCount > 0"
        class="absolute top-0.5 right-0.5 bg-white/90 text-zinc-900 text-[6px] font-bold rounded-full w-3 h-3 flex items-center justify-center leading-none shadow-lg border border-white/20 backdrop-blur-sm"
        style="transition: opacity 1s ease-out, transform 1s ease-out;"
        :title="`${coverageCount} sourcetype${coverageCount > 1 ? 's' : ''} detecting this technique`"
      >
        {{ coverageCount }}
      </span>

      <!-- APT indicator (moved to top-left to not conflict with count) -->
      <span
        v-if="aptInfo"
        class="absolute top-0 left-0 text-[6px] text-red-400 leading-none p-[1px]"
        title="APT Technique"
      >
        <i class="fas fa-exclamation-triangle"></i>
      </span>
    </div>
  </div>
</template>
