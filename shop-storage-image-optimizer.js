import {request,getSession,isAdmin,SUPABASE_URL,PUBLISHABLE_KEY} from './shop-api.js?v=media-webp-1';
import {prepareImageBlob} from './shop-image-upload.js';
import {improveInlineImages,genericImageAlt} from './shop-image-alt.js';

const buckets=['electroshop-product-images','electroshop-article-images'];
const reportKey='electroshop_image_optimization_report_v1';
const publicUrl=(bucket,path)=>`${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path.split('/').map(encodeURIComponent).join('/')}`;
async function listFiles(token,bucket,prefix=''){
  const files=[];
  for(let offset=0;;offset+=100){
    const entries=await request(`/storage/v1/object/list/${bucket}`,{method:'POST',token,body:{prefix,limit:100,offset,sortBy:{column:'name',order:'asc'}}});
    for(const entry of entries){const path=[prefix,entry.name].filter(Boolean).join('/');if(entry.id)files.push({...entry,path});else files.push(...await listFiles(token,bucket,path))}
    if(entries.length<100)break;
  }
  return files;
}
async function readImage(url){
  for(let attempt=0;attempt<4;attempt++){
    const response=await fetch(url);
    if(response.ok)return response;
    if(![429,502,503,504].includes(response.status)||attempt===3)throw Error('קריאה נכשלה: '+response.status);
    await new Promise(resolve=>setTimeout(resolve,1000*2**attempt));
  }
}
export async function optimizeStorageImages(session,progress,retryOnly=false){
  if(!await isAdmin(session))throw Error('נדרשת הרשאת מנהל אלקטרושופ');
  const report=retryOnly?JSON.parse(localStorage.getItem(reportKey)||'null'):{startedAt:new Date().toISOString(),total:0,converted:0,kept:0,alreadyWebp:0,updatedReferences:0,savedBytes:0,errors:[],changes:[],uploads:[]};
  if(!report)throw Error('לא נמצא דוח קודם');
  const retryFiles=retryOnly?report.errors.filter(error=>buckets.includes(error.bucket)&&error.path):[];
  if(retryOnly)report.errors=report.errors.filter(error=>!retryFiles.includes(error));
  const persist=()=>localStorage.setItem(reportKey,JSON.stringify(report));
  const mappings=new Map();
  for(const bucket of buckets){
    progress('סורק את '+bucket+'...');
    if(retryOnly&&!retryFiles.some(error=>error.bucket===bucket))continue;
    const files=await listFiles(session.accessToken,bucket),paths=new Set(files.map(f=>f.path)),candidates=files.filter(f=>/\.(?:png|jpe?g)$/i.test(f.path)&&(!retryOnly||retryFiles.some(error=>error.bucket===bucket&&error.path===f.path)));
    if(!retryOnly){report.total+=candidates.length;report.alreadyWebp+=files.filter(f=>/\.webp$/i.test(f.path)).length}persist();
    for(const file of candidates){
      progress(`מכין תמונה ${report.converted+report.kept+report.errors.length+1} מתוך ${report.total} — המקור נשמר`);
      try{
        const response=await readImage(publicUrl(bucket,file.path));
        const original=await response.blob(),destination=file.path+'.optimized.webp';let converted;
        if(paths.has(destination)){const existing=await readImage(publicUrl(bucket,destination));converted=await existing.blob()}
        else converted=await prepareImageBlob(original);
        if(converted.type!=='image/webp'||converted.size>=original.size){report.kept++;persist();continue}
        if(!paths.has(destination)){
          const fresh=await getSession();if(!fresh)throw Error('ההתחברות פגה');session=fresh;
          const upload=await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${destination.split('/').map(encodeURIComponent).join('/')}`,{method:'POST',headers:{apikey:PUBLISHABLE_KEY,Authorization:`Bearer ${session.accessToken}`,'Content-Type':'image/webp','x-upsert':'false'},body:converted});
          if(!upload.ok)throw Error('שמירה נכשלה: '+upload.status);
          report.uploads.push({bucket,source:file.path,destination});persist();
        }
        const verify=await readImage(publicUrl(bucket,destination));
        const sourceBitmap=await createImageBitmap(original),resultBitmap=await createImageBitmap(await verify.blob());
        const same=sourceBitmap.width===resultBitmap.width&&sourceBitmap.height===resultBitmap.height;sourceBitmap.close();resultBitmap.close();if(!same)throw Error('ממדי התמונה השתנו');
        mappings.set(bucket+'/'+file.path,destination);report.converted++;report.savedBytes+=original.size-converted.size;persist();
      }catch(error){report.errors.push({bucket,path:file.path,message:error.message});persist()}
    }
  }
  const resolve=(value,bucket)=>{
    const text=String(value||''),prefix=`${SUPABASE_URL}/storage/v1/object/public/${bucket}/`,absolute=text.startsWith(prefix),path=absolute?decodeURIComponent(text.slice(prefix.length).split('?')[0]):text;
    const destination=mappings.get(bucket+'/'+path);return destination?(absolute?publicUrl(bucket,destination):destination):text;
  };
  const resolveUrl=value=>buckets.reduce((src,bucket)=>resolve(src,bucket),value);
  const update=async(table,row,body,guardField)=>{
    if(!Object.keys(body).length)return;
    const guard=guardField&&row[guardField]!=null?`&${guardField}=eq.${encodeURIComponent(row[guardField])}`:'';
    const key=row.id!=null?'id':'slug';
    const changed=await request(`/rest/v1/${table}?${key}=eq.${encodeURIComponent(row[key])}${guard}`,{method:'PATCH',token:session.accessToken,body,headers:{Prefer:'return=representation'}});
    if(!changed?.length)throw Error('הפריט השתנה בזמן העבודה; לא נדרס');
    for(const [field,after] of Object.entries(body)){report.changes.push({table,id:row[key],field,before:row[field],after});report.updatedReferences++}persist();
  };
  progress('מעדכן קישורי תמונות ותיאורים בלבד...');
  // Fetch current rows after conversion; guard original values against concurrent edits.
  const images=await request('/rest/v1/electroshop_product_images?select=id,storage_path',{token:session.accessToken});
  for(const row of images){const after=resolve(row.storage_path,buckets[0]);if(after!==row.storage_path)try{await update('electroshop_product_images',row,{storage_path:after},'storage_path')}catch(e){report.errors.push({id:row.id,message:e.message})}}
  const categories=await request('/rest/v1/electroshop_categories?select=*',{token:session.accessToken});
  for(const row of categories)for(const field of ['image_path','banner_path']){const after=resolve(row[field],buckets[0]);if(row[field]&&after!==row[field])try{await update('electroshop_categories',row,{[field]:after},field)}catch(e){report.errors.push({id:row.id,message:e.message})}}
  const articles=await request('/rest/v1/electroshop_articles?select=*',{token:session.accessToken});
  for(const row of articles){const body={},cover=resolve(row.cover_path,buckets[1]);if(row.cover_path&&cover!==row.cover_path)body.cover_path=cover;
    for(const lang of ['he','en']){
      const title=row['title_'+lang]||row.title_he,alt='cover_alt_'+lang,field='content_'+lang;
      if(row.cover_path&&genericImageAlt(row[alt])&&title)body[alt]=title;
      const content=improveInlineImages(row[field],title,lang,resolveUrl);if(content!==String(row[field]||''))body[field]=content;
    }
    try{await update('electroshop_articles',row,body,'updated_at')}catch(e){report.errors.push({id:row.id,message:e.message})}
  }
  report.finishedAt=new Date().toISOString();persist();return report;
}

export function mountStorageOptimizer(anchor,session){
  const panel=document.createElement('section');panel.className='storage-image-optimizer';panel.style.cssText='background:#111;color:#fff;border:2px solid #ffa900;border-radius:14px;padding:16px;margin:16px 0;font-family:Arial,sans-serif';
  panel.innerHTML='<h2 style="font-size:20px;margin:0 0 8px">אופטימיזציית תמונות אלקטרושופ</h2><p>שיפור תמונות האחסון ותיאורי הכתבות. המקורות נשמרים, ללא שינוי במוצרים או במחירים.</p><button type="button" class="button" data-optimize>המרת תמונות האחסון ל-WebP</button><p role="status" data-progress></p><details><summary>דוח הפעולה האחרון</summary><pre data-report style="white-space:pre-wrap;max-height:300px;overflow:auto;direction:ltr;font-size:12px"></pre></details>';
  anchor.before(panel);const button=panel.querySelector('[data-optimize]'),status=panel.querySelector('[data-progress]'),output=panel.querySelector('[data-report]');
  const retry=document.createElement('button');retry.type='button';retry.className='button';retry.textContent='ניסיון חוזר לתמונות שנכשלו בלבד';retry.hidden=true;button.after(retry);
  const show=report=>{output.textContent=JSON.stringify(report,null,2);status.textContent=`הסתיים: ${report.converted} תמונות הומרו, ${report.kept} נשארו במקור, ${report.updatedReferences} שדות עודכנו. חיסכון בטעינת התמונות: ${(report.savedBytes/1048576).toFixed(1)} MB. שגיאות: ${report.errors.length}. המקורות לא נמחקו.`};
  try{const previous=JSON.parse(localStorage.getItem(reportKey)||'null');if(previous){output.textContent=JSON.stringify(previous,null,2);retry.hidden=!previous.errors.some(error=>error.bucket&&error.path);if(previous.finishedAt)show(previous)}}catch{}
  retry.onclick=async()=>{retry.disabled=true;button.disabled=true;try{show(await optimizeStorageImages(session,message=>status.textContent=message,true));retry.hidden=true}catch(error){status.textContent='נעצר: '+error.message}finally{retry.disabled=false;button.disabled=false}};
  button.onclick=async()=>{button.disabled=true;try{const report=await optimizeStorageImages(session,message=>status.textContent=message);show(report)}catch(error){status.textContent='נעצר: '+error.message;try{output.textContent=localStorage.getItem(reportKey)||''}catch{}}finally{button.disabled=false}};
}
