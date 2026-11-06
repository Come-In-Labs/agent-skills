// Persona kit example for cil:ux-review. Copy it into the product repo (a git-ignored
// folder inside it, so the repo's path aliases and .env resolve) and fill in the five
// PRODUCT HOOKS. Everything else is generic: one persistent phone browser per persona,
// launched once in the background and driven step by step over CDP, so parallel persona
// agents never share a browser.
//
// Single-user dev machines only, against a local stack and throwaway accounts: while a
// persona browser runs, any local process can attach to its debugging port on 127.0.0.1
// and read its cookies. Make mintSession's sessions short-lived and revoke them on stop.
//
// Run with the repo's TypeScript runner, e.g.
//   node --env-file-if-exists=.env --import tsx <kit>/persona-kit.mts <command> <key> ...
//
//   setup   <key> "<Name>" <locale>   account + this persona's own world
//   browser <key> <port> <locale>     run in the background; prints only "ready on port <port>"
//   act     <key> <port> goto <path> | click "<name or text>" | tap <x> <y>
//                        | drag <x1> <y1> <x2> <y2> | scroll <dy> | shot <name> | text | buttons | back | wait <ms>
//   day     <key> <n>                 move this persona's world to step n
//   activity <key> <amount>           what the persona does between days
//   cleanup <key>                     remove account, world and browser profile
import { mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { chromium } from '@playwright/test';

const WEB = process.env.PERSONA_WEB ?? 'http://localhost:5173';
// Screenshots and browser profiles, in a folder only this user can read.
const OUT = process.env.PERSONA_OUT ?? join(tmpdir(), `persona-kit-${process.getuid?.() ?? 'user'}`);
mkdirSync(OUT, { recursive: true, mode: 0o700 });

/** A local debugging port, as a number in the unprivileged range. */
function portOf(value: string | undefined): number {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error(`not a port: ${value}`);
  return port;
}

// ---- PRODUCT HOOKS: call the product's own functions, never raw SQL that skips side effects.
/** Create the persona's account and its own copy of anything time travel moves. Idempotent. */
async function createPersona(key: string, name: string, locale: string): Promise<{ startPath: string }> {
  throw new Error(`createPersona(${key}, ${name}, ${locale}) is not implemented for this product`);
}
/** A signed-in session cookie for the persona. It never leaves this process. */
async function mintSession(key: string): Promise<{ name: string; value: string; domain: string; revoke: () => Promise<void> }> {
  throw new Error(`mintSession(${key}) is not implemented for this product`);
}
/** Move this persona's world to step n (day, week, round), through the product's dev hook. */
async function moveTo(key: string, n: number): Promise<void> {
  throw new Error(`moveTo(${key}, ${n}) is not implemented for this product`);
}
/** Record what the persona did between steps (a session, a purchase, a visit). Note what this fakes. */
async function recordActivity(key: string, amount: number): Promise<void> {
  throw new Error(`recordActivity(${key}, ${amount}) is not implemented for this product`);
}
/** Delete the account and the persona's world. */
async function removePersona(key: string): Promise<void> {
  throw new Error(`removePersona(${key}) is not implemented for this product`);
}
// ---- end of product hooks

async function browser(key: string, port: number, locale: string) {
  const session = await mintSession(key);
  const context = await chromium.launchPersistentContext(`${OUT}/profile-${key}`, {
    headless: true,
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale,
    args: [`--remote-debugging-port=${port}`, '--remote-debugging-address=127.0.0.1'],
  });
  await context.addCookies([{ name: session.name, value: session.value, domain: session.domain, path: '/' }]);
  const page = context.pages()[0] ?? (await context.newPage());
  await page.goto(`${WEB}/`, { waitUntil: 'domcontentloaded' });
  console.log(`ready on port ${port}`);
  const stop = async () => {
    await session.revoke().catch(() => undefined);
    await context.close().catch(() => undefined);
    process.exit(0);
  };
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
  await new Promise(() => undefined);
}

async function act(key: string, port: number, verb: string, args: string[]) {
  // Attach to the persona's own browser; exiting this process leaves it running.
  const page = (await chromium.connectOverCDP(`http://127.0.0.1:${port}`)).contexts()[0].pages()[0];
  const settle = (ms = 1200) => page.waitForTimeout(ms);
  switch (verb) {
    case 'goto':
      // An app that keeps a live connection open never reaches "networkidle".
      await page.goto(`${WEB}${args[0] ?? '/'}`, { waitUntil: 'domcontentloaded' });
      await settle(2500);
      break;
    case 'click': {
      const name = args.join(' ');
      const candidates = [
        page.getByRole('button', { name, exact: true }),
        page.getByRole('link', { name, exact: true }),
        page.getByRole('button', { name }),
        page.getByRole('link', { name }),
        page.getByText(name, { exact: true }),
        page.getByText(name),
      ];
      let clicked = false;
      for (const candidate of candidates) {
        const visible = candidate.filter({ visible: true });
        if ((await visible.count()) > 0) {
          await visible.first().click({ timeout: 5000 });
          clicked = true;
          break;
        }
      }
      if (!clicked) console.log(`nothing visible called "${name}"; try "buttons" or "tap x y"`);
      await settle();
      break;
    }
    case 'tap':
      await page.mouse.click(Number(args[0]), Number(args[1]));
      await settle();
      break;
    case 'drag': {
      const [x1, y1, x2, y2] = args.map(Number);
      await page.mouse.move(x1, y1);
      await page.mouse.down();
      await page.mouse.move(x2, y2, { steps: 15 });
      await page.mouse.up();
      await settle();
      break;
    }
    case 'scroll':
      await page.mouse.move(195, 500);
      await page.mouse.wheel(0, Number(args[0] ?? 600));
      await settle(700);
      break;
    case 'shot': {
      const path = `${OUT}/${key}-${(args[0] ?? 'shot').replace(/[^a-z0-9-]/gi, '_')}.png`;
      await page.screenshot({ path });
      console.log(path); // the agent reads this file to see the screen
      break;
    }
    case 'text':
      console.log((await page.evaluate(() => document.body.innerText)).slice(0, 7000));
      break;
    case 'buttons':
      // Tappable things with centre coordinates. Elements behind overlays show up too; trust the screenshot.
      console.log(
        (
          await page.evaluate(() =>
            [...document.querySelectorAll('button, a, [role="button"]')]
              .map((el) => ({ el, r: el.getBoundingClientRect() }))
              .filter(({ r }) => r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight)
              .map(({ el, r }) => {
                const label = (el.getAttribute('aria-label') || (el as HTMLElement).innerText || '').trim().replace(/\s+/g, ' ').slice(0, 60);
                return `${label || '(no label)'} @ ${Math.round(r.x + r.width / 2)},${Math.round(r.y + r.height / 2)}`;
              }),
          )
        ).join('\n'),
      );
      break;
    case 'back':
      await page.goBack();
      await settle();
      break;
    case 'wait':
      await settle(Number(args[0] ?? 1000));
      break;
    default:
      throw new Error(`unknown act verb ${verb}`);
  }
  process.exit(0);
}

const [command, key, ...rest] = process.argv.slice(2);
try {
  if (!command || !key || !/^[a-z]+$/.test(key)) throw new Error('usage: persona-kit <command> <key> ...');
  if (command === 'setup') console.log(JSON.stringify(await createPersona(key, rest[0] ?? key, rest[1] ?? 'en')));
  else if (command === 'browser') await browser(key, portOf(rest[0]), rest[1] ?? 'en');
  else if (command === 'act') await act(key, portOf(rest[0]), rest[1], rest.slice(2));
  else if (command === 'day') await moveTo(key, Number(rest[0]));
  else if (command === 'activity') await recordActivity(key, Number(rest[0] ?? 1));
  else if (command === 'cleanup') {
    await removePersona(key);
    rmSync(`${OUT}/profile-${key}`, { recursive: true, force: true });
  } else throw new Error(`unknown command ${command}`);
  if (command !== 'browser') process.exit(0);
} catch (error) {
  console.error('FAILED', String(error).slice(0, 800));
  process.exit(1);
}
