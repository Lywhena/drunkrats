import { useQuery } from '@tanstack/react-query'
import { fetchRandomDrink } from '@/lib/cocktaildb'
import type { CocktailDBDrink } from '@/lib/cocktaildb'

interface UseDrinkEventResult {
  drink: CocktailDBDrink | undefined
  isLoading: boolean
  isError: boolean
}

export function useDrinkEvent(): UseDrinkEventResult {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['drink-event', Date.now()],
    queryFn: fetchRandomDrink,
    staleTime: 0,          // sempre novo sorteio
    gcTime: 0,             // não reaproveita cache entre eventos
    retry: 1,
    refetchOnWindowFocus: false,
  })

  return { drink: data, isLoading, isError }
}
