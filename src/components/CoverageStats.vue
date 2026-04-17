<script setup lang="ts">
import { computed } from 'vue'
import type { Sourcetype } from '../data/sourcetypes'

const props = defineProps<{
  activeSources: Sourcetype[]
  inScopeIds: Set<string>
}>()

const coveredIds = computed(() => {
  const covered = new Set<string>()
  for (const src of props.activeSources) {
    for (const tid of src.techniqueIds) {
      if (props.inScopeIds.has(tid)) {
        covered.add(tid)
      }
    }
  }
  return covered
})

const total = computed(() => props.inScopeIds.size)
const covered = computed(() => coveredIds.value.size)
const pct = computed(() => total.value > 0 ? Math.round((covered.value / total.value) * 100) : 0)
</script>

<template>
  <div class="flex flex-col items-center gap-1">
    <span class="font-mono font-bold text-lg" :class="pct < 33 ? 'text-red-400' : pct < 66 ? 'text-amber-400' : 'text-emerald-400'">
      {{ pct }}%
    </span>
    <div class="w-48 lg:w-96 h-2 bg-zinc-800 rounded-full overflow-hidden">
      <div
        class="h-full rounded-full transition-all duration-300"
        :style="{
          width: `${pct}%`,
          backgroundColor: pct < 33 ? '#ef4444' : pct < 66 ? '#f59e0b' : '#22c55e'
        }"
      />
    </div>
    <div class="flex items-center gap-4 text-xs mt-0.5">
      <div class="flex items-center gap-1.5">
        <span class="text-zinc-500">In Scope</span>
        <span class="font-mono text-zinc-400">{{ total }}</span>
      </div>
    </div>
  </div>
</template>
