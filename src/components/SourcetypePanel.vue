<script setup lang="ts">
import { ref } from 'vue'
import { type Sourcetype, categoryLabels, type SourceCategory } from '../data/sourcetypes'

const props = defineProps<{
  sourcetypes: Sourcetype[]
  activeIds: Set<string>
}>()

const emit = defineEmits<{
  toggle: [id: string]
  enableAll: []
  disableAll: []
  enableCategory: [category: SourceCategory]
  disableCategory: [category: SourceCategory]
  hoverSource: [id: string]
  leaveSource: []
}>()

const categories = ['windows', 'linux', 'macos', 'edr', 'network', 'identity', 'cloud', 'email', 'application', 'cicd', 'saas'] as SourceCategory[]
const collapsed = ref<Set<SourceCategory>>(new Set(['linux', 'macos', 'edr', 'cloud', 'email', 'application', 'cicd', 'saas']))

function toggleCollapse(cat: SourceCategory) {
  const next = new Set(collapsed.value)
  if (next.has(cat)) next.delete(cat)
  else next.add(cat)
  collapsed.value = next
}

function expandCategory(cat: SourceCategory) {
  const next = new Set(collapsed.value)
  next.delete(cat)
  collapsed.value = next
}

defineExpose({ expandCategory })

function getByCategory(cat: SourceCategory) {
  return props.sourcetypes.filter(s => s.category === cat)
}

</script>

<template>
  <div class="flex flex-col gap-1 h-full">
    <div class="flex items-center justify-between mb-2">
      <h2 class="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Sourcetypes</h2>
      <div class="flex gap-1.5">
        <button
          class="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
          @click="emit('enableAll')"
        >All</button>
        <button
          class="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
          @click="emit('disableAll')"
        >None</button>
      </div>
    </div>

    <div class="flex flex-col gap-3 overflow-y-auto pr-1 flex-1">
      <div v-for="cat in categories" :key="cat">
        <div class="flex items-center gap-2 mb-1">
          <button
            class="flex items-center gap-2 flex-1 text-left group"
            @click="toggleCollapse(cat)"
          >
            <span class="text-[11px] font-mono text-zinc-500 group-hover:text-zinc-200 transition-colors shrink-0">
              {{ collapsed.has(cat) ? '+' : '−' }}
            </span>
            <span class="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 group-hover:text-zinc-300 transition-colors">
              {{ categoryLabels[cat] }}
            </span>
            <span class="flex-1 h-px bg-zinc-800" />
          </button>
        </div>

        <div v-if="!collapsed.has(cat)" class="flex flex-col gap-0.5">
          <button
            v-for="src in getByCategory(cat)"
            :key="src.id"
            class="flex items-center gap-2 px-2 py-1 rounded text-xs transition-all text-left"
            :class="activeIds.has(src.id)
              ? 'bg-zinc-800/80 text-zinc-200'
              : 'text-zinc-600 hover:text-zinc-400'"
            @click="emit('toggle', src.id)"
            @mouseenter="emit('hoverSource', src.id)"
            @mouseleave="emit('leaveSource')"
          >
            <span
              class="w-2.5 h-2.5 rounded-sm shrink-0 transition-opacity"
              :style="{ backgroundColor: src.color }"
              :class="activeIds.has(src.id) ? 'opacity-100' : 'opacity-25'"
            />
            <span class="truncate">{{ src.name }}</span>
            <span class="ml-auto text-[10px] font-mono text-zinc-500">
              {{ src.techniqueIds.length }}
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
