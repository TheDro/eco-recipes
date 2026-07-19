import recipesData from '@/data/recipes.json'
import { buildRecipeGraph } from '@/lib/recipeGraph'
import type { Recipe } from '@/lib/types'

const recipes = (recipesData as Recipe[]).slice().sort((a, b) => a.name.localeCompare(b.name))

// Recipe data is static for the lifetime of the app, so the graph (and its
// internal memoization caches) is built once and shared everywhere.
const graph = buildRecipeGraph(recipes)
// window.graph = graph

export function useRecipes() {
  return graph
}
