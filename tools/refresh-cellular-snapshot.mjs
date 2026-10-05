// Explicit maintainer action; never run implicitly during a page build.
import {readFile,writeFile} from 'node:fs/promises';
import {catalogue,parse019} from '../supabase/functions/electroshop-sync-cellular/parser.mjs';
// A maintainer may supply HTML exported from the same public catalogue in a browser
// when its server refuses automated requests. Never follow registration links.
const htmlIndex = process.argv.indexOf('--019-html');
const public019Html = htmlIndex >= 0 ? await readFile(process.argv[htmlIndex + 1], 'utf8') : null;
const results = await Promise.all(['pelephone','partner','019'].map(provider => provider === '019' && public019Html
  ? {provider,checked_at:new Date().toISOString(),plans:parse019(public019Html)} : catalogue(provider)));
// All providers must succeed before replacing the committed fallback snapshot.
await writeFile('cellular-data.json', JSON.stringify(results, null, 2)+'\n');
console.log(results.map(r => `${r.provider}: ${r.plans.length} plans`).join('\n'));
