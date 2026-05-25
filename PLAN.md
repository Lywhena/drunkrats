# Plano de Implementação — DrunkRats

> v1.0 · Helena Veltri · Leandro Retzlaff · Rayanna Christensen · Bernardo Grams

---

## Stack

| Camada | Tecnologia |
|---|---|
| UI | React 19 + TypeScript (strict) |
| Build | Vite 8 + `@tailwindcss/vite` |
| Roteamento | React Router DOM v6 |
| Estado global | Zustand v5 + persist middleware |
| Estilos | Tailwind CSS v4 + Ant Design v5 |
| Data fetching | TanStack Query v5 (`staleTime: 0`) |
| API de drinks | TheCocktailDB `/random.php` |
| Persistência | `localStorage` (chave `drunkrats-game`) |

---

## Screaming Architecture

A estrutura de pastas **grita o domínio** do negócio. Cada `feature/` é auto-contida.

### Regras estritas:
1. **Nunca** importar componentes de uma `feature/` dentro de outra
2. `src/components/` — apenas UI verdadeiramente genérica (sem lógica de domínio)
3. `src/store/` — única fonte de verdade compartilhada entre features
4. `src/lib/` — utilitários puros sem efeitos colaterais
5. Cada feature exporta uma única **Page** como entry point para o router

### Estrutura de arquivos:

```
src/
├── store/
│   └── useGameStore.ts          ← estado global compartilhado
├── lib/
│   ├── cocktaildb.ts            ← wrapper API (puro, sem UI)
│   └── scoring.ts               ← lógica de pontuação (puro)
├── components/                  ← UI genérica reutilizável
│   ├── NavBar.tsx
│   └── PlayerAvatar.tsx
├── router.tsx                   ← declaração de rotas + guards
├── main.tsx                     ← providers (Query, Ant Design, Router)
├── App.tsx                      ← root component
└── features/                   ← DOMÍNIO: cada pasta = uma tela/contexto
    ├── home/
    │   ├── HomePage.tsx
    │   └── types.ts
    ├── players/
    │   ├── PlayersPage.tsx
    │   ├── PlayerCard.tsx
    │   └── types.ts
    ├── control/
    │   ├── ControlPage.tsx
    │   ├── PlayerTile.tsx
    │   ├── MlCalculator.tsx
    │   ├── EventHistory.tsx
    │   └── types.ts
    ├── scoreboard/
    │   ├── ScoreboardPage.tsx
    │   ├── Podium.tsx
    │   ├── RankingTable.tsx
    │   └── types.ts
    └── drink/
        ├── DrinkPage.tsx
        ├── DrinkCard.tsx
        ├── useDrinkEvent.ts
        └── types.ts
```

---

## Rotas e Guards de Acesso

| Rota | Componente | Status permitido |
|---|---|---|
| `/` | `HomePage` | sempre |
| `/players` | `PlayersPage` | `setup` |
| `/control` | `ControlPage` | `playing` |
| `/scoreboard` | `ScoreboardPage` | `playing` ou `finished` |
| `/drink` | `DrinkPage` | `playing` |

Redirecionar para `/` se o status não autorizar a rota.

---

## Estado Global — Zustand Store

```ts
interface Player {
  id: string
  name: string
  color: string       // hex
  score: number       // sempre >= 0
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
  startedAt: number | null  // timestamp de início da partida

  startGame: () => void          // idle → setup
  resetGame: () => void          // limpa localStorage → idle
  addPlayer: (name, color) => void
  removePlayer: (id) => void
  addPoints: (playerId, pts) => void
  removePoints: (playerId, pts) => void   // Math.max(0, score - pts)
  eliminatePlayer: (id) => void  // active: false, irreversível
  applyDrinkBonus: (event) => void
  skipDrinkEvent: () => void     // -5 pts para todos os ativos
  finishGame: () => void         // playing → finished
}
```

### Transições de status:
```
idle → setup      : startGame()  (clicar "COMEÇAR BEBEDEIRA")
setup → playing   : ao clicar "INICIAR" em /players (≥2 jogadores)
playing → finished: finishGame() (clicar "ENCERRAR JOGO")
finished → idle   : resetGame()  (clicar "NOVA RESSACA")
```

---

## Design Tokens — `src/index.css`

Reaproveitando a estrutura de variáveis CSS já existente, remapeada para a paleta DrunkRats:

```css
:root {
  --bg:             #1a1a1a;   /* fundo geral */
  --surface:        #222222;   /* cards e superfícies elevadas */
  --text:           #888888;   /* texto muted/secundário */
  --text-h:         #f5f5f5;   /* texto principal */
  --border:         #2e2e2e;   /* bordas */
  --accent:         #e63946;   /* vermelho DrunkRats (primary) */
  --accent-2:       #ff6b6b;   /* accent secundário / hover */
  --accent-bg:      rgba(230, 57, 70, 0.12);
  --accent-border:  rgba(230, 57, 70, 0.45);
  --shadow:         rgba(0,0,0,0.5) 0 10px 15px -3px, rgba(0,0,0,0.3) 0 4px 6px -2px;
}
```

