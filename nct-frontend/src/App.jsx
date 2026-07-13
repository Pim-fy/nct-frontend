// src/App.jsx
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { ConfigProvider } from '@context/ConfigContext';
import AppRoutes from '@routes/AppRoutes';
import './App.css';

function App() {
  return (
    <HelmetProvider>
      <Helmet>
        <title>Ksteam</title>
      </Helmet>
      <ConfigProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ConfigProvider>
    </HelmetProvider>
  );
}

export default App;
