<script setup lang="ts">
import { ref, computed } from 'vue'

export interface AptGroup {
  id: string
  name: string
  description: string
  threatLevel: 'high' | 'medium' | 'low' | 'mixed'
  techniqueCount: number
  techniques: Map<string, { score: number; color: string; comment: string }>
  layerColors: string[]
  relevantTechniqueCount?: number
  relevancyScore?: number
  relevantTechniques?: Map<string, any>
}

const props = defineProps<{
  aptGroups: AptGroup[]
  activeIds: Set<string>
  totalGroups: number
}>()

const emit = defineEmits<{
  toggle: [id: string]
  enableAll: []
  disableAll: []
  hoverApt: [id: string]
  leaveApt: []
  renameApt: [id: string, newName: string]
  deleteApt: [id: string]
}>()

const searchQuery = ref('')
const editingId = ref<string | null>(null)
const editingName = ref('')

const filteredAptGroups = computed(() =>
  props.aptGroups.filter(apt =>
    apt.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    apt.description.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
)

const threatLevelColors = {
  high: 'text-red-400',
  medium: 'text-orange-400',
  low: 'text-yellow-400',
  mixed: 'text-purple-400'
}

const threatLevelIcons = {
  high: 'fas fa-skull',
  medium: 'fas fa-exclamation-triangle',
  low: 'fas fa-info-circle',
  mixed: 'fas fa-random'
}

function getThreatIcon(level: AptGroup['threatLevel']): string {
  return threatLevelIcons[level]
}

function getThreatColor(level: AptGroup['threatLevel']): string {
  return threatLevelColors[level]
}

function startEditing(apt: AptGroup) {
  editingId.value = apt.id
  editingName.value = apt.name
}

function saveEdit() {
  if (editingId.value && editingName.value.trim()) {
    emit('renameApt', editingId.value, editingName.value.trim())
  }
  cancelEdit()
}

function cancelEdit() {
  editingId.value = null
  editingName.value = ''
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    saveEdit()
  } else if (event.key === 'Escape') {
    cancelEdit()
  }
}
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="shrink-0 mb-4">
      <div class="flex items-center gap-2 mb-3">
        <i class="fas fa-user-secret text-red-400"></i>
        <h2 class="text-sm font-semibold text-zinc-300">APT Groups</h2>
      </div>

      <!-- Search -->
      <div class="relative mb-3">
        <i class="fas fa-search absolute left-2 top-1/2 transform -translate-y-1/2 text-zinc-500 text-xs"></i>
        <input
          v-model="searchQuery"
          placeholder="Search APT groups..."
          class="w-full pl-7 pr-3 py-1.5 text-xs bg-zinc-800 border border-zinc-700 rounded text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
        />
      </div>

      <!-- Controls -->
      <div class="flex gap-1">
        <button
          @click="emit('enableAll')"
          class="flex-1 px-2 py-1 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 rounded transition-colors"
          title="Enable All"
        >
          <i class="fas fa-check-double mr-1"></i>All
        </button>
        <button
          @click="emit('disableAll')"
          class="flex-1 px-2 py-1 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 rounded transition-colors"
          title="Disable All"
        >
          <i class="fas fa-times mr-1"></i>None
        </button>
      </div>
    </div>

    <!-- APT Groups List -->
    <div class="flex-1 overflow-y-auto space-y-2">
      <div v-if="filteredAptGroups.length === 0" class="text-xs text-zinc-500 text-center py-4">
        <i class="fas fa-shield-alt text-zinc-600 text-lg mb-2 block"></i>
        No relevant APT threats
        <br>
        <span class="text-zinc-600 mt-1 block">Configure your infrastructure to see applicable threats</span>
      </div>

      <div
        v-for="apt in filteredAptGroups"
        :key="apt.id"
        class="group p-2 border border-zinc-800 rounded cursor-pointer transition-all"
        :class="{
          'bg-zinc-800 border-zinc-700': activeIds.has(apt.id),
          'bg-zinc-900 hover:bg-zinc-850': !activeIds.has(apt.id)
        }"
        @click="emit('toggle', apt.id)"
        @mouseenter="emit('hoverApt', apt.id)"
        @mouseleave="emit('leaveApt')"
      >
        <!-- APT Header -->
        <div class="flex items-start gap-2 mb-1">
          <div class="shrink-0 mt-0.5">
            <input
              type="checkbox"
              :checked="activeIds.has(apt.id)"
              @change.stop="emit('toggle', apt.id)"
              class="w-3 h-3 text-red-500 bg-zinc-800 border-zinc-600 rounded focus:ring-red-500 focus:ring-1"
            />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1 mb-0.5">
              <!-- Editable name -->
              <input
                v-if="editingId === apt.id"
                v-model="editingName"
                @keydown="handleKeydown"
                @blur="saveEdit"
                class="flex-1 text-xs font-medium text-zinc-200 bg-zinc-800 border border-zinc-600 rounded px-1 py-0.5 min-w-0"
                autofocus
              />
              <span v-else class="text-xs font-medium text-zinc-200 truncate">{{ apt.name }}</span>

              <i :class="[getThreatIcon(apt.threatLevel), getThreatColor(apt.threatLevel), 'text-xs']"></i>

              <!-- Edit/Delete buttons -->
              <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  v-if="editingId !== apt.id"
                  @click.stop="startEditing(apt)"
                  class="text-[8px] text-zinc-500 hover:text-zinc-300 p-0.5"
                  title="Rename"
                >
                  <i class="fas fa-edit"></i>
                </button>
                <button
                  @click.stop="emit('deleteApt', apt.id)"
                  class="text-[8px] text-zinc-500 hover:text-red-400 p-0.5"
                  title="Delete"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
            <div class="text-[10px] text-zinc-500 mb-1 line-clamp-2">{{ apt.description }}</div>
            <div class="flex items-center gap-2 text-[10px] text-zinc-400">
              <span>
                <i class="fas fa-crosshairs mr-1"></i>{{ apt.relevantTechniqueCount || 0 }}/{{ apt.techniqueCount }}
              </span>
              <span :class="getThreatColor(apt.threatLevel)" class="uppercase font-mono">
                {{ apt.threatLevel }}
              </span>
              <span class="text-emerald-400 font-mono">
                {{ Math.round((apt.relevancyScore || 0) * 100) }}%
              </span>
            </div>
          </div>
        </div>

        <!-- Color Indicators -->
        <div v-if="apt.layerColors.length > 0" class="flex gap-0.5 mt-2">
          <div
            v-for="color in apt.layerColors.slice(0, 8)"
            :key="color"
            class="w-2 h-2 rounded-sm"
            :style="{ backgroundColor: color }"
            :title="color"
          ></div>
          <span v-if="apt.layerColors.length > 8" class="text-[8px] text-zinc-500 ml-1">
            +{{ apt.layerColors.length - 8 }}
          </span>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="shrink-0 mt-3 pt-3 border-t border-zinc-800 text-[10px] text-zinc-500 space-y-1">
      <div class="flex justify-between">
        <span>Active APTs:</span>
        <span class="text-zinc-300 font-mono">{{ activeIds.size }}</span>
      </div>
      <div class="flex justify-between">
        <span>Relevant:</span>
        <span class="text-emerald-400 font-mono">{{ aptGroups.length }}/{{ totalGroups }}</span>
      </div>
      <div v-if="totalGroups > aptGroups.length" class="text-[9px] text-zinc-600 italic">
        {{ totalGroups - aptGroups.length }} groups not relevant to your infrastructure
      </div>
    </div>
  </div>
</template>