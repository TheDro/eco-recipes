<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { usePrices } from '@/composables/usePrices'
import { formatMoney, formatQuantity } from '@/lib/format'

const props = defineProps<{
  item: string
  name: string
  quantity: number
}>()

const { prices, setPrice, clearPrice } = usePrices()

const currentPrice = computed<number | undefined>(() => prices.value[props.item])
const hasPrice = computed(() => currentPrice.value !== undefined)
const contribution = computed(() =>
  currentPrice.value !== undefined ? formatMoney(currentPrice.value * props.quantity) : null,
)

const open = ref(false)
const draft = ref('')

watch(open, (isOpen) => {
  if (isOpen) draft.value = currentPrice.value !== undefined ? String(currentPrice.value) : ''
})

function save() {
  const value = Number.parseFloat(draft.value)
  if (Number.isFinite(value) && value >= 0) {
    setPrice(props.item, value)
    open.value = false
  }
}

function clear() {
  clearPrice(props.item)
  open.value = false
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Badge variant="secondary" class="cursor-pointer font-normal select-none">
        {{ name }} &times;{{ formatQuantity(quantity) }}
        <span v-if="contribution" class="text-muted-foreground ml-1">({{ contribution }})</span>
      </Badge>
    </PopoverTrigger>
    <PopoverContent class="w-64">
      <div class="flex flex-col gap-2">
        <p class="text-sm font-medium">{{ name }}</p>
        <label class="text-muted-foreground text-xs" :for="`price-${item}`">Price per unit ($)</label>
        <Input
          :id="`price-${item}`"
          v-model="draft"
          type="number"
          min="0"
          step="0.01"
          @keydown.enter="save"
        />
        <div class="flex justify-end gap-2">
          <Button v-if="hasPrice" variant="ghost" size="sm" @click="clear">Clear</Button>
          <Button size="sm" @click="save">Save</Button>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>
