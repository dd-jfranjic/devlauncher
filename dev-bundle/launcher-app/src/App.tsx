import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import NewProjectPage from './pages/NewProjectPage'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/new-project" element={<NewProjectPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App