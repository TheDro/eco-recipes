# Eco Recipes — Project Plan

A single-page app, deployed on GitHub Pages, showing a searchable list of recipes
from the game Eco: recipe name, direct ingredients, and ingredients reduced down
to base/collectible resources — with an optional per-ingredient dollar value.

Guiding principle: **YAGNI**. Build the minimum that satisfies the requirements;
avoid speculative features/abstractions until they're actually needed.

## Data

- `src/data/recipes.json` — provided by the user. Array of recipes, ingredients/
  outputs reference items by `nameID` string. Example shape:

  ```json
  {
    "name": "Acorn Powder",
    "nameID": "AcornPowder",
    "level": 5,
    "labor": 15,
    "hidden": false,
    "ingredients": [{ "item": "AcornItem", "quantity": 4 }],
    "outputs": [{ "item": "AcornPowderItem", "quantity": 1, "primary": true }]
  }
  ```

- No `items.ts`/`skills.ts` — display names are derived, not looked up:
  1. If an item's `nameID` matches some recipe's output, use that recipe's
     human `name`.
  2. Otherwise (raw/collectible items with no recipe), derive a name from the
     `nameID` by splitting camelCase and stripping `Item`/`Object` suffixes
     (e.g. `IronOreItem` → "Iron Ore").
  3. `src/data/name-overrides.json` (starts as `{}`) lets us patch any ugly
     auto-derived names found during QA.

- `src/data/recipe-overrides.json` (starts as `{}`) — manual override map for
  the rare item produced by more than one recipe (itemNameID → chosen
  recipeNameID). Only populated if real data shows a conflict.

- **Known limitation** (documented in README): generic "tag" placeholder
  ingredients used in the source data (e.g. `Wood`, `CropSeed`) can't be
  distinguished from real items without `items.ts` metadata — they'll show up
  as leaf pseudo-ingredients in the Base Ingredients column.

## Reduction / valuation engine — `src/lib/recipeGraph.ts`

- `producersByItem` index: item nameID → recipe(s) that output it as `primary`.
- Tie-break when >1 producer: check `recipe-overrides.json` first, else
  prefer non-hidden → fewest ingredients → lowest labor → alphabetical nameID.
- Recursive expansion to base ingredients, memoized per item (cache = base
  ingredients needed per 1 unit of that item's output, reused/scaled for any
  quantity). Cycle protection via a single visited-set check during recursion
  (if revisited mid-branch, treat as a leaf instead of recursing further).
- Dollar-mode expansion: same traversal, but stops recursing into any item
  that currently has a user-set price (even if craftable), summing
  `qty × price` and returning any unpriced leaf items so the UI can show
  something like `$42.50 (2 unpriced)`.
- `reducible` flags and skill/crafting-table modifiers from the source data
  are out of scope (no skills/tables data available) — quantities used as-is.

## App — Vue 3 + Vite + TypeScript, single view

- No router — one `App.vue`: header (title, GitHub link, Export / Import /
  Clear-all-prices buttons) + `SearchBar` + `RecipeTable` + one global
  `PriceEditPopover`.
- `SearchBar`: text input filtering by recipe name and ingredient/base-
  ingredient name, plus the column-3 mode switch (Base Ingredients ⇄ Value $).
- `RecipeTable`: plain Tailwind-styled `<table>`, columns Name | Ingredients |
  Base Ingredients/Value, rows in alphabetical order. Ingredient/base-
  ingredient values render as `Badge` chips (text only, no game icons — avoids
  game-asset copyright concerns).
- Clicking any ingredient chip anywhere opens `PriceEditPopover` (shadcn-vue
  `Popover`, anchored near the click) with an `Input` for the price and
  `Button`s for Save/Clear. Chips with a set price show it inline
  (e.g. `Iron Ore ×4 ($2.00)`).
- State via composables + `@vueuse/core`'s `useLocalStorage`:
  - `useRecipes()` — loads `recipes.json`, builds the reduction indices once.
  - `usePrices()` — persisted itemNameID → price map; export/import/clear.
  - `usePriceEditor()` — transient state for which item + anchor position the
    popover is currently showing.

## shadcn-vue components used

`Input`, `Popover`, `Button`, `Switch`, `Badge` — installed via the shadcn-vue
CLI into `src/components/ui/*` (plain editable `.vue` files, not a bundled
dependency). Requires Tailwind CSS + `components.json` + `src/lib/utils.ts`
(`cn()` helper) + `reka-ui`, `class-variance-authority`, `tailwind-merge`,
`lucide-vue-next`.

## Repo structure

```
src/
  components/
    ui/                    # shadcn-vue generated primitives
    SearchBar.vue
    RecipeTable.vue
    IngredientChip.vue
    PriceEditPopover.vue
  lib/{recipeGraph.ts, formatName.ts, types.ts, utils.ts}
  data/{recipes.json, recipe-overrides.json, name-overrides.json}
  composables/{useRecipes.ts, usePrices.ts, usePriceEditor.ts}
  App.vue, main.ts
components.json
tailwind.config.ts
.github/workflows/deploy.yml   # build + deploy to GitHub Pages via Actions
vite.config.ts                 # base: '/eco-recipes/'
README.md                      # data-source attribution + disclaimer
```

## Testing

- Vitest unit tests for `recipeGraph.ts` against small fixture recipes:
  normal reduction, cycle handling, multi-producer tie-break, dollar-mode
  stop-at-priced behavior.
- One additional test that runs the reduction over the real `recipes.json`
  and asserts it completes without throwing (regression guard against future
  data updates introducing new cycles).

## Deployment

- GitHub Actions workflow: on push to `main`, `npm ci && npm run build`,
  deploy `dist/` via `actions/upload-pages-artifact` + `actions/deploy-pages`
  (repo Pages source set to "GitHub Actions").

## Open item

Once `recipes.json` is added, sample it to finalize `formatName.ts`
heuristics and check the real multi-producer list against
`recipe-overrides.json`.
