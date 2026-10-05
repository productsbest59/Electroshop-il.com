import {readFile,writeFile} from 'node:fs/promises';
const base='supabase/functions/electroshop-sync-cellular/';
const parser=(await readFile(base+'parser.mjs','utf8')).replace(/^export /gm,'');
const handler=(await readFile(base+'index.ts','utf8')).replace("import {catalogue} from './parser.mjs';",'');
await writeFile('tools/electroshop-sync-cellular-deploy.ts','// Generated single-file dashboard deployment. Do not edit; regenerate from the source.\n'+parser+'\n'+handler);
console.log('Prepared a single file for the Supabase function editor.');