App sempre escuro (`color-scheme: dark`). Sem modo claro.

---

## Ant Design — Configuração

```tsx
// main.tsx
import { ConfigProvider, theme } from 'antd'

<ConfigProvider
  theme={{
    algorithm: theme.darkAlgorithm,
    token: { colorPrimary: '#e63946' },
  }}
>
```

Componentes Ant Design utilizados: `Modal`, `Select`, `Form`, `Spin`, `message`.

---

## Lógica de Negócio

### Pontuação

| Ação | Efeito |
|---|---|
| `+ 10 PTS` | +10 ao jogador |
| `– 5 PTS` | −5 ao jogador (mínimo 0) |
| Calculadora ml × % | `pts = Math.round(ml × (teor/100))`, aplicado ao jogador |
| Vencer evento drink | +bonus ao vencedor |
| Pular evento drink | −5 para todos os ativos (mínimo 0 cada) |

**Invariante:** `score >= 0` sempre.

### Eliminação
- `eliminatePlayer(id)` → `active: false`, sem volta dentro da partida
- Eliminados não recebem/perdem pontos em eventos automáticos
- Aparecem em todas as telas com badge "DESISTIU"

---

## API — TheCocktailDB

```
GET https://www.thecocktaildb.com/api/json/v1/1/random.php
```

Campos utilizados de `drinks[0]`: `idDrink`, `strDrink`, `strDrinkThumb`, `strCategory`, `strIngredient1..15`, `strMeasure1..15`.

**Fallback:** se a requisição falhar → drink fixo "Shot de Destilado", bônus = 10 pts.

**Cache:** `staleTime: 0` — novo sorteio a cada evento drink.

---

## Sequência de Branches e Commits

Cada entrega é uma branch separada criada a partir de `main`, com um único commit conventional.

| Branch | Commit | O que entrega |
|---|---|---|
| `docs/plan` | `docs: add implementation plan` | Este arquivo `PLAN.md` |
| `chore/setup` | `chore: setup dependencies, build config and gitignore` | Deps instaladas, Vite/Tailwind configurados, design tokens |
| `feat/store` | `feat(store): implement Zustand game store with persistence` | Store completo com todas as actions |
| `feat/lib` | `feat(lib): add cocktaildb api wrapper and scoring logic` | `cocktaildb.ts` + `scoring.ts` |
| `feat/router` | `feat(router): setup react-router with route guards` | Router + guards + providers no main.tsx |
| `feat/components` | `feat(components): add shared PlayerAvatar and NavBar` | PlayerAvatar + NavBar responsivo |
| `feat/home` | `feat(home): implement home page` | Tela `/` completa |
| `feat/players` | `feat(players): implement player registration screen` | Tela `/players` completa |
| `feat/drink` | `feat(drink): implement drink event screen` | Tela `/drink` completa |
| `feat/control` | `feat(control): implement game control screen` | Tela `/control` completa |
| `feat/scoreboard` | `feat(scoreboard): implement scoreboard and podium` | Tela `/scoreboard` completa |
| `style/polish` | `style: apply design tokens and responsive layout polish` | Ajustes visuais finais, WCAG, aria-labels |

---

## Checklist de Verificação Final

- [ ] `npm run dev` — app abre sem erros de console
- [ ] Fluxo completo: Home → /players → INICIAR → /control
- [ ] Adicionar/remover pontos, calcular ml×%
- [ ] 🎲 EVENTO DRINK → API carrega → selecionar vencedor → APLICAR → volta /control
- [ ] PULAR EVENTO → −5pts para todos ativos
- [ ] Marcar desistência → card fica "OUT", botões desabilitados
- [ ] VER PLACAR → ranking em tempo real durante partida
- [ ] ENCERRAR JOGO → modal confirmação → /scoreboard com pódio e stats
- [ ] NOVA RESSACA → localStorage limpo → volta /
- [ ] Reload durante partida → estado restaurado (persistência ok)
- [ ] `npm run build` — sem erros de TypeScript
- [ ] `npm run lint` — sem warnings

---

## Restrições (não negociáveis)

1. **Sem backend** — zero chamadas para servidores próprios
2. **Sem autenticação** — zero tokens ou sessões
3. **localStorage é a única persistência** — e deve ser limpo em `resetGame()`
4. **Score nunca negativo** — `Math.max(0, score - pts)`
5. **Mínimo 2 jogadores** para habilitar "INICIAR"
6. **Jogador eliminado** não participa de eventos automáticos
