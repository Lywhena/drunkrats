# CLAUDE.md — DrunkRats

> Guia de desenvolvimento para agentes e LLMs trabalhando neste repositório.

---

## Visão Geral do Projeto

**DrunkRats** é uma aplicação web React para gincanas competitivas sobre bebidas entre amigos.
Zero backend, zero login, zero banco de dados — tudo roda no navegador via `localStorage`.

- **Domínio:** jogo de pontuação em tempo real com eventos de drink sorteados
- **Persistência:** Zustand + middleware `persist` → `localStorage`
- **Dados descartados:** ao chamar `resetGame()` ao final da partida
- **API externa:** TheCocktailDB (REST, sem autenticação)

---

## Stack

| Camada | Tecnologia |
|---|---|
| UI | React 18 + TypeScript |
| Build | Vite 5 |
| Roteamento | React Router DOM v6 |
| Estado global | Zustand + persist middleware |
| Estilos | Tailwind CSS + Ant Design v5 |
| Design tokens | Material Design 3 (MUI v6) |
| Data fetching | React Query (TanStack Query) |
| API de drinks | TheCocktailDB `/random` |

---

## Estrutura de Pastas (Screaming Architecture)

```
src/
├── features/
│   ├── home/               # Tela inicial, regras, CTA
│   │   ├── HomePage.tsx
│   │   └── types.ts
│   ├── players/            # Cadastro de jogadores
│   │   ├── PlayersPage.tsx
│   │   ├── PlayerCard.tsx
│   │   └── types.ts
│   ├── control/            # Controle da gincana
│   │   ├── ControlPage.tsx
│   │   ├── PlayerTile.tsx
│   │   ├── MlCalculator.tsx
│   │   ├── EventHistory.tsx
│   │   └── types.ts
│   ├── scoreboard/         # Placar e pódio
│   │   ├── ScoreboardPage.tsx
│   │   ├── Podium.tsx
│   │   ├── RankingTable.tsx
│   │   └── types.ts
│   └── drink/              # Evento drink
│       ├── DrinkPage.tsx
│       ├── DrinkCard.tsx
│       ├── useDrinkEvent.ts
│       └── types.ts
├── store/
│   └── useGameStore.ts     # Zustand store principal
├── lib/
│   ├── cocktaildb.ts       # Wrapper da TheCocktailDB API
│   └── scoring.ts          # Lógica de pontuação (ml × teor)
├── components/             # UI genérica reutilizável
│   ├── NavBar.tsx
│   └── PlayerAvatar.tsx
├── router.tsx              # React Router declarativo
└── main.tsx
```

**Regra:** cada `feature/` carrega seus próprios tipos, componentes e hooks. Nunca importar
componentes de uma feature dentro de outra — use `components/` para código verdadeiramente
compartilhado.

---

## Estado Global — Zustand Store

```ts
// src/store/useGameStore.ts

interface Player {
  id: string
  name: string
  color: string       // hex ou slug de cor identificadora
  score: number       // >= 0
  active: boolean
  joinedAt: number    // timestamp
}

interface DrinkEvent {
  drinkId: string
  drinkName: string
  thumb: string
  bonus: number
  winnerId: string | null
  triggeredAt: number
}

type GameStatus = 'idle' | 'setup' | 'playing' | 'finished'

interface GameStore {
  status: GameStatus
  players: Player[]
  events: DrinkEvent[]

  // Actions
  startGame: () => void
  resetGame: () => void           // limpa localStorage
  addPlayer: (name: string, color: string) => void
  removePlayer: (id: string) => void
  addPoints: (playerId: string, pts: number) => void
  removePoints: (playerId: string, pts: number) => void
  eliminatePlayer: (playerId: string) => void
  applyDrinkBonus: (event: DrinkEvent) => void
  skipDrinkEvent: () => void      // -5 pts para todos os ativos
  finishGame: () => void
}
```

**Persist config:**
```ts
persist(store, {
  name: 'drunkrats-game',
  // serializa apenas o necessário
})
```

---

## Rotas

| Rota | Componente | Acesso |
|---|---|---|
| `/` | `HomePage` | sempre |
| `/players` | `PlayersPage` | status: `idle` → `setup` |
| `/control` | `ControlPage` | status: `playing` |
| `/scoreboard` | `ScoreboardPage` | status: `playing` ou `finished` |
| `/drink` | `DrinkPage` | status: `playing` |

Redirecionar para `/` se o `status` não permitir a rota acessada.

---

## Lógica de Pontuação

```
pts = ml × (teor_alcoolico / 100)   // calculadora ml × %
```

Botões rápidos no Controle: `+5`, `+10`, `+20` pontos fixos.

**Evento Drink:**
- Vencedor (quem preparou primeiro): recebe `bonus` definido pela API response
- Pular evento: `-5` pts para **todos** os jogadores ativos
- `applyDrinkBonus()` registra o `DrinkEvent` no array `events` e retorna o usuário para `/control`

**Desistência:**
- `eliminatePlayer(id)` seta `active: false` — sem volta
- Jogador permanece visível no placar com status "DESISTIU"

---

## Integração TheCocktailDB

```
GET https://www.thecocktaildb.com/api/json/v1/1/random.php
```

Sem autenticação. Retorna `drinks[0]` com:
- `idDrink`, `strDrink`, `strDrinkThumb`, `strCategory`
- `strIngredient1..15`, `strMeasure1..15`

**Fallback:** se a requisição falhar, exibir "Shot de destilado" com bônus padrão de 10 pts.

Cache via React Query com `staleTime: 0` (sempre novo drink no evento).

---


Tipografia: hierarquia MD3 — Display → Headline → Body → Label.

Layout responsivo:
- Mobile: Bottom Navigation
- Tablet: Navigation Rail
- Desktop: Navigation Drawer

Estados visuais obrigatórios: `hover`, `pressed`, `focused`, `disabled`.

Animações: fade/slide em transições de tela; animação de pontuação ao adicionar/remover pts.

---

## Convenções de Código

- **TypeScript strict** — sem `any`
- **Componentes funcionais** + hooks
- **Nomeação:** PascalCase para componentes, camelCase para hooks (`useXxx`), SCREAMING_SNAKE para constantes
- **Imports:** absolutos via alias `@/` apontando para `src/`
- **Sem side effects em renders** — toda mutação via actions do store
- **Acessibilidade:** botões com `aria-label`, cores com contraste mínimo 4.5:1

---

## Scripts

```bash
npm run dev       # dev server com HMR (Vite)
npm run build     # bundle de produção
npm run preview   # preview do build
npm run lint      # ESLint
npm run typecheck # tsc --noEmit
```

---

## Restrições Importantes

1. **Sem backend** — nenhuma chamada para servidores próprios
2. **Sem autenticação** — zero tokens, zero sessão server-side
3. **localStorage é a única persistência** — e deve ser limpo em `resetGame()`
4. **Score nunca negativo** — validar `Math.max(0, score - pts)` ao remover pontos
5. **Mínimo 2 jogadores** para habilitar o botão "Iniciar"
6. **Jogador eliminado não participa** de eventos drink nem recebe/perde pontos automáticos