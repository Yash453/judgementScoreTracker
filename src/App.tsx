import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Home } from './routes/Home';
import { NewGame } from './routes/NewGame';
import { Game } from './routes/Game';
import { History } from './routes/History';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/new" element={<NewGame />} />
        <Route path="/game" element={<Game />} />
        <Route path="/history" element={<History />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
