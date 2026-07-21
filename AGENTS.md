# Eco Recipes

Single-page Vue 3 + TypeScript + Vite app for browsing crafting recipes from
the game Eco. Shows each recipe's direct ingredients and those ingredients
reduced down to base/collectible resources, with an optional $ value mode.
See README.md for more background. Whenever implementing new features, 
keep the YAGNI principle in mind to keep things simple.

## Stack

- Vue 3 `<script setup>` Composition API (no Vuex/Pinia/Redux — state lives
  in module-scoped composables + local `ref`/`computed`).
- Tailwind CSS + shadcn-vue components in `src/components/ui/` (add more via
  `npx shadcn-vue@latest add <component>`).
- `@vueuse/core`, especially `useLocalStorage` for persisted state.

## Commands

```sh
npm run dev            # start dev server
npm run build           # vue-tsc -b type-check + vite build to dist/
```

No lint/test scripts are configured. Always run `npm run build` (or
`npx vue-tsc -b`) after changes to catch type errors.

## Structure

- `src/lib/types.ts` — core types: `Recipe`, `RecipeIngredient`, `RecipeOutput`, `ItemAmount`, `PriceMap`.
- `src/lib/recipeGraph.ts` — the recipe "reduction engine": builds a
  `producerFor` map (item -> chosen recipe) and recursively/memoized expands
  a recipe down to base ingredients (`getBaseIngredients`) or a dollar value
  (`getValue`). Supports an optional `disabledRecipes: Set<nameID>` param —
  a disabled recipe's output is treated as a leaf/base item wherever it's
  used as an ingredient elsewhere.
- `src/composables/useRecipes.ts` — loads `src/data/recipes.json` once and
  builds the shared `RecipeGraph` singleton.
- `src/composables/usePrices.ts` — user-set item prices, persisted to
  localStorage.
- `src/composables/useRecipeToggles.ts` — per-recipe enabled/disabled
  (checkbox) state, keyed by `Recipe.nameID`, persisted to localStorage.
- `src/components/RecipeTable.vue` — main recipe list/table.
- `src/components/IngredientChip.vue` — clickable ingredient badge with a
  price-setting popover.
- `src/data/recipes.json` — raw recipe data (game's internal `nameID`s, not
  display names). `name-overrides.json` and `recipe-overrides.json` are
  small manual patch files (see README.md).

## Conventions

- Recipes are keyed by `Recipe.nameID`; items (ingredients/outputs) are
  keyed by their own string item ID, looked up via `nameOf()`.
- Prefer adding new persisted per-item/per-recipe state as its own
  composable following the `usePrices.ts` / `useRecipeToggles.ts` pattern
  (`useLocalStorage` + a `Record<string, T>` keyed by nameID).
