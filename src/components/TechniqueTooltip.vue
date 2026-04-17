<script setup lang="ts">
import type { Sourcetype } from '../data/sourcetypes'

defineProps<{
  techniqueId: string
  techniqueName: string
  sources: Sourcetype[]
  totalActive: number
  inScope: boolean
  x: number
  y: number
}>()
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed z-50 pointer-events-none"
      :style="{
        left: `${x + 16}px`,
        top: `${y - 8}px`,
      }"
    >
      <div class="bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl p-3 min-w-[220px] max-w-[300px]">
        <div class="flex items-baseline gap-2 mb-1.5">
          <span class="font-mono text-[11px] text-zinc-400">{{ techniqueId }}</span>
        </div>
        <div class="text-sm font-medium text-zinc-100 mb-2">{{ techniqueName }}</div>

        <template v-if="inScope">
          <div class="flex items-center gap-2 mb-2">
            <div class="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all"
                :style="{
                  width: totalActive > 0 ? `${(sources.length / totalActive) * 100}%` : '0%',
                  backgroundColor: sources.length === 0 ? '#ef4444'
                    : sources.length / totalActive < 0.33 ? '#f59e0b'
                    : '#22c55e'
                }"
              />
            </div>
            <span class="text-[11px] font-mono text-zinc-400">
              {{ sources.length }}/{{ totalActive }}
            </span>
          </div>

          <div v-if="sources.length > 0" class="flex flex-col gap-0.5">
            <div
              v-for="src in sources"
              :key="src.id"
              class="flex items-center gap-1.5 text-[11px] text-zinc-300"
            >
              <span class="w-1.5 h-1.5 rounded-full shrink-0" :style="{ backgroundColor: src.color }" />
              <span class="truncate">{{ src.name }}</span>
            </div>
          </div>
          <div v-else class="text-[11px] text-red-400 font-medium">
            No visibility — blind spot
          </div>
        </template>

        <div v-else class="text-[11px] text-zinc-500 italic">
          Not applicable — no active sources cover this technique
        </div>
      </div>
    </div>
  </Teleport>
</template>
