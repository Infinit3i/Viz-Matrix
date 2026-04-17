<script setup lang="ts">
import { ref } from 'vue'

// Infrastructure you OWN — not security tools you deploy.
// Each maps to all sourcetypes that COULD provide visibility into that infrastructure.

const osOptions = [
  { label: 'Windows', value: 'windows', sourceIds: ['win-security', 'win-system', 'win-application', 'sysmon', 'win-powershell', 'win-cmdline', 'win-defender', 'win-wmi', 'edr-crowdstrike', 'edr-defender', 'edr-sentinelone', 'edr-carbonblack', 'edr-cortex'] },
  { label: 'Linux', value: 'linux', sourceIds: ['linux-auditd', 'linux-sysmon', 'linux-journald', 'edr-crowdstrike', 'edr-defender', 'edr-sentinelone', 'edr-carbonblack', 'edr-cortex'] },
  { label: 'macOS', value: 'macos', sourceIds: ['macos-unified', 'macos-esf', 'edr-crowdstrike', 'edr-defender', 'edr-sentinelone', 'edr-carbonblack', 'edr-cortex'] },
]

const identityOptions = [
  { label: 'Active Directory', value: 'ad', sourceIds: ['ad-logs', 'vpn', 'mfa'] },
  { label: 'Azure AD / Entra ID', value: 'entra', sourceIds: ['azure-ad', 'mfa'] },
]

const cloudOptions = [
  { label: 'AWS', value: 'aws', sourceIds: ['aws-cloudtrail'] },
  { label: 'Azure', value: 'azure', sourceIds: ['azure-activity', 'azure-ad'] },
  { label: 'GCP', value: 'gcp', sourceIds: ['gcp-audit'] },
]

const infraOptions = [
  { label: 'Email / O365', value: 'email', sourceIds: ['email-gateway', 'email-dlp'] },
  { label: 'Web Applications', value: 'webapps', sourceIds: ['waf', 'proxy'] },
  { label: 'Databases', value: 'databases', sourceIds: ['database-audit'] },
  { label: 'Containers / K8s', value: 'containers', sourceIds: ['container-logs'] },
  { label: 'Network', value: 'network', sourceIds: ['firewall', 'ids-ips', 'dns', 'proxy', 'netflow', 'pcap'] },
  { label: 'CI/CD Pipelines', value: 'cicd', sourceIds: ['github-audit', 'gitlab-audit', 'jenkins-logs', 'container-registry'] },
  { label: 'SaaS Apps', value: 'saas', sourceIds: ['o365-unified', 'google-workspace', 'slack-audit', 'zoom-logs', 'salesforce-audit', 'servicenow-audit'] },
]

// Three states: off → selected → crown jewel → off
const selected = ref<Set<string>>(new Set())
const crownJewels = ref<Set<string>>(new Set())

const categoryMap: Record<string, string[]> = {
  windows: ['windows'],
  linux: ['linux'],
  macos: ['macos'],
  ad: ['identity'],
  entra: ['identity'],
  aws: ['cloud'],
  azure: ['cloud'],
  gcp: ['cloud'],
  email: ['email'],
  webapps: ['application'],
  databases: ['application'],
  containers: ['application'],
  network: ['network'],
  cicd: ['cicd'],
  saas: ['saas'],
}

const emit = defineEmits<{
  apply: [sourceIds: string[]]
  expandCategories: [categories: string[]]
  activeCategories: [categories: string[]]
  crownJewelTechniques: [techniqueIds: Set<string>]
}>()

function toggle(value: string) {
  const sel = new Set(selected.value)
  const cj = new Set(crownJewels.value)

  if (!sel.has(value)) {
    // Off → selected
    sel.add(value)
    if (categoryMap[value]) {
      emit('expandCategories', categoryMap[value])
    }
  } else if (!cj.has(value)) {
    // Selected → crown jewel
    cj.add(value)
  } else {
    // Crown jewel → off
    sel.delete(value)
    cj.delete(value)
  }

  selected.value = sel
  crownJewels.value = cj
  emitSources()
  emitActiveCategories()
  emitCrownJewels()
}

function emitActiveCategories() {
  const cats = new Set<string>()
  for (const val of selected.value) {
    const mapped = categoryMap[val]
    if (mapped) {
      for (const cat of mapped) cats.add(cat)
    }
  }
  if (cats.has('windows') || cats.has('linux') || cats.has('macos')) {
    cats.add('edr')
  }
  emit('activeCategories', [...cats])
}

function emitSources() {
  const allOptions = [...osOptions, ...identityOptions, ...cloudOptions, ...infraOptions]
  const sourceIds = new Set<string>()
  for (const opt of allOptions) {
    if (selected.value.has(opt.value)) {
      for (const id of opt.sourceIds) sourceIds.add(id)
    }
  }
  emit('apply', [...sourceIds])
}

function emitCrownJewels() {
  const allOptions = [...osOptions, ...identityOptions, ...cloudOptions, ...infraOptions]
  const crownSourceIds = new Set<string>()
  for (const opt of allOptions) {
    if (crownJewels.value.has(opt.value)) {
      for (const id of opt.sourceIds) crownSourceIds.add(id)
    }
  }
  emit('crownJewelTechniques', crownSourceIds)
}

const sections = [
  { label: 'We run', options: osOptions },
  { label: 'Identity', options: identityOptions },
  { label: 'Cloud', options: cloudOptions },
  { label: 'We have', options: infraOptions },
]
</script>

<template>
  <div class="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
    <div
      v-for="section in sections"
      :key="section.label"
      class="flex items-center gap-1.5"
    >
      <span class="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mr-1">
        {{ section.label }}
      </span>
      <button
        v-for="opt in section.options"
        :key="opt.value"
        class="text-[11px] px-2 py-0.5 rounded-md border transition-all flex items-center gap-1"
        :class="crownJewels.has(opt.value)
          ? 'bg-amber-950/60 border-amber-500 text-amber-200'
          : selected.has(opt.value)
            ? 'bg-zinc-700 border-zinc-500 text-zinc-100'
            : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'"
        @click="toggle(opt.value)"
        :title="crownJewels.has(opt.value) ? 'Crown Jewel — click to remove' : selected.has(opt.value) ? 'Click to mark as Crown Jewel' : 'Click to add'"
      >
        <span v-if="crownJewels.has(opt.value)" class="text-amber-400 text-[9px]">&#9813;</span>
        {{ opt.label }}
      </button>
    </div>
  </div>
</template>
