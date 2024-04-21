import chalk from 'chalk';
import { exec } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as Core from '../core/src';

const { IconStyle } = (Core as unknown as { default: typeof Core }).default;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ASSETS_PATH = path.join(__dirname, '../core/assets');
export const OUTPUT_PATH = path.join(__dirname, '../src/icons');
export const WEIGHTS_PATH = path.join(__dirname, '../src/weights');
export const WEIGHTS = Object.values(IconStyle);

export type AssetMap = Record<string, Record<Core.IconStyle, string>>;

const transformJSX = (jsx: string) =>
  jsx
    .replace(/^.*<\?xml.*?\>/g, '')
    .replace(/<svg.*?>/g, '')
    .replace(/<\/svg>/g, '')
    .replace(
      /<rect width="25[\d,\.]+" height="25[\d,\.]+" fill="none".*?\/>/g,
      '',
    )
    .replace(/<title.*?/, '')
    .replace(/"#0+"/g, '{color}')
    .replace(/currentColor/g, '{color}')
    .replace(/fill\-rule/g, 'fillRule')
    .replace(/stroke-linecap/g, 'strokeLinecap')
    .replace(/stroke-linejoin/g, 'strokeLinejoin')
    .replace(/stroke-width/g, 'strokeWidth')
    .replace(/stroke-miterlimit/g, 'strokeMiterlimit');

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

async function generateComponents(icons: AssetMap) {
  let passes = 0;
  let fails = 0;

  if (fs.existsSync(OUTPUT_PATH)) {
    fs.rmSync(OUTPUT_PATH, { recursive: true });
  }
  fs.mkdirSync(OUTPUT_PATH);

  if (fs.existsSync(WEIGHTS_PATH)) {
    fs.rmSync(WEIGHTS_PATH, { recursive: true });
  }
  fs.mkdirSync(WEIGHTS_PATH);

  await Promise.all(
    WEIGHTS.map(
      (w) =>
        new Promise<void>((res) =>
          fs.mkdir(path.join(OUTPUT_PATH, w), () => res()),
        ),
    ),
  );

  for (const key in icons) {
    const icon = icons[key];
    const name = pascalize(key);

    for (const [weight, svg] of Object.entries(icon)) {
      const iconString = `/* GENERATED FILE */
import { BaseIcon, type IconProps } from '../../icon';

export const ${name}Icon = (props: IconProps) => {
  return <BaseIcon {...props} path={<>${svg}</>} />;
};
`;

      try {
        fs.writeFileSync(
          path.join(OUTPUT_PATH, weight, `${key}.tsx`),
          iconString,
        );
        console.log(`${chalk.inverse.green(' DONE ')} ${key}-${weight}`);
        passes += 1;
      } catch (err) {
        console.error(
          `${chalk.inverse.red(' FAIL ')} ${key}-${weight} could not be saved`,
        );
        console.group();
        console.error(err);
        console.groupEnd();
        fails += 1;
      }
    }
  }
  if (passes > 0)
    console.log(
      chalk.green(`${passes} component${passes > 1 ? 's' : ''} generated`),
    );
  if (fails > 0)
    console.log(chalk.red(`${fails} component${fails > 1 ? 's' : ''} failed`));
}

function generateExports(icons: AssetMap) {
  const indexes: Record<Core.IconStyle, string> = {
    bold: '',
    duotone: '',
    fill: '',
    light: '',
    regular: '',
    thin: '',
  };
  for (const key in icons) {
    const name = pascalize(key);
    for (const weight in icons[key]) {
      indexes[weight as Core.IconStyle] +=
        `export * from '../icons/${weight}/${key}';\n`;
    }
  }
  try {
    for (const [weight, index] of Object.entries(indexes))
      fs.writeFileSync(
        path.join(__dirname, `../src/weights/${weight}.ts`),
        index,
      );
    console.log(chalk.green('Export success'));
  } catch (err) {
    console.error(chalk.red('Export failed'));
    console.group();
    console.error(err);
    console.groupEnd();
  }
}

function pascalize(str: string) {
  return str
    .split('-')
    .map((str) => str.replace(/^\w/, (c) => c.toUpperCase()))
    .join('');
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
    generateExports(icons);
  },
);
