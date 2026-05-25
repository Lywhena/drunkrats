import type { CocktailDBDrink } from '@/lib/cocktaildb'

export type { CocktailDBDrink }

export interface DrinkEventResult {
  winnerId: string | null
  bonus: number
}
