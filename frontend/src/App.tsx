import { type ReactElement } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar';
import Dashboard from './pages/Dashboard';
import JobDetail from './pages/JobDetail';

function App(): ReactElement {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
        <NavBar />
        <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
          <Routes>
            <Route path="/" element={<Navigate to="/jobs" replace />} />
            <Route path="/jobs" element={<Dashboard />} />
            <Route path="/jobs/:id" element={<JobDetail />} />
          </Routes>
        </main>
        <footer className="bg-black py-8">
          <p className="text-center text-xs text-white/60">Thanks for your consideration!</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
