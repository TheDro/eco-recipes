import { useLocalStorage } from '@vueuse/core'
import type { PriceMap } from '@/lib/types'

// Single shared price map for the whole app, persisted to localStorage.
const prices = useLocalStorage<PriceMap>('eco-recipes:prices', {})

function getPrice(item: string): number | undefined {
  return prices.value[item]
}

function setPrice(item: string, value: number) {
  prices.value = { ...prices.value, [item]: value }
}

function clearPrice(item: string) {
  const next = { ...prices.value }
  delete next[item]
  prices.value = next
}

function clearAll() {
  prices.value = {}
}

function exportJSON(): string {
  return JSON.stringify(prices.value, null, 2)
}

/** Throws if the given text isn't a valid price file. */
function importJSON(text: string) {
  const parsed = JSON.parse(text)
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Invalid price file: expected a JSON object of itemID -> price.')
  }
  const sanitized: PriceMap = {}
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof value === 'number' && Number.isFinite(value)) sanitized[key] = value
  }
  prices.value = sanitized
}

export function usePrices() {
  return { prices, getPrice, setPrice, clearPrice, clearAll, exportJSON, importJSON }
}
