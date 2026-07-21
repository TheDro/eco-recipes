# Eco Recipes

A single-page app for searching recipes from the game [Eco](https://play.eco/),
showing each recipe's direct ingredients alongside those ingredients reduced
down to base/collectible resources — with an optional toggle to convert that
into a dollar value using prices you set yourself.

Not affiliated with Strange Loop Games. Recipe data is adapted from the
community [EcoCraftingTool](https://github.com/aritchie05/EcoCraftingTool)
project.


## Data

Recipe data lives in `src/data/recipes.json` (item references use the game's
internal `nameID`, not display names). Two small companion files let you fix
edge cases without touching code:

- `src/data/name-overrides.json` — patch an auto-derived display name for a
  raw/collectible item (e.g. `{ "SomeWeirdId": "Better Name" }`).
- `src/data/recipe-overrides.json` — pin which recipe produces an item, for
  the rare case where more than one recipe outputs it
  (e.g. `{ "ItemNameID": "PreferredRecipeNameID" }`).

### Known limitation

Some ingredients in the source data are generic "tag" placeholders (e.g. "any
Wood", "any Crop Seed") rather than a specific item. Since there's no tag
metadata available, these show up as leaf entries in the Base Ingredients
column instead of being expanded further.

## Prices

Click any ingredient chip (in either the Ingredients or Base Ingredients
column) to set a price for that item. Prices are stored in your browser's
`localStorage` only — nothing is sent anywhere. Use the Export/Import buttons
in the header to back up or transfer your price sheet as a JSON file.

## Development

```sh
npm install
npm run dev
npm run build   # type-checks and builds to dist/
```

## Deployment

Pushing to `main` builds and deploys `dist/` to GitHub Pages via
`.github/workflows/deploy.yml`. In the repo settings, set
**Settings → Pages → Source** to "GitHub Actions".
