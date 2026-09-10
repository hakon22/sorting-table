import { createRoot } from 'react-dom/client';

import { AppProviders } from '@web/app/providers';
import '@web/styles/global.scss';

const root = document.getElementById('root');

if (root) {
  createRoot(root).render(<AppProviders />);
}
