<script setup lang="ts">
import { computed, ref } from 'vue'
import RecipeTable from '@/components/RecipeTable.vue'
import SearchBar from '@/components/SearchBar.vue'
import { Button } from '@/components/ui/button'
import { usePrices } from '@/composables/usePrices'
import { useRecipes } from '@/composables/useRecipes'

const { recipes, nameOf, getBaseIngredients } = useRecipes()
const { exportJSON, importJSON, clearAll } = usePrices()

const search = ref('')
const showValue = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const filteredRecipes = computed(() => {
  const query = search.value.trim().toLowerCase()
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

    <SearchBar v-model:search="search" v-model:show-value="showValue" class="mb-4" />

    <RecipeTable :recipes="filteredRecipes" :mode="showValue ? 'value' : 'base'" />

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
