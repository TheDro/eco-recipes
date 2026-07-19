export interface RecipeIngredient {
  item: string
  quantity: number
}

export interface RecipeOutput {
  item: string
  quantity: number
  primary?: boolean
}

export interface Recipe {
  name: string
  nameID: string
  level?: number
  labor?: number
  hidden?: boolean
  ingredients: RecipeIngredient[]
  outputs: RecipeOutput[]
}

/** itemNameID -> user-set price per unit. */
export type PriceMap = Record<string, number>

export interface ItemAmount {
  item: string
  name: string
  quantity: number
}
