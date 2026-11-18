// Prepare the make.fun entry in an output directory: copy game/ and any repository
// screenshots/, then write dossier.json. MAKEFUN_OUTPUT_DIR stands in for /output
// when running outside the grader.
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = dirname(fileURLToPath(import.meta.url));
const output = process.env.MAKEFUN_OUTPUT_DIR || '/output';

mkdirSync(output, { recursive: true });
cpSync(join(here, 'game'), join(output, 'game'), { recursive: true });

const outputScreenshots = join(output, 'screenshots');
mkdirSync(outputScreenshots, { recursive: true });
const sourceScreenshots = join(here, 'screenshots');
if (existsSync(sourceScreenshots)) {
  cpSync(sourceScreenshots, outputScreenshots, { recursive: true });
}

const dossier = buildDossier(output, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(output, 'dossier.json'), dossier);
