<script setup lang="ts">
import { ArrowLeft, ArrowRight } from '@lucide/vue'
import { refDebounced } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import RecipeTable from '@/components/RecipeTable.vue'
import SearchBar from '@/components/SearchBar.vue'
import { Button } from '@/components/ui/button'
import { usePrices } from '@/composables/usePrices'
import { useRecipes } from '@/composables/useRecipes'

const { recipes, nameOf, getBaseIngredients } = useRecipes()
const { exportJSON, importJSON, clearAll } = usePrices()

const search = ref('')
const debouncedSearch = refDebounced(search, 150)
const showValue = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

// In-app back/forward history of committed search terms. This is independent
// of browser navigation (no History API / URL involved) to sidestep a Vue
// rendering bug triggered by browser history updates.
const searchHistory = ref<string[]>([''])
const historyIndex = ref(0)
let isNavigatingHistory = false

const canGoBack = computed(() => historyIndex.value > 0)
const canGoForward = computed(() => historyIndex.value < searchHistory.value.length - 1)

// Record each *settled* (debounced) search value as a history entry, unless
// the change came from goBack/goForward themselves.
watch(debouncedSearch, (value) => {
  if (isNavigatingHistory) {
    isNavigatingHistory = false
    return
  }
  if (value === searchHistory.value[historyIndex.value]) return
  searchHistory.value = [...searchHistory.value.slice(0, historyIndex.value + 1), value]
  historyIndex.value = searchHistory.value.length - 1
})

function goBack() {
  if (!canGoBack.value) return
  historyIndex.value -= 1
  isNavigatingHistory = true
  search.value = searchHistory.value[historyIndex.value]
}

function goForward() {
  if (!canGoForward.value) return
  historyIndex.value += 1
  isNavigatingHistory = true
  search.value = searchHistory.value[historyIndex.value]
}

const filteredRecipes = computed(() => {
  const query = debouncedSearch.value.trim().toLowerCase()
  if (!query) return recipes
  return recipes.filter((recipe) => {
    if (recipe.name.toLowerCase().includes(query)) return true
    const directMatch = recipe.ingredients.some((ingredient) =>
      nameOf(ingredient.item).toLowerCase().includes(query),
    )
    if (directMatch) return true
    return getBaseIngredients(recipe).some((base) => base.name.toLowerCase().includes(query))
  })
})

function handleExport() {
  const blob = new Blob([exportJSON()], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'eco-recipes-prices.json'
  a.click()
  URL.revokeObjectURL(url)
}

function handleImportClick() {
  fileInput.value?.click()
}

async function handleImportFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    importJSON(await file.text())
  } catch (error) {
    alert(error instanceof Error ? error.message : 'Failed to import prices.')
  } finally {
    input.value = ''
  }
}

function handleClearAll() {
  if (confirm('Clear all saved prices?')) clearAll()
}

function handleIngredientSelect(name: string) {
  search.value = name
}
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-6">
    <header class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold">Eco Recipes</h1>
        <p class="text-muted-foreground text-sm">
          Searchable recipe list for the game
          <a class="underline" href="https://play.eco/" target="_blank" rel="noreferrer">Eco</a>.
        </p>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" size="sm" @click="handleExport">Export prices</Button>
        <Button variant="outline" size="sm" @click="handleImportClick">Import prices</Button>
        <Button variant="outline" size="sm" @click="handleClearAll">Clear prices</Button>
        <input
          ref="fileInput"
          type="file"
          accept="application/json"
          class="hidden"
          @change="handleImportFile"
        />
      </div>
    </header>

    <div class="mb-4 flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        :disabled="!canGoBack"
        aria-label="Back to previous search"
        title="Back to previous search"
        @click="goBack"
      >
        <ArrowLeft class="size-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        :disabled="!canGoForward"
        aria-label="Forward to next search"
        title="Forward to next search"
        @click="goForward"
      >
        <ArrowRight class="size-4" />
      </Button>
      <SearchBar v-model:search="search" v-model:show-value="showValue" class="flex-1" />
    </div>

    <RecipeTable
      :recipes="filteredRecipes"
      :mode="showValue ? 'value' : 'base'"
      @select="handleIngredientSelect"
    />

    <footer class="text-muted-foreground mt-8 text-xs">
      <p>
        Not affiliated with Strange Loop Games. Recipe data adapted from the community
        <a
          class="underline"
          href="https://github.com/aritchie05/EcoCraftingTool"
          target="_blank"
          rel="noreferrer"
          >EcoCraftingTool</a
        >
        project.
      </p>
    </footer>
  </div>
</template>
