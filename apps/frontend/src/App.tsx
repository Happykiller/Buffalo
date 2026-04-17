import { Routes, Route, Navigate } from 'react-router-dom';
import UserPage from './pages/UserPage';
import AdminPage from './pages/AdminPage';
import StatsPage from './pages/StatsPage';

function App() {
    return (
        <Routes>
            <Route path="/user" element={<UserPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="*" element={<Navigate to="/user" replace />} />
        </Routes>
    );
}

export default App;
