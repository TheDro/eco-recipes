import { useLocalStorage } from '@vueuse/core'
import { computed } from 'vue'

// Recipes are enabled (checked) by default, so we only persist the
// exceptions - recipes the user has explicitly unchecked. When a recipe's
// nameID is present here, it's treated as a base/raw ingredient wherever it
// shows up as an ingredient of another recipe, instead of being expanded
// into its own ingredients.
const disabled = useLocalStorage<Record<string, true>>('eco-recipes:disabled-recipes', {})

function isEnabled(nameID: string): boolean {
  return !disabled.value[nameID]
}

function setEnabled(nameID: string, enabled: boolean) {
  if (enabled) {
    if (!(nameID in disabled.value)) return
    const next = { ...disabled.value }
    delete next[nameID]
    disabled.value = next
  } else {
    disabled.value = { ...disabled.value, [nameID]: true }
  }
}

function toggleEnabled(nameID: string) {
  setEnabled(nameID, !isEnabled(nameID))
}

// A Set of disabled recipe nameIDs, for the recipe graph's expansion logic.
const disabledSet = computed(() => new Set(Object.keys(disabled.value)))

export function useRecipeToggles() {
  return { isEnabled, setEnabled, toggleEnabled, disabledSet }
}
