import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider, theme } from 'antd'
import './index.css'
import Router from './router'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 0 },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: '#e63946',
            colorBgBase: '#1a1a1a',
            colorBgContainer: '#222222',
            borderRadius: 8,
            fontFamily: "system-ui, 'Segoe UI', Roboto, sans-serif",
          },
        }}
      >
        <BrowserRouter>
          <Router />
        </BrowserRouter>
      </ConfigProvider>
    </QueryClientProvider>
  </StrictMode>,
)
