import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const footballPath = path.join(currentDir, '..', 'fictional-football', 'experiments.json');
const entertainmentPath = path.join(currentDir, 'experiments.json');
const experiments = [
  ...JSON.parse(fs.readFileSync(footballPath, 'utf8')).map((item) => ({ ...item, line: 'fictional-football' })),
  ...JSON.parse(fs.readFileSync(entertainmentPath, 'utf8')).map((item) => ({ ...item, line: 'fictional-entertainment' })),
];

fs.writeFileSync(
  path.join(currentDir, 'hub-data.js'),
  `window.EXPERIMENTS = ${JSON.stringify(experiments, null, 2)};\n`,
  'utf8',
);
