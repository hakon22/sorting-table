import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import dotenv from 'dotenv';

let dir = path.dirname(fileURLToPath(import.meta.url));

for (;;) {
  const envPath = path.join(dir, '.env');
  if (existsSync(envPath)) {
    dotenv.config({
      path: envPath,
    });
    break;
  }

  const parent = path.dirname(dir);
  if (parent === dir) {
    break;
  }

  dir = parent;
}
