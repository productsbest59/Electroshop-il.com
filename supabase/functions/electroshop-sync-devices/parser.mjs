export const catalogueURL='https://www.pelephone.co.il/ds/ShopDevicesApi/GetCategoryDevices/?lcId=1037&deviceTypeIds=12&snCode=PCITY&shopOrg=pcity';
export function jsonAfter(text,marker){
 const start=text.indexOf(marker);if(start<0)throw Error('נתוני המקור חסרים');
 let i=start+marker.length;while(/\s/.test(text[i]))i++;const begin=i;let depth=0,quoted=false,escape=false;
 for(;i<text.length;i++){const ch=text[i];if(quoted){if(escape)escape=false;else if(ch==='\\')escape=true;else if(ch==='"')quoted=false;continue}if(ch==='"')quoted=true;else if(ch==='{'||ch==='[')depth++;else if(ch==='}'||ch===']'){if(--depth===0)return JSON.parse(text.slice(begin,i+1))}}
 throw Error('נתוני המקור אינם שלמים');
}
export async function sourceText(url){const response=await fetch(url,{signal:AbortSignal.timeout(25000)});if(!response.ok)throw Error('פלאפון לא החזירה נתונים: '+response.status);return response.text()}
export async function catalogue(){const rows=jsonAfter(await sourceText(catalogueURL),'datasource.devices = ');if(!Array.isArray(rows)||rows.length<1)throw Error('קטלוג המקור ריק');return rows}
const decode=s=>String(s||'').replace(/&#(x[0-9a-f]+|\d+);/gi,(_,v)=>String.fromCodePoint(v[0].toLowerCase()==='x'?parseInt(v.slice(1),16):Number(v))).replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ');
const imageURL=p=>{const url=new URL(p,'https://www.pelephone.co.il/ds/');if(url.origin!=='https://www.pelephone.co.il')throw Error('מקור תמונה לא צפוי');return url.href};
export function parseDevice(row,html){
 const d=jsonAfter(html,"datasource['device']=");if(d.objId!==row.objId)throw Error('מזהה המכשיר אינו תואם');
 const colors=jsonAfter(html,"datasource['colors']=");const capacities=jsonAfter(html,"datasource['capacities']=");
 const variants=[],images=[];
 for(const m of d.makats||[]){
  const payment=m.paymentTypes?.find(p=>p.type==='cash');const price=Number(payment?.priceDigital??payment?.price);
  if(!payment||!Number.isFinite(price)||price<=0)throw Error('חסר מחיר תקין לאחת האפשרויות');
  const c=colors.find(c=>c.objId===m.colorId),size=capacities.find(c=>c.objId===m.capacityId);
  if(m.colorId&&!c||m.capacityId&&!size)throw Error('צבע או נפח לא מזוהים');
  const color=c?.displayName||c?.name||'',capacity=size?.name||'';
  const variant={color,size:capacity,style:'',price,available:m.isInStock===true,sourceId:String(m.objId)};
  const previous=variants.find(v=>v.color===color&&v.size===capacity);if(previous&&previous.price!==price)throw Error('מחירים סותרים לאותו שילוב');if(!previous)variants.push(variant);
  for(const img of m.images||[]){const url=imageURL(img.imageUrl);if(!images.some(x=>x.url===url))images.push({url,color})}
 }
 if(!variants.length||!images.length)throw Error('למכשיר חסרות אפשרויות או תמונות');
 const description=decode(html.match(/<meta property="og:description" content="([^"]*)"/i)?.[1]||'');
 return {source_id:String(row.objId),sku:'PELEPHONE-'+row.objId,name_he:row.nameHeb||row.name,name_en:row.name,description_he:description,description_en:row.name,source_url:new URL(row.url,'https://www.pelephone.co.il').href,price:Math.min(...variants.map(v=>v.price)),variants,images};
}
export async function device(row){const url=new URL(row.url,'https://www.pelephone.co.il');if(url.origin!=='https://www.pelephone.co.il'||!url.pathname.startsWith('/ds/heb/eshop/at/pcity/product/devices/'))throw Error('כתובת מכשיר לא תקינה');return parseDevice(row,await sourceText(url.href))}
