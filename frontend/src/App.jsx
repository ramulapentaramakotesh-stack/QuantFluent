import ChatInterface from './components/ChatInterface'
import AuthGuard from './components/AuthGuard'
import './App.css'

function App() {
  return (
    <AuthGuard>
      <ChatInterface />
    </AuthGuard>
  )
}

export default App