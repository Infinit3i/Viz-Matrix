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
}>()

const emit = defineEmits<{
  hover: [techniqueId: string, sources: Sourcetype[]]
  leave: []
}>()

const matchingSources = computed(() =>
  props.activeSources.filter(s => s.techniqueIds.includes(props.techniqueId))
)

const coverageCount = computed(() => matchingSources.value.length)

// 0 = blind spot (red) — no visibility
// 1 = covered (yellow) — single source, not yet defense in depth
// 2+ = defense in depth (green) — multiple overlapping sources
const cellColor = computed(() => {
  if (!props.inScope) return 'rgba(39, 39, 42, 0.2)'

  if (coverageCount.value === 0) return 'rgba(220, 50, 40, 0.85)'
  if (coverageCount.value === 1) return 'rgba(210, 180, 40, 0.85)'
  return 'rgba(30, 200, 80, 0.9)'
})

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

const statusLabel = computed(() => {
  if (!props.inScope) return 'N/A'
  if (coverageCount.value === 0) return 'Blind Spot'
  if (coverageCount.value === 1) return `${coverageCount.value} source — single point of failure`
  return `${coverageCount.value} sources`
})

const isBlindSpot = computed(() => props.inScope && coverageCount.value === 0)

// MITRE ATT&CK URL: sub-techniques use /xxx/ suffix on parent
const mitreUrl = computed(() => {
  const base = 'https://attack.mitre.org/techniques/'
  const parts = props.techniqueId.split('.')
  if (parts.length === 2) {
    return `${base}${parts[0]}/${parts[1]}/`
  }
  return `${base}${parts[0]}/`
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
    class="cell-hover relative rounded-sm"
    :class="isBlindSpot ? 'cursor-pointer' : 'cursor-default'"
    :style="{
      backgroundColor: cellColor,
      width: '100%',
      height: '28px',
      minWidth: '12px',
      outline: isHighlighted ? `2px solid ${highlightColor}` : 'none',
      outlineOffset: '-1px',
      boxShadow: isHighlighted ? `0 0 8px ${highlightColor}80` : 'none',
    }"
    :title="`${techniqueId}: ${techniqueName}\n${statusLabel}`"
    @mouseenter="onMouseEnter"
    @mouseleave="emit('leave')"
    @click="onClick"
  >
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
  </div>
</template>
