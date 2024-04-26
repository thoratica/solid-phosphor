import chalk from 'chalk';
import { exec } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as Core from '../core/src/index.ts';

const { IconStyle } = (Core as unknown as { default: typeof Core }).default;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ASSETS_PATH = path.join(__dirname, '../core/assets');
export const DIST_PATH = path.join(__dirname, '../dist');
export const WEIGHTS = Object.values(IconStyle);

export type AssetMap = Record<string, Record<Core.IconStyle, string>>;

const transformJSX = (contents: string) =>
  contents
    .replace(/^.*<\?xml.*?\>/g, '')
    .replace(/<svg.*?>/g, '')
    .replace(/<\/svg>/g, '');

function readIcons(): AssetMap {
  const assetsDir = fs.readdirSync(ASSETS_PATH, 'utf-8');
  const icons: AssetMap = {};

  for (const weight of assetsDir) {
    if (!fs.lstatSync(path.join(ASSETS_PATH, weight)).isDirectory()) continue;
    if (!WEIGHTS.includes(weight as Core.IconStyle)) {
      console.error(`${chalk.inverse.red(' FAIL ')} Invalid weight ${weight}`);
      process.exit(1);
    }

    const files = fs.readdirSync(path.join(ASSETS_PATH, weight));

    for (const filename of files) {
      let name = filename.split('.svg')[0];
      const lastIdx = name.lastIndexOf('-');
      if (name.slice(lastIdx + 1) === weight) name = name.slice(0, lastIdx);

      if (!icons[name]) icons[name] = {} as Record<Core.IconStyle, string>;

      const assetPath = path.join(ASSETS_PATH, weight, filename);
      const asset = fs.readFileSync(assetPath, 'utf-8');
      icons[name][weight as Core.IconStyle] = transformJSX(asset);
    }
  }

  return icons;
}

function verifyIcons(icons: AssetMap) {
  let fails = 0;

  for (const [name, icon] of Object.entries(icons)) {
    const weightsPresent = Object.keys(icon);

    if (
      !(
        weightsPresent.length === 6 &&
        weightsPresent.every(
          (w) =>
            WEIGHTS.includes(w as Core.IconStyle) && icon[w as Core.IconStyle],
        )
      )
    ) {
      fails++;

      console.error(
        `${chalk.inverse.red(' FAIL ')} ${name} is missing weights`,
      );
      console.group();
      console.error(WEIGHTS.filter((w) => !Object.keys(icon).includes(w)));
      console.groupEnd();
    }
  }

  return fails === 0;
}

function pascalize(str: string) {
  return str
    .split('-')
    .map((str) => str.replace(/^\w/, (c) => c.toUpperCase()))
    .join('');
}

async function generateComponents(icons: AssetMap) {
  let passes = 0;
  let fails = 0;

  if (!fs.existsSync(DIST_PATH)) fs.mkdirSync(DIST_PATH);

  await Promise.all(
    WEIGHTS.map(
      (w) =>
        new Promise<void>((res) =>
          fs.mkdir(path.join(DIST_PATH, w), () => res()),
        ),
    ),
  );

  let types = "import type { PhosphorIcon } from '../lib/index.d.ts';\n\n";
  const indexes: Record<Core.IconStyle, [string, string][]> = {
    bold: [],
    duotone: [],
    fill: [],
    light: [],
    regular: [],
    thin: [],
  };

  for (const key in icons) {
    const icon = icons[key];
    const name = pascalize(key);

    types += `export declare const ${name}Icon: PhosphorIcon;\n`;
    for (const [weight, svg] of Object.entries(icon)) {
      indexes[weight as Core.IconStyle].push([
        name,
        `function ${name}Icon(props) {
  return IconTemplate(
    '${svg}',
    props,
  );
};
`,
      ]);
    }
  }
  for (const [weight, items] of Object.entries(indexes)) {
    try {
      fs.writeFileSync(
        path.join(DIST_PATH, weight, 'index.js'),
        `import { IconTemplate } from '../lib/index.js';\n\n${items
          .map(([_, block]) => `export ${block}`)
          .join('\n')}`,
      );
      fs.writeFileSync(
        path.join(DIST_PATH, weight, 'index.cjs'),
        `const { IconTemplate } = require('../lib/index.cjs');\n\n${items
          .map(([name, block]) => `module.exports.${name} = ${block}`)
          .join('\n')}`,
      );
      fs.writeFileSync(path.join(DIST_PATH, weight, 'index.d.ts'), types);
      console.log(`${chalk.inverse.green(' DONE ')} ${weight}`);
      passes += 1;
    } catch (err) {
      console.error(
        `${chalk.inverse.red(' FAIL ')} ${weight} could not be saved`,
      );
      console.group();
      console.error(err);
      console.groupEnd();
      fails += 1;
    }
  }

  if (passes > 0)
    console.log(
      chalk.green(`${passes} component${passes > 1 ? 's' : ''} generated`),
    );
  if (fails > 0)
    console.log(chalk.red(`${fails} component${fails > 1 ? 's' : ''} failed`));
}

exec(
  'git submodule update --remote --init --force --recursive',
  (err, _, stderr) => {
    if (err) {
      console.error(`${chalk.inverse.red(' ERR ')} ${err.message}`);
      process.exit(1);
    }

    if (stderr) {
      console.error(`${chalk.inverse.red(' ERR ')} ${stderr}`);
      process.exit(1);
    }

    console.log(
      `${chalk.inverse.green(' OK ')} Updated submodule @phosphor-icons/core`,
    );

    const icons = readIcons();
    if (!verifyIcons(icons)) {
      process.exit(1);
    }

    generateComponents(icons);
  },
);
