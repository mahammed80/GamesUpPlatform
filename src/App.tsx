import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminApp from './AdminApp';
import { Website } from './components/website/Website';
import { StoreSettingsProvider } from './context/StoreSettingsContext';

export default function App() {
  return (
    <StoreSettingsProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Website />} />
          <Route path="/admin/*" element={<AdminApp />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </StoreSettingsProvider>
  );
}
