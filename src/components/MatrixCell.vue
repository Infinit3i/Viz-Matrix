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
}>()

const emit = defineEmits<{
  hover: [techniqueId: string, sources: Sourcetype[]]
  leave: []
}>()

const matchingSources = computed(() =>
  props.activeSources.filter(s => s.techniqueIds.includes(props.techniqueId))
)

const coverageCount = computed(() => matchingSources.value.length)

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
  if (!props.inScope) return 'rgba(39, 39, 42, 0.2)'
  if (coverageCount.value === 0) return 'rgba(220, 50, 40, 0.85)'
  if (coverageCount.value === 1) return 'rgba(210, 180, 40, 0.85)'
  return 'rgba(30, 200, 80, 0.9)'
})

function segmentColor(covered: boolean): string {
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
  if (!props.inScope) return 'N/A'
  const jewel = props.isCrownJewel ? ' [CROWN JEWEL]' : ''
  if (coverageCount.value === 0) return `Blind Spot${jewel}`
  if (hasMultipleOs.value) {
    const missing = osCoverage.value.filter(o => !o.covered).map(o => o.os)
    if (missing.length > 0) return `Partial — missing: ${missing.join(', ')}`
  }
  if (coverageCount.value === 1) return `${coverageCount.value} source — single point of failure`
  return `${coverageCount.value} sources`
})

function onMouseEnter() {
  emit('hover', props.techniqueId, matchingSources.value)
}

function onClick() {
  if (isBlindSpot.value) {
    window.open(mitreUrl.value, '_blank', 'noopener')
  }
}
</script>

<template>
  <div
    class="cell-hover relative rounded-sm overflow-hidden"
    :class="isBlindSpot ? 'cursor-pointer' : 'cursor-default'"
    :style="{
      width: '100%',
      height: '28px',
      minWidth: '12px',
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
    <!-- Multi-OS split view -->
    <template v-if="hasMultipleOs && inScope">
      <div class="flex flex-col h-full w-full">
        <div
          v-for="seg in osCoverage"
          :key="seg.os"
          class="flex-1 flex items-center justify-center relative"
          :style="{ backgroundColor: segmentColor(seg.covered) }"
        >
          <span
            v-if="!seg.covered"
            class="text-[6px] font-mono font-bold text-white/70 leading-none"
          >{{ osLabels[seg.os] }}</span>
        </div>
      </div>
    </template>

    <!-- Single view -->
    <template v-else>
      <span
        v-if="isBlindSpot"
        class="absolute inset-0 flex items-center justify-center text-[7px] font-mono font-semibold text-white leading-none underline decoration-white/40"
      >
        {{ techniqueId }}
      </span>
      <span
        v-else-if="coverageCount > 0"
        class="absolute inset-0 flex items-center justify-center text-[8px] font-mono font-medium text-white/80 leading-none"
      >
        {{ coverageCount }}
      </span>
    </template>
  </div>
</template>
