import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const source = join(projectRoot, 'dist', 'Proyectocalidad', 'browser');
const destination = join(projectRoot, 'portable', 'app');

if (!existsSync(source)) {
  throw new Error('No se encontró la compilación. Ejecuta primero npm run build.');
}

rmSync(destination, { recursive: true, force: true });
mkdirSync(destination, { recursive: true });
cpSync(source, destination, { recursive: true });

console.log(`Versión portable actualizada en: ${destination}`);
