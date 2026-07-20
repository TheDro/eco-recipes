<script setup lang="ts">
import { computed } from 'vue'
import IngredientChip from '@/components/IngredientChip.vue'
import { usePrices } from '@/composables/usePrices'
import { useRecipes } from '@/composables/useRecipes'
import { formatMoney } from '@/lib/format'
import type { Recipe } from '@/lib/types'

const props = defineProps<{
  recipes: Recipe[]
  mode: 'base' | 'value'
}>()

const emit = defineEmits<{
  select: [name: string]
}>()

const { nameOf, getIngredients, getBaseIngredients, getValue } = useRecipes()
const { prices } = usePrices()

const rows = computed(() =>
  props.recipes.map((recipe) => {
    const ingredients = getIngredients(recipe)
    const base = getBaseIngredients(recipe)
    const value = props.mode === 'value' ? getValue(recipe, prices.value) : null
    return { recipe, ingredients, base, value }
  }),
)
</script>

<template>
  <table class="w-full border-collapse text-sm">
    <thead>
      <tr class="border-b text-left">
        <th class="py-2 pr-4 font-medium">Recipe</th>
        <th class="py-2 pr-4 font-medium">Ingredients</th>
        <th class="py-2 font-medium" :class="{ 'pr-4': mode === 'value' }">Base Ingredients</th>
        <th v-if="mode === 'value'" class="py-2 font-medium">Value</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="row in rows" :key="row.recipe.nameID" class="border-b align-top">
        <td class="py-2 pr-4 font-medium whitespace-nowrap">{{ row.recipe.name }}</td>
        <td class="py-2 pr-4">
          <div class="flex flex-wrap gap-1">
            <IngredientChip
              v-for="ingredient in row.ingredients"
              :key="ingredient.item"
              :item="ingredient.item"
              :name="ingredient.name"
              :quantity="ingredient.quantity"
              @select="emit('select', $event)"
            />
          </div>
        </td>
        <td class="py-2" :class="{ 'pr-4': mode === 'value' }">
          <div class="flex flex-wrap gap-1">
            <IngredientChip
              v-for="base in row.base"
              :key="base.item"
              :item="base.item"
              :name="base.name"
              :quantity="base.quantity"
              @select="emit('select', $event)"
            />
          </div>
        </td>
        <td v-if="mode === 'value' && row.value" class="py-2">
          {{ formatMoney(row.value.value) }}
          <span
            v-if="row.value.unpriced.length"
            class="text-muted-foreground"
            :title="row.value.unpriced.map((id) => nameOf(id)).join(', ')"
          >
            ({{ row.value.unpriced.length }} unpriced)
          </span>
        </td>
      </tr>
      <tr v-if="rows.length === 0">
        <td :colspan="mode === 'value' ? 4 : 3" class="text-muted-foreground py-6 text-center">
          No recipes match your search.
        </td>
      </tr>
    </tbody>
  </table>
</template>
