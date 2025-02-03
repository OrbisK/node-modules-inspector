import type { PackageModuleType } from 'node-modules-tools'
import { useDebounce } from '@vueuse/core'
import { computed, reactive } from 'vue'
import { getModuleType } from '../utils/module-type'
import { packageData, packageVersionsMap } from './data'

export interface FilterOptions {
  search: string
  modules: null | PackageModuleType[]
  licenses: null | string[]
  excludes: null | string[]
  sourceType: null | 'prod' | 'dev'
}

export const FILTER_KEYS = [
  'excludes',
  'modules',
  'licenses',
  'sourceType',
] satisfies (keyof FilterOptions)[]

export const FILTER_KEYS_FULL = [
  'search',
  ...FILTER_KEYS,
]

export const filters = reactive<FilterOptions>({
  search: '',
  modules: null,
  licenses: null,
  excludes: null,
  sourceType: null,
})

export const activatedFilters = computed(() => FILTER_KEYS.filter(i => !!filters[i]))

export const workspacePackages = computed(() => Array.from(packageData.value?.packages.values() || []).filter(i => i.workspace))

const debouncedSearch = useDebounce(computed(() => filters.search), 200)

function* packageFilterGenerator(packages, filters, searchValue) {
  for (const pkg of packages) {
    if (filters.modules && !filters.modules.includes(getModuleType(pkg)))
      continue
    if (filters.licenses && !filters.licenses.includes(pkg.resolved.license || ''))
      continue
    if (searchValue && !pkg.name.includes(searchValue))
      continue
    if (filters.excludes && filters.excludes.some(i => pkg.name.includes(i)))
      continue
    if (filters.sourceType) {
      if (filters.sourceType === 'prod' && !pkg.prod && !pkg.workspace)
        continue
      if (filters.sourceType === 'dev' && !pkg.dev && !pkg.workspace)
        continue
    }
    yield pkg
  }
}

export const filteredPackageVersionsMap = computed(() => {
  return new Map<string, PackageNode[]>(
    Array.from(packageVersionsMap.entries()).map(([name, versions]) => {
      const filteredVersions = Array.from(packageFilterGenerator(versions, filters, debouncedSearch.value))
      return [name, filteredVersions]
    }),
  )
})

export const filteredPackages = computed(() => Array.from(packageFilterGenerator(
  packageData.value?.packages.values() || [],
  filters,
  debouncedSearch.value,
)))
