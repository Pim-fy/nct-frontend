// src/App.jsx
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import AppRoutes from '@routes/AppRoutes';
import './App.css';

// ※ 전역 상태(user, config)는 ConfigContext 대신
//    useConfig / useAuth (TanStack Query 기반)로 관리합니다.

function App() {
  return (
    <HelmetProvider>
      <Helmet>
        <title>Ksteam</title>
      </Helmet>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;