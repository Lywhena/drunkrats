# DrunkRats — Especificação Funcional (SPEC)

> v1.0 · Helena Veltri · Leandro Retzlaff · Rayanna Christensen · Bernardo Grams

---

## 1. Objetivo

DrunkRats é uma aplicação web SPA (Single Page Application) para gerenciar gincanas
competitivas de bebidas entre amigos. Funciona inteiramente no navegador, sem necessidade
de servidor, conta ou conexão contínua — exceto no momento do evento drink.

**Público-alvo:** grupos de 2 a N amigos maiores de 18 anos.

---

## 2. Fluxo Principal

```
[Home] → [Jogadores] → [Controle] ⇄ [Drink] → [Placar]
                                  ↘ [Placar] (encerrar)
```

Cada transição de tela corresponde a uma mudança no `status` do `GameStore`.

---

## 3. Telas

### 3.1 Home (`/`)

**Propósito:** apresentação, regras e ponto de entrada.

**Conteúdo:**
- Nome e identidade visual do DrunkRats
- Subtítulo: "A gincana oficial da saideira que nunca acaba."
- Contadores zerados: `00 BACKEND`, `00 CONTAS`, `∞ RESSACAS`
- Seção "§ Manual do Rato — As Regras":
  1. Cadastre o bando (mínimo 2 ratos, cada um com cor e codinome)
  2. Some pontos bebendo (pontuação baseada em ml × teor alcoólico)
  3. Evento Drink (sorteia drink aleatório da TheCocktailDB; primeiro a preparar leva o bônus)
  4. Desistiu, saiu (marca rato como inativo; sem volta)
  5. O último de pé leva (placar final define o campeão)
- Avisos de bem-estar (checklist):
  - Beba água entre as rodadas
  - Se alguém disse "chega" — acabou pra essa pessoa
  - Nunca dirija. Nem de patinete. Nem de bicicleta.
  - Comida na mesa não é opcional, é regra
- **CTA principal:** `COMEÇAR BEBEDEIRA →` → navega para `/players` e seta `status: setup`
- **CTA secundário:** `VER ÚLTIMO PLACAR` → visível apenas se houver partida salva no localStorage; navega para `/scoreboard`
- Rodapé: `18+ · BEBA COM MODERAÇÃO · RATOS NÃO DIRIGEM`

**Comportamento:**
- Se `status === 'playing'`, o CTA principal vira "CONTINUAR PARTIDA" e navega para `/control`
- Se `status === 'finished'`, exibir apenas "NOVA RESSACA" e "VER PLACAR"

---

### 3.2 Jogadores (`/players`)

**Propósito:** cadastrar os participantes antes de iniciar.

**Conteúdo:**
- Título: "O BANDO"
- Lista de jogadores cadastrados (cards com nome, cor e opção de remover)
- Formulário inline: campo `nome` + seletor de `cor` + botão `+ ADICIONAR RATO`
- Botão `INICIAR` — desabilitado se `players.length < 2`

**Validações:**
- Nome: obrigatório, 2–20 caracteres, sem duplicatas
- Cor: obrigatória, única por jogador (evitar confusão visual)
- Mínimo de 2 jogadores para habilitar "INICIAR"

**Ao clicar INICIAR:**
- `status` → `'playing'`
- Navega para `/control`

**Acesso:** apenas se `status === 'setup'`. Caso contrário, redireciona para `/`.

---

### 3.3 Controle (`/control`)

**Propósito:** tela principal durante a partida — gestão de pontos e eventos.

**Header de status:**
- Timer da partida em andamento (`HH:MM:SS`)
- Contadores: `N ATIVOS`, `N DESISTIRAM`, `TOTAL PTS`, `N EVENTOS`
- Botões: `VER PLACAR` e `🎲 EVENTO DRINK`

**Grid de jogadores (cards):**

Cada card exibe:
- Número, status (ATIVO / DESISTIU · INATIVO), avatar com cor
- Nome do jogador
- Pontuação atual (animada ao mudar)
- Última ação com timestamp (ex: `+10 pts · 22:47`)
- Botões: `+ 10 PTS`, `– 5 PTS`
- Link/botão: `ml × %` (abre calculadora)
- Botão: `✕ MARCAR DESISTÊNCIA`

Cards de jogadores inativos ficam visivelmente distintos (opacidade reduzida, badge "OUT").

**Calculadora ml × %:**
- Campos: `ml` e `% teor alcoólico`
- Cálculo: `pts = ml × (teor / 100)`
- Botões rápidos: `+5`, `+10`, `+20` (aplicam diretamente ao jogador selecionado)

**Histórico de eventos (sidebar ou seção):**
- Lista os `DrinkEvent` registrados: nome do drink, vencedor, horário, bônus

**Botão ADICIONAR RATO:**
- Permite adicionar novo jogador durante a partida
- Novo jogador entra com `score: 0` e `active: true`

**Botão ENCERRAR JOGO:**
- Confirmar com modal/dialog
- `status` → `'finished'`
- Navega para `/scoreboard`

**Acesso:** apenas se `status === 'playing'`. Caso contrário, redireciona para `/`.

---

### 3.4 Placar (`/scoreboard`)

**Propósito:** ranking em tempo real durante a partida e pódio final ao encerrar.

#### Modo "em andamento" (`status === 'playing'`):
- Título: "§ PLACAR · PARTIDA EM ANDAMENTO"
- Ranking ordenado por pontuação decrescente
- Destaque visual do líder
- Atualiza em tempo real via estado Zustand

