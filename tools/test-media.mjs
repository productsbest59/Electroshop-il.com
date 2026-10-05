import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {localImageMap,localImagePath} from '../shop-local-image-map.js';
import {improveInlineImages} from '../shop-image-alt.js';
const root=new URL('../',import.meta.url),errors=[];
for(const file of fs.readdirSync(root)){
 const url=new URL(file,root);if(!/\.(js|html)$/.test(file))continue;const source=fs.readFileSync(url,'utf8');
 try{
   if(file.endsWith('.js'))new vm.SourceTextModule(source);
   else for(const match of source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
     if(!match[2].trim()||/application\/ld\+json|application\/json/.test(match[1]))continue;
     if(/type=["']module/.test(match[1]))new vm.SourceTextModule(match[2]);else new vm.Script(match[2],{filename:file});
   }
 }catch(error){errors.push({file,error:error.message})}
}
assert.deepEqual(errors,[],'Site scripts must parse');
for(const [original,converted] of Object.entries(localImageMap)){
 assert(fs.existsSync(new URL(original,root)),original);assert(fs.existsSync(new URL(converted,root)),converted);
 assert(fs.statSync(new URL(converted,root)).size<fs.statSync(new URL(original,root)).size);
 assert.equal(localImagePath(original+'?v=2'),converted+'?v=2');
}
const input='<h2 style="text-align:right">בדיקת מסך</h2><p dir="rtl"><img src="old.png" alt="תמונה 1" style="width:50%"></p><img src="kept.png" alt="תיאור ידני">';
const result=improveInlineImages(input,'תיקון טלפון','he',src=>src==='old.png'?'new.webp':src);
assert(result.includes('alt="תיקון טלפון – בדיקת מסך"'));assert(result.includes('alt="תיאור ידני"'));assert(result.includes('style="text-align:right"'));assert(result.includes('style="width:50%"'));assert(result.includes('src="new.webp"'));
assert.equal(improveInlineImages(result,'תיקון טלפון','he'),result,'ALT normalization must be idempotent');
assert.equal(localImagePath('https://example.com/photo.jpg'),'https://example.com/photo.jpg');
assert.equal(localImagePath('missing.jpg'),'missing.jpg');
console.log(JSON.stringify({syntax:'passed',localMappings:Object.keys(localImageMap).length,alt:'passed',preservedAlignment:true}));
