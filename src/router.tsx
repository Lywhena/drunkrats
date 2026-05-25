import { Navigate, Route, Routes } from 'react-router-dom'
import { useGameStore } from '@/store/useGameStore'
import HomePage from '@/features/home/HomePage'
import PlayersPage from '@/features/players/PlayersPage'
import ControlPage from '@/features/control/ControlPage'
import ScoreboardPage from '@/features/scoreboard/ScoreboardPage'
import DrinkPage from '@/features/drink/DrinkPage'

// ── Route guards ───────────────────────────────────────────────────────────

function PlayersGuard({ children }: { children: React.ReactNode }) {
  const status = useGameStore((s) => s.status)
  return status === 'setup' ? <>{children}</> : <Navigate to="/" replace />
}

function ControlGuard({ children }: { children: React.ReactNode }) {
  const status = useGameStore((s) => s.status)
  return status === 'playing' ? <>{children}</> : <Navigate to="/" replace />
}

function ScoreboardGuard({ children }: { children: React.ReactNode }) {
  const status = useGameStore((s) => s.status)
  return status === 'playing' || status === 'finished' ? (
    <>{children}</>
  ) : (
    <Navigate to="/" replace />
  )
}

function DrinkGuard({ children }: { children: React.ReactNode }) {
  const status = useGameStore((s) => s.status)
  return status === 'playing' ? <>{children}</> : <Navigate to="/control" replace />
}

// ── Router ─────────────────────────────────────────────────────────────────

export default function Router() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route
        path="/players"
        element={
          <PlayersGuard>
            <PlayersPage />
          </PlayersGuard>
        }
      />

      <Route
        path="/control"
        element={
          <ControlGuard>
            <ControlPage />
          </ControlGuard>
        }
      />

      <Route
        path="/scoreboard"
        element={
          <ScoreboardGuard>
            <ScoreboardPage />
          </ScoreboardGuard>
        }
      />

      <Route
        path="/drink"
        element={
          <DrinkGuard>
            <DrinkPage />
          </DrinkGuard>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
