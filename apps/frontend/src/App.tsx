import { Routes, Route, Navigate } from 'react-router-dom';
import UserPage from './pages/UserPage';
import AdminPage from './pages/AdminPage';
import StatsPage from './pages/StatsPage';
import DailyBoardPage from './pages/DailyBoardPage';
import UserShell from './components/UserShell';

function App() {
    return (
        <Routes>
            <Route path="/user" element={<UserPage />} />
            <Route path="/user/ticketing" element={<UserShell />}>
                <Route index element={<UserPage />} />
            </Route>
            <Route path="/user/daily" element={<UserShell />}>
                <Route index element={<DailyBoardPage />} />
            </Route>
            <Route path="/user/stats" element={<UserShell />}>
                <Route index element={<StatsPage />} />
            </Route>
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/stats" element={<Navigate to="/user/stats" replace />} />
            <Route path="*" element={<Navigate to="/user" replace />} />
        </Routes>
    );
}

export default App;
