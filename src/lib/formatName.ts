import nameOverrides from '@/data/name-overrides.json'

const overrides = nameOverrides as Record<string, string>

/** Split a PascalCase/camelCase identifier into space-separated words. */
function splitCamelCase(id: string): string {
  return id
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .trim()
}

function stripSuffix(id: string): string {
  return id.replace(/(Item|Object)$/, '')
}

/**
 * Derive a human-readable display name for an item nameID that has no
 * recipe of its own (raw/collectible items). Recipe-produced items should
 * prefer the producing recipe's own `name` field instead, since it's
 * already human-curated - see `recipeGraph.ts`.
 */
export function deriveItemName(nameID: string): string {
  return overrides[nameID] ?? splitCamelCase(stripSuffix(nameID))
}
