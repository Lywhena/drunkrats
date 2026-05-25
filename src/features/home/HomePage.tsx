import { useNavigate } from 'react-router-dom'
import { useGameStore } from '@/store/useGameStore'
import type { Rule, WellbeingItem } from './types'

const RULES: Rule[] = [
  { number: 1, text: 'Cadastre o bando — mínimo 2 ratos, cada um com cor e codinome.' },
  { number: 2, text: 'Some pontos bebendo — pontuação baseada em ml × teor alcoólico.' },
  { number: 3, text: 'Evento Drink — sorteia um drink aleatório; o primeiro a preparar leva o bônus.' },
  { number: 4, text: 'Desistiu, saiu — marca o rato como inativo. Sem volta.' },
  { number: 5, text: 'O último de pé leva — placar final define o campeão.' },
]

const WELLBEING: WellbeingItem[] = [
  { text: 'Beba água entre as rodadas.' },
  { text: 'Se alguém disse "chega" — acabou pra essa pessoa.' },
  { text: 'Nunca dirija. Nem de patinete. Nem de bicicleta.' },
  { text: 'Comida na mesa não é opcional, é regra.' },
]

function hasSavedGame(): boolean {
  try {
    const raw = localStorage.getItem('drunkrats-game')
    if (!raw) return false
    const parsed = JSON.parse(raw) as { state?: { status?: string } }
    const status = parsed?.state?.status
    return status === 'playing' || status === 'finished'
  } catch {
    return false
  }
}

export default function HomePage() {
  const navigate = useNavigate()
  const { status, startGame } = useGameStore()
  const savedGame = hasSavedGame()

  function handlePrimary() {
    if (status === 'idle') {
      startGame()
      navigate('/players')
    } else if (status === 'playing') {
      navigate('/control')
    } else if (status === 'finished') {
      useGameStore.getState().resetGame()
      navigate('/')
    }
  }

  return (
    <div className="min-h-svh flex flex-col" style={{ background: 'var(--bg)' }}>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <header className="flex flex-col items-center text-center px-6 pt-16 pb-10">
        <div className="text-6xl mb-4" aria-hidden="true">🐀</div>

        <h1
          className="text-display font-black tracking-tight uppercase mb-2"
          style={{ color: 'var(--text-h)' }}
        >
          Drunk<span style={{ color: 'var(--accent)' }}>Rats</span>
        </h1>

        <p className="text-title" style={{ color: 'var(--text)' }}>
          A gincana oficial da saideira que nunca acaba.
        </p>

        {/* Contadores */}
        <div className="flex gap-8 mt-8">
          {[
            { value: '00', label: 'BACKEND' },
            { value: '00', label: 'CONTAS' },
            { value: '∞',  label: 'RESSACAS' },
          ].map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <span
                className="text-headline font-black tabular-nums"
                style={{ color: 'var(--accent)' }}
              >
                {value}
              </span>
              <span className="text-label" style={{ color: 'var(--text)' }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </header>

      <main className="flex-1 w-full max-w-xl mx-auto px-6 pb-10 flex flex-col gap-8">

        {/* ── CTAs ─────────────────────────────────────────────────── */}
        <section className="flex flex-col gap-3" aria-label="Ações principais">
          {/* CTA principal */}
          {status !== 'finished' && (
            <button
              onClick={handlePrimary}
              className="w-full py-4 rounded-xl font-bold text-title uppercase tracking-wide
                         transition-all active:scale-95 hover:brightness-110 focus-visible:outline-2
                         focus-visible:outline-offset-2"
              style={{
                background: 'var(--accent)',
                color: '#fff',
                boxShadow: '0 4px 24px var(--accent-bg)',
              }}
              aria-label={
                status === 'playing' ? 'Continuar a partida em andamento' : 'Começar uma nova bebedeira'
              }
            >
              {status === 'playing' ? 'CONTINUAR PARTIDA →' : 'COMEÇAR BEBEDEIRA →'}
            </button>
          )}

          {/* Estado finished */}
          {status === 'finished' && (
            <>
              <button
                onClick={handlePrimary}
                className="w-full py-4 rounded-xl font-bold text-title uppercase tracking-wide
                           transition-all active:scale-95 hover:brightness-110 focus-visible:outline-2
                           focus-visible:outline-offset-2"
                style={{ background: 'var(--accent)', color: '#fff' }}
                aria-label="Iniciar nova partida"
              >
                NOVA RESSACA →
              </button>
              <button
                onClick={() => navigate('/scoreboard')}
                className="w-full py-3 rounded-xl font-bold text-body uppercase tracking-wide
                           border transition-all active:scale-95 hover:brightness-110
                           focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{
                  borderColor: 'var(--accent)',
                  color: 'var(--accent)',
                  background: 'var(--accent-bg)',
                }}
                aria-label="Ver o placar da última partida"
              >
                VER PLACAR
              </button>
            </>
          )}

          {/* CTA secundário — ver último placar (idle/setup com jogo salvo) */}
          {status === 'idle' && savedGame && (
            <button
              onClick={() => navigate('/scoreboard')}
              className="w-full py-3 rounded-xl font-bold text-body uppercase tracking-wide
                         border transition-all active:scale-95 hover:brightness-110
                         focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text)',
                background: 'transparent',
              }}
              aria-label="Ver o placar da última partida salva"
            >
              VER ÚLTIMO PLACAR
            </button>
          )}
        </section>

        {/* ── Manual do Rato ───────────────────────────────────────── */}
        <section aria-labelledby="rules-heading">
          <h2
            id="rules-heading"
            className="text-label mb-4"
            style={{ color: 'var(--accent)' }}
          >
            § Manual do Rato — As Regras
          </h2>

          <ol className="flex flex-col gap-3" role="list">
            {RULES.map((rule) => (
              <li
                key={rule.number}
                className="flex gap-4 p-4 rounded-xl"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <span
                  className="text-title font-black shrink-0 w-6 text-center"
                  style={{ color: 'var(--accent)' }}
                  aria-hidden="true"
                >
                  {rule.number}
                </span>
                <span className="text-body" style={{ color: 'var(--text-h)' }}>
                  {rule.text}
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Bem-estar ────────────────────────────────────────────── */}
        <section
          className="p-5 rounded-xl"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          aria-labelledby="wellbeing-heading"
        >
          <h2
            id="wellbeing-heading"
            className="text-label mb-4"
            style={{ color: 'var(--accent)' }}
          >
            ⚠️ Antes de começar
          </h2>

          <ul className="flex flex-col gap-2" role="list">
            {WELLBEING.map((item) => (
              <li
                key={item.text}
                className="flex items-start gap-3 text-body"
                style={{ color: 'var(--text-h)' }}
              >
                <span
                  className="shrink-0 mt-0.5 w-5 h-5 rounded flex items-center justify-center text-xs font-bold"
                  style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}
                  aria-hidden="true"
                >
                  ✓
                </span>
                {item.text}
              </li>
            ))}
          </ul>
        </section>
      </main>

      {/* ── Rodapé ───────────────────────────────────────────────── */}
      <footer
        className="text-center py-6 text-label"
        style={{
          color: 'var(--text)',
          borderTop: '1px solid var(--border)',
        }}
      >
        18+ · BEBA COM MODERAÇÃO · RATOS NÃO DIRIGEM
      </footer>
    </div>
  )
}
