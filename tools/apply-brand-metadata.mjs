import {readdir,readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const revision='robot-20261005';
export const shareImage='https://electroshop-il.com/images/electroshop-share-banner.jpg?v='+revision;
const alt='אלקטרושופ — מעבדת תיקונים, סלולר ואביזרים';
export const brandHead=`<!-- Electroshop shared branding -->
<link rel="icon" type="image/x-icon" href="/favicon.ico?v=${revision}">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=${revision}">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=${revision}">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=${revision}">
<link rel="manifest" href="/site.webmanifest?v=${revision}">
<meta property="og:image" content="${shareImage}">
<meta property="og:image:secure_url" content="${shareImage}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="2110">
<meta property="og:image:height" content="745">
<meta property="og:image:alt" content="${alt}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${shareImage}">
<meta name="twitter:image:alt" content="${alt}">
<!-- /Electroshop shared branding -->`;
const attribute=(tag,name)=>new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`,'i').exec(tag)?.[1]||'';
export function applyBrandHead(html){
 if(!/<\/head\s*>/i.test(html))return html;
 let result=html.replace(/<!-- Electroshop shared branding -->[^]*?<!-- \/Electroshop shared branding -->\n?/g,'');
 result=result.replace(/<link\b[^>]*>/gi,tag=>{
  const rel=attribute(tag,'rel').toLowerCase().split(/\s+/);
  return rel.some(r=>['icon','apple-touch-icon','apple-touch-icon-precomposed','manifest','mask-icon'].includes(r))?'':tag;
 }).replace(/<meta\b[^>]*>/gi,tag=>{
  const key=(attribute(tag,'property')||attribute(tag,'name')).toLowerCase();
  return key==='og:image'||key.startsWith('og:image:')||key==='twitter:card'||key==='twitter:image'||key.startsWith('twitter:image:')||key==='msapplication-tileimage'?'':tag;
 });
 return result.replace(/<\/head\s*>/i,brandHead+'\n</head>');
}
export async function applyBrandMetadata(){
 let changed=0;
 for(const file of (await readdir(root)).filter(f=>f.endsWith('.html'))){
  const target=path.join(root,file),source=await readFile(target,'utf8'),result=applyBrandHead(source);
  if(result!==source){await writeFile(target,result,'utf8');changed++;}
 }
 console.log(`Shared branding applied to ${changed} pages.`);
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await applyBrandMetadata();
