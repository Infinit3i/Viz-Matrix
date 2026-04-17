<script setup lang="ts">
import { computed } from 'vue'
import { tactics } from '../data/mitreData'
import { sourcetypes, type Sourcetype } from '../data/sourcetypes'

const props = defineProps<{
  activeSources: Sourcetype[]
  inScopeIds: Set<string>
  activeEnvCategories: Set<string>
}>()

const allTechniqueIds = computed(() => {
  const ids = new Set<string>()
  for (const tactic of tactics) {
    for (const tech of tactic.techniques) ids.add(tech.id)
  }
  return ids
})

interface Recommendation {
  sourcetype: Sourcetype
  blindSpotsFilled: number
  singlePointsFixed: number
  newTechniques: string[]
  score: number
}

const recommendations = computed<Recommendation[]>(() => {
  const hasEdr = props.activeSources.some(s => s.category === 'edr')

  const activeOsList = [...props.activeEnvCategories].filter(c => ['windows', 'linux', 'macos'].includes(c))

  const inactive = sourcetypes.filter(s => {
    if (props.activeSources.some(a => a.id === s.id)) return false
    if (hasEdr && s.category === 'edr') return false
    // Only recommend sourcetypes whose category is in the user's environment
    if (props.activeEnvCategories.size > 0 && !props.activeEnvCategories.has(s.category)) return false
    // If sourcetype declares specific platforms, at least one must be in the user's active OS list
    if (s.platforms && s.platforms.length > 0 && activeOsList.length > 0) {
      if (!s.platforms.some(p => activeOsList.includes(p))) return false
    }
    return true
  })

  return inactive
    .map(src => {
      let blindSpotsFilled = 0
      let singlePointsFixed = 0
      const newTechniques: string[] = []

      for (const tid of src.techniqueIds) {
        if (!allTechniqueIds.value.has(tid)) continue

        const currentCount = props.activeSources.filter(s => s.techniqueIds.includes(tid)).length
        const isInScope = props.inScopeIds.has(tid)

        if (isInScope && currentCount === 0) {
          blindSpotsFilled++
          newTechniques.push(tid)
        } else if (isInScope && currentCount === 1) {
          singlePointsFixed++
        } else if (!isInScope) {
          // This would bring new techniques into scope
          newTechniques.push(tid)
        }
      }

      // Score: blind spots matter most, then single-point fixes, then new scope
      const score = blindSpotsFilled * 3 + singlePointsFixed * 2 + newTechniques.length

      return { sourcetype: src, blindSpotsFilled, singlePointsFixed, newTechniques, score }
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
})

const emit = defineEmits<{
  enable: [id: string]
  hoverSource: [id: string]
  leaveSource: []
}>()
</script>

<template>
  <div v-if="recommendations.length > 0" class="flex items-start gap-3 text-xs">
    <span class="text-zinc-500 shrink-0 mt-0.5">Recommended:</span>
    <div class="flex flex-wrap gap-2">
      <button
        v-for="rec in recommendations"
        :key="rec.sourcetype.id"
        class="flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-800/80 border border-zinc-700/50 hover:border-zinc-600 hover:bg-zinc-700/60 transition-all group"
        @click="emit('enable', rec.sourcetype.id)"
        @mouseenter="emit('hoverSource', rec.sourcetype.id)"
        @mouseleave="emit('leaveSource')"
      >
        <span
          class="w-2 h-2 rounded-full shrink-0"
          :style="{ backgroundColor: rec.sourcetype.color }"
        />
        <span class="text-zinc-300 group-hover:text-zinc-100">{{ rec.sourcetype.name }}</span>
        <span class="flex items-center gap-1.5 ml-1 text-[10px] font-mono">
          <span v-if="rec.blindSpotsFilled > 0" class="text-red-400" :title="`Fills ${rec.blindSpotsFilled} blind spots`">
            +{{ rec.blindSpotsFilled }} blind
          </span>
          <span v-if="rec.singlePointsFixed > 0" class="text-amber-400" :title="`Adds depth to ${rec.singlePointsFixed} single-source techniques`">
            +{{ rec.singlePointsFixed }} depth
          </span>
        </span>
      </button>
    </div>
  </div>
  <div v-else-if="activeSources.length > 0" class="text-xs text-zinc-600 italic">
    All available sourcetypes are active
  </div>
</template>