#### Modo "final" (`status === 'finished'`):
- Título: "A RESSACA ESTÁ SELADA."
- Subtítulo: `N ativos · N desistentes · N eventos drink`
- **Pódio visual** (1º, 2º, 3º lugar com destaque por tamanho/cor):
  - 1º: laranja/vermelho, maior, badge `★ CAMPEÃO ★`
  - 2º: dourado
  - 3º: verde
- **Classificação completa** em tabela: posição, avatar, nome, barra de progresso relativa, pontuação
- Jogadores desistentes aparecem ao final com badge "DESISTIU" e pontuação congelada
- **Eventos Drink:** lista com nome do drink, vencedor, horário, bônus recebido
- **Estatísticas da Sessão:**
  - Maior pontuação
  - Média do bando
  - Número de desistências
  - Duração total
  - Total de bônus distribuídos
- Seção final: `CAMPEÃO DA SAIDEIRA: [NOME]`
- Botão `NOVA RESSACA →` → chama `resetGame()`, limpa localStorage, navega para `/`

**Acesso:** `status === 'playing'` ou `status === 'finished'`.

---

### 3.5 Drink (`/drink`)

**Propósito:** evento especial sorteado durante a partida.

**Fluxo:**
1. Botão `🎲 EVENTO DRINK` em `/control` navega para `/drink`
2. Página exibe estado de carregamento enquanto busca na TheCocktailDB
3. Exibe o drink sorteado:
   - Imagem (`strDrinkThumb`)
   - Nome (`strDrink`)
   - Categoria (`strCategory`)
   - Lista de ingredientes e medidas
4. Dropdown: selecionar o vencedor (apenas jogadores `active: true`)
5. Botão `APLICAR BÔNUS` → chama `applyDrinkBonus()` e retorna para `/control`
6. Botão `PULAR EVENTO` → chama `skipDrinkEvent()` (−5 pts para todos os ativos) e retorna para `/control`

**Fallback de API:**
- Se a requisição falhar: exibir card "Shot de Destilado" com bônus padrão de 10 pts
- O fluxo continua normalmente com o fallback

**Acesso:** apenas se `status === 'playing'`. Caso contrário, redireciona para `/control`.

---

## 4. Estado Global — Regras de Negócio

### 4.1 Pontuação

| Ação | Variação |
|---|---|
| Botão `+10 PTS` | +10 ao jogador |
| Botão `–5 PTS` | −5 ao jogador (mínimo 0) |
| Calculadora ml × % | pts = ml × (teor/100), aplicado ao jogador |
| Vencer evento drink | +`bonus` ao vencedor |
| Pular evento drink | −5 para todos os ativos |

**Invariante:** `score >= 0` sempre. Nunca permitir pontuação negativa.

### 4.2 Eliminação

- `eliminatePlayer(id)` seta `active: false`
- Irreversível dentro da partida
- Jogador eliminado: não recebe/perde pontos em eventos automáticos
- Permanece visível em todas as telas com status "DESISTIU"

### 4.3 Transições de Status

```
idle → setup      : ao clicar "COMEÇAR BEBEDEIRA"
setup → playing   : ao clicar "INICIAR" (≥2 jogadores)
playing → finished: ao clicar "ENCERRAR JOGO"
finished → idle   : ao clicar "NOVA RESSACA" (resetGame)
```

### 4.4 Persistência

- Zustand `persist` middleware salva em `localStorage` com chave `drunkrats-game`
- Persiste: `status`, `players`, `events`
- `resetGame()` remove a chave do `localStorage` e retorna ao estado inicial

---

## 5. API — TheCocktailDB

**Endpoint:** `GET https://www.thecocktaildb.com/api/json/v1/1/random.php`

**Campos utilizados da resposta (`drinks[0]`):**

| Campo | Uso |
|---|---|
| `idDrink` | `DrinkEvent.drinkId` |
| `strDrink` | nome exibido e `DrinkEvent.drinkName` |
| `strDrinkThumb` | imagem do drink |
| `strCategory` | exibido no card |
| `strIngredient1..15` | lista de ingredientes |
| `strMeasure1..15` | medidas correspondentes |

**Cache:** `staleTime: 0` no React Query — novo sorteio a cada evento.

**Fallback:** drink fixo "Shot de Destilado", bônus = 10 pts.

---

## 6. Requisitos Não-Funcionais

| Requisito | Descrição |
|---|---|
| Performance | First Contentful Paint < 1.5s (Vite bundle otimizado) |
| Responsividade | Mobile-first; funcional em telas a partir de 375px |
| Offline parcial | App funciona sem internet (exceto evento drink) |
| Acessibilidade | WCAG AA: contraste ≥ 4.5:1, navegação por teclado, aria-labels |
| Compatibilidade | Chrome, Firefox, Safari, Edge — versões recentes |
| Sem dependências externas críticas | Nenhuma biblioteca de pagamento, auth ou tracking |

---

## 7. Fora do Escopo (v1.0)

- Multiplayer em rede (WebSocket, WebRTC)
- Histórico persistente entre sessões (sem backend)
- Autenticação ou perfis de usuário
- Modo espectador
- Sons e música
- PWA / instalação como app nativo
- Internacionalização (i18n) — app em português apenas
- Tela de cadastro de jogadores com foto
- Integração com outras APIs de drinks