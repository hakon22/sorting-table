import { App, ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { SortingBoard } from '@web/components/SortingBoard';

const routerBasename = (() => {
  const raw = import.meta.env.VITE_BASE_PATH || '/sorting-table/';
  if (raw === '/') {
    return '/';
  }

  return raw.replace(/\/$/, '');
})();

export const AppProviders = () => {
  return (
    <ConfigProvider
      locale={ruRU}
      theme={{
        token: {
          colorPrimary: '#1E3A5F',
          borderRadius: 8,
        },
      }}
    >
      <App
        style={{
          minHeight: '100%',
        }}
        message={{
          duration: 6,
          maxCount: 3,
        }}
      >
        <BrowserRouter basename={routerBasename}>
          <Routes>
            <Route path="/" element={<SortingBoard />} />
          </Routes>
        </BrowserRouter>
      </App>
    </ConfigProvider>
  );
};
