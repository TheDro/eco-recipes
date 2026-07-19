<script setup lang="ts">
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

const search = defineModel<string>('search', { default: '' })
const showValue = defineModel<boolean>('showValue', { default: false })
</script>

<template>
  <div class="flex flex-wrap items-center gap-4">
    <Input v-model="search" type="search" placeholder="Search recipes or ingredients…" class="max-w-sm" />
    <label class="flex items-center gap-2 text-sm">
      <Switch v-model="showValue" />
      Show value ($) instead of base ingredients
    </label>
  </div>
</template>
