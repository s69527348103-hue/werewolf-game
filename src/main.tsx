import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { DrivingQuiz } from './components/screens/DrivingQuiz.tsx'

const isQuizRoute = typeof window !== 'undefined' && window.location.pathname.replace(/\/+$/, '') === '/quiz'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isQuizRoute ? <DrivingQuiz /> : <App />}
  </StrictMode>,
)
