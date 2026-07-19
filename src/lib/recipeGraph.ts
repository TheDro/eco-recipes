import recipeOverridesJson from '@/data/recipe-overrides.json'
import { deriveItemName } from './formatName'
import type { ItemAmount, PriceMap, Recipe } from './types'

const recipeOverrides = recipeOverridesJson as Record<string, string>

export interface ValueResult {
  value: number
  /** itemNameIDs reached during expansion that have no price set. */
  unpriced: string[]
}

export interface RecipeGraph {
  recipes: Recipe[]
  /** Human-readable display name for any item nameID. */
  nameOf(itemID: string): string
  /** Expand a recipe's ingredients down to base/collectible items. */
  getBaseIngredients(recipe: Recipe): ItemAmount[]
  /** Expand a recipe's ingredients into a dollar cost, stopping at any priced item. */
  getValue(recipe: Recipe, prices: PriceMap): ValueResult
}

/** Deterministic pick when more than one recipe produces the same item. */
function choosePreferredProducer(candidates: Recipe[]): Recipe {
  const nonHidden = candidates.filter((r) => !r.hidden)
  const pool = nonHidden.length > 0 ? nonHidden : candidates
  return [...pool].sort((a, b) => {
    const ingredientDiff = a.ingredients.length - b.ingredients.length
    if (ingredientDiff !== 0) return ingredientDiff
    const laborDiff = (a.labor ?? 0) - (b.labor ?? 0)
    if (laborDiff !== 0) return laborDiff
    return a.nameID.localeCompare(b.nameID)
  })[0]
}

export function buildRecipeGraph(recipes: Recipe[]): RecipeGraph {
  const recipeByNameID = new Map(recipes.map((r) => [r.nameID, r]))

  // Every item that some recipe produces as its primary output.
  const producersByItem = new Map<string, Recipe[]>()
  for (const recipe of recipes) {
    for (const output of recipe.outputs) {
      if (!output.primary) continue
      const list = producersByItem.get(output.item) ?? []
      list.push(recipe)
      producersByItem.set(output.item, list)
    }
  }

  // Resolve exactly one producing recipe per craftable item.
  const producerFor = new Map<string, Recipe>()
  for (const [item, candidates] of producersByItem) {
    const overrideNameID = recipeOverrides[item]
    const overrideRecipe = overrideNameID ? recipeByNameID.get(overrideNameID) : undefined
    producerFor.set(item, overrideRecipe ?? choosePreferredProducer(candidates))
  }

  const displayNameCache = new Map<string, string>()
  function nameOf(itemID: string): string {
    const cached = displayNameCache.get(itemID)
    if (cached) return cached
    const producer = producerFor.get(itemID)
    const name = producer ? producer.name : deriveItemName(itemID)
    displayNameCache.set(itemID, name)
    return name
  }

  // Per-item cache of "base ingredients needed to make exactly 1 unit of
  // this item", reused (and linearly scaled) for any requested quantity.
  const unitExpansionCache = new Map<string, Map<string, number>>()

  function expandUnit(itemID: string, visiting: Set<string>): Map<string, number> {
    const cached = unitExpansionCache.get(itemID)
    if (cached) return cached

    const producer = producerFor.get(itemID)
    if (!producer || visiting.has(itemID)) {
      // Raw/collectible item, or a cycle guard: treat it as its own leaf.
      const leaf = new Map([[itemID, 1]])
      if (!producer) unitExpansionCache.set(itemID, leaf)
      return leaf
    }

    visiting.add(itemID)
    const outputQty = producer.outputs.find((o) => o.primary && o.item === itemID)?.quantity ?? 1
    const combined = new Map<string, number>()
    for (const ingredient of producer.ingredients) {
      const perUnit = expandUnit(ingredient.item, visiting)
      const scale = ingredient.quantity / outputQty
      for (const [baseItem, qty] of perUnit) {
        combined.set(baseItem, (combined.get(baseItem) ?? 0) + qty * scale)
      }
    }
    visiting.delete(itemID)
    unitExpansionCache.set(itemID, combined)
    return combined
  }

  function getBaseIngredients(recipe: Recipe): ItemAmount[] {
    const totals = new Map<string, number>()
    for (const ingredient of recipe.ingredients) {
      const perUnit = expandUnit(ingredient.item, new Set())
      for (const [baseItem, qty] of perUnit) {
        totals.set(baseItem, (totals.get(baseItem) ?? 0) + qty * ingredient.quantity)
      }
    }
    return [...totals.entries()]
      .map(([item, quantity]) => ({ item, quantity, name: nameOf(item) }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  // Dollar-mode expansion depends on the current price map (any item can
  // become a "leaf" the instant it's priced), so it isn't cached globally -
  // it walks fresh on every call using the same producerFor index.
  function expandValue(
    itemID: string,
    quantity: number,
    prices: PriceMap,
    visiting: Set<string>,
    totals: Map<string, number>,
  ): void {
    const producer = producerFor.get(itemID)
    if (prices[itemID] !== undefined || !producer || visiting.has(itemID)) {
      totals.set(itemID, (totals.get(itemID) ?? 0) + quantity)
      return
    }
    visiting.add(itemID)
    const outputQty = producer.outputs.find((o) => o.primary && o.item === itemID)?.quantity ?? 1
    const scale = quantity / outputQty
    for (const ingredient of producer.ingredients) {
      expandValue(ingredient.item, ingredient.quantity * scale, prices, visiting, totals)
    }
    visiting.delete(itemID)
  }

  function getValue(recipe: Recipe, prices: PriceMap): ValueResult {
    const totals = new Map<string, number>()
    for (const ingredient of recipe.ingredients) {
      expandValue(ingredient.item, ingredient.quantity, prices, new Set(), totals)
    }
    let value = 0
    const unpriced: string[] = []
    for (const [item, qty] of totals) {
      const price = prices[item]
      if (price === undefined) unpriced.push(item)
      else value += price * qty
    }
    return { value, unpriced }
  }

  return { recipes, nameOf, getBaseIngredients, getValue }
}
