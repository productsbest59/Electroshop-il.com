import fs from 'node:fs';
import crypto from 'node:crypto';
import {getProducts} from '../shop-api.js';
const products=await getProducts(),sources=new Map();
for(const product of products)for(const url of product.images||[])if(url.startsWith('https://www.pelephone.co.il/'))sources.set(url,product.nameEn||product.nameHe);
fs.mkdirSync('images/smartphones-source',{recursive:true});const report=[];
for(const [url,title] of sources){
 const parsed=new URL(url),basename=decodeURIComponent(parsed.pathname.split('/').pop()).replace(/[^a-zA-Z0-9._-]+/g,'-'),hash=crypto.createHash('sha256').update(url).digest('hex').slice(0,12),path='images/smartphones-source/'+hash+'-'+basename;
 try{
   if(!fs.existsSync(path)){const response=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error('HTTP '+response.status);const buffer=Buffer.from(await response.arrayBuffer());if(!/^image\/(png|jpeg|webp)/i.test(response.headers.get('content-type')||''))throw Error('Not a supported image');fs.writeFileSync(path,buffer)}
   report.push({url,title,path,bytes:fs.statSync(path).size});
 }catch(error){report.push({url,title,error:error.message})}
 if(report.length%25===0)console.log(JSON.stringify({downloaded:report.filter(row=>row.path).length,total:sources.size}));
}
fs.writeFileSync('tools/supplier-image-report.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({downloaded:report.filter(row=>row.path).length,errors:report.filter(row=>row.error).length}));
