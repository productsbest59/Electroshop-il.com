import {request,getSession,isAdmin,SUPABASE_URL,PUBLISHABLE_KEY} from './shop-api.js?v=multi-category-1';
const fixed=['mobile','pro-audio','car-mounts','guitars','chargers-cables','earphones'];
const href=slug=>{const c=categories.find(c=>c.slug===slug||(c.aliases||[]).includes(slug)),keys=c?[c.slug,...(c.aliases||[])]:[slug],fixedSlug=keys.find(s=>fixed.includes(s));return fixedSlug?`shop-${fixedSlug}.html`:`shop-category.html?category=${encodeURIComponent(keys.includes('smartphones')?'smartphones':c?.slug||slug)}`};
const english=()=>document.documentElement.lang==='en';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const imageUrl=p=>p?.startsWith('images/')?p:p?`${SUPABASE_URL}/storage/v1/object/public/electroshop-product-images/${p}`:'';
let categories=[],adminSession=null;
const grid=document.querySelector('.category-grid');
const page=document.querySelector('main[data-category],main[data-store-category]');const pageSlug=page?.dataset.category||page?.dataset.storeCategory;
const status=document.createElement('p');status.setAttribute('role','status');
const button=document.createElement('button');button.type='button';button.className='button';button.textContent='עריכת קטגוריות';button.hidden=true;
if(grid){grid.before(button,status);}
async function load(){categories=await request('/rest/v1/electroshop_categories?select=*&order=sort_order.asc,slug.asc',{token:adminSession?.accessToken});render();}
function render(){
 const language=english()?'en':'he';
 if(grid)grid.innerHTML=categories.filter(c=>c.active).map((c,i)=>`<a class="category-tile" href="${href(c.slug)}">${c.image_path?`<img class="category-cover" src="${esc(imageUrl(c.image_path))}" alt="${esc(c['name_'+language])}" loading="lazy">`:''}<h2>${esc(c['name_'+language])}</h2><p>${esc(c['description_'+language])}</p><strong>${english()?'View products →':'למוצרים ←'}</strong></a>`).join('');
 for(const select of document.querySelectorAll('#category,select[name="category"]')){
   const current=select.value,empty=select.id==='category';
   select.innerHTML=(empty?`<option value="">${english()?'All categories':'כל הקטגוריות'}</option>`:`<option value="">${english()?'Choose a category':'בחר קטגוריה'}</option>`)+categories.filter(c=>c.active||adminSession||c.slug===current).map(c=>`<option value="${esc(c.slug)}">${esc(c['name_'+language])}${!c.active?' (מוסתרת)':''}</option>`).join('');
   if([...select.options].some(o=>o.value===current))select.value=current;
 }
 if(page){const c=categories.find(c=>c.slug===pageSlug||(c.aliases||[]).includes(pageSlug));if(c){let intro=page.querySelector('.shop-intro');if(!intro&&c.banner_path){intro=document.createElement('div');intro.className='shop-intro';page.querySelector('.electroshop-page-navigation')?.after(intro)}if(intro){if(c.banner_path){const img=document.createElement('img');img.className='shop-category-banner';img.src=imageUrl(c.banner_path);img.alt=c['name_'+language];img.fetchPriority='high';img.style.cssText='display:block;width:auto;height:auto;max-width:100%;max-height:clamp(120px,20vw,220px);object-fit:contain;margin:auto';intro.replaceChildren(img)}else{const title=document.createElement('h1'),description=document.createElement('p');title.textContent=c['name_'+language];description.textContent=c['description_'+language];intro.replaceChildren(title,description)}}}}

}
document.querySelector('#category')?.addEventListener('change',e=>{if(page&&e.target.value){e.stopImmediatePropagation();location.href=href(e.target.value);}},true);
document.addEventListener('electroshop-language-change',render);
async function verifiedSession(){const session=await getSession();if(!session||await isAdmin(session)!==true)throw Error('יש להתחבר מחדש כמנהל');return session;}
const dialog=document.createElement('dialog');dialog.className='category-editor';dialog.setAttribute('aria-label','עריכת קטגוריות');document.body.append(dialog);
function openEditor(){
 dialog.innerHTML='<button type="button" class="category-editor-close" aria-label="סגירה">×</button><h2>עריכת קטגוריות</h2><p>הסתרה מסירה קטגוריה מדף החנות, בלי למחוק את מוצריה.</p><div class="category-editor-list"></div><button type="button" class="button category-new">הוספת קטגוריה</button><p class="category-editor-status" role="status"></p>';
 const list=dialog.querySelector('.category-editor-list');
 categories.forEach(c=>addForm(list,c));
 dialog.querySelector('.category-new').onclick=()=>addForm(list,{slug:'',name_he:'',name_en:'',description_he:'',description_en:'',image_path:'',sort_order:categories.length+1,active:true});
 dialog.querySelector('.category-editor-close').onclick=()=>dialog.close();
 if(!dialog.open)dialog.showModal();
}
function addForm(list,c){
 const item=document.createElement('details');item.className='category-edit-item';item.open=!c.slug;
 const summary=document.createElement('summary');const refreshSummary=()=>{summary.textContent=(c.name_he||'קטגוריה חדשה')+' · '+(c.active?'מוצגת':'מוסתרת')+' · סדר '+c.sort_order+' — עריכה';};refreshSummary();item.append(summary);
 const form=document.createElement('form');form.className='category-edit-form';
 form.innerHTML=`<label>מזהה באנגלית - אפשר לשנות<input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" value="${esc(c.slug)}" ></label><label>שם בעברית<input name="name_he" required maxlength="100" value="${esc(c.name_he)}"></label><label>שם באנגלית<input name="name_en" required maxlength="100" value="${esc(c.name_en)}"></label><label>תיאור בעברית<textarea name="description_he">${esc(c.description_he)}</textarea></label><label>תיאור באנגלית<textarea name="description_en">${esc(c.description_en)}</textarea></label><label>מיקום בסדר הקטגוריות<input name="sort_order" type="number" step="1" required value="${c.sort_order}"></label><label><input name="active" type="checkbox" ${c.active?'checked':''}> מוצגת בחנות</label>${c.image_path?`<img class="category-cover" src="${esc(imageUrl(c.image_path))}" alt="תמונת קטגוריה"><label><input name="remove_image" type="checkbox"> הסרת התמונה</label>`:''}<label>תמונת כרטיס הקטגוריה (JPG, PNG, WebP עד 5MB)<input name="image" type="file" accept="image/jpeg,image/png,image/webp"></label><label class="category-banner-field">תמונת שער לדף הקטגוריה<small>מחליפה את הכותרת והתיאור בראש הדף. התמונה מוצגת בשלמותה, ללא חיתוך.</small><img data-banner-preview src="${esc(imageUrl(c.banner_path))}" alt="תמונת השער" style="max-width:100%;max-height:150px;object-fit:contain;${c.banner_path?'':'display:none'}"><input name="banner" type="file" accept="image/jpeg,image/png,image/webp"><small>JPG, PNG או WebP עד 5MB</small></label><label><input name="remove_banner" type="checkbox"> הסרת תמונת השער והצגת שם ותיאור הקטגוריה</label><button class="button" type="submit">שמירת קטגוריה</button><p role="status"></p>`;
 item.append(form);list.append(item);
 form.elements.banner.onchange=()=>{const file=form.elements.banner.files[0],preview=form.querySelector('[data-banner-preview]');if(preview.dataset.localUrl)URL.revokeObjectURL(preview.dataset.localUrl);if(file){preview.dataset.localUrl=URL.createObjectURL(file);preview.src=preview.dataset.localUrl;preview.style.display='block';form.elements.remove_banner.checked=false}};

 form.elements.remove_banner.onchange=()=>{if(form.elements.remove_banner.checked){form.elements.banner.value='';form.querySelector('[data-banner-preview]').style.display='none'}};
 form.onsubmit=async e=>{
   e.preventDefault();const submit=form.querySelector('[type="submit"]'),message=form.querySelector('[role="status"]');submit.disabled=true;message.textContent='שומר...';
   try{
     const session=await verifiedSession(),fields=new FormData(form),slug=String(fields.get('slug')).trim();
     let image_path=fields.has('remove_image')?'':c.image_path;
     const file=form.elements.image.files[0];
     if(file){if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024)throw Error('יש לבחור תמונת JPG, PNG או WebP עד 5MB');const bitmap=await createImageBitmap(file),canvas=document.createElement('canvas'),scale=Math.min(1,1000/Math.max(bitmap.width,bitmap.height));canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.82));if(!blob)throw Error('לא ניתן לעבד את התמונה');image_path=`categories/${slug}/${crypto.randomUUID()}.webp`;const result=await fetch(`${SUPABASE_URL}/storage/v1/object/electroshop-product-images/${image_path}`,{method:'POST',headers:{apikey:PUBLISHABLE_KEY,Authorization:`Bearer ${session.accessToken}`,'Content-Type':blob.type},body:blob});if(!result.ok)throw Error('העלאת התמונה נכשלה');}
     let banner_path=fields.has('remove_banner')?'':(c.banner_path||'');const bannerFile=form.elements.banner.files[0];
     if(bannerFile){if(!['image/jpeg','image/png','image/webp'].includes(bannerFile.type)||bannerFile.size>5*1024*1024)throw Error('יש לבחור תמונת שער JPG, PNG או WebP עד 5MB');const bitmap=await createImageBitmap(bannerFile),canvas=document.createElement('canvas'),scale=Math.min(1,2048/Math.max(bitmap.width,bitmap.height));canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.9));if(!blob)throw Error('לא ניתן לעבד את תמונת השער');banner_path=`categories/${slug}/banner-${crypto.randomUUID()}.webp`;const result=await fetch(`${SUPABASE_URL}/storage/v1/object/electroshop-product-images/${banner_path}`,{method:'POST',headers:{apikey:PUBLISHABLE_KEY,Authorization:`Bearer ${session.accessToken}`,'Content-Type':blob.type},body:blob});if(!result.ok)throw Error('העלאת תמונת השער נכשלה');}
     const body={banner_path,slug,name_he:String(fields.get('name_he')).trim(),name_en:String(fields.get('name_en')).trim(),description_he:String(fields.get('description_he')),description_en:String(fields.get('description_en')),sort_order:Number(fields.get('sort_order')),active:fields.has('active'),image_path};
     await request('/rest/v1/electroshop_categories'+(c.slug?'?slug=eq.'+encodeURIComponent(c.slug):''),{method:c.slug?'PATCH':'POST',body,token:session.accessToken,headers:{Prefer:'return=representation'}});
     Object.assign(c,body);refreshSummary();localStorage.setItem('electroshop_products_updated',crypto.randomUUID());adminSession=session;await load();Object.assign(c,categories.find(row=>row.slug===slug));form.elements.banner.value='';form.elements.remove_banner.checked=false;const preview=form.querySelector('[data-banner-preview]');preview.src=imageUrl(c.banner_path);preview.style.display=c.banner_path?'block':'none';document.dispatchEvent(new Event('electroshop-categories-updated'));status.textContent='הקטגוריה נשמרה בהצלחה';dialog.close();
   }catch(error){message.textContent=error.message||'השמירה נכשלה';}finally{submit.disabled=false;}
 };
}
button.onclick=async()=>{try{adminSession=await verifiedSession();await load();openEditor();}catch(error){button.hidden=true;status.textContent=error.message;}};
try{await load();}catch{if(grid)grid.replaceChildren();status.textContent='לא ניתן לטעון עדכוני קטגוריות כרגע. נסו לרענן.';}
try{adminSession=await verifiedSession();await load();button.hidden=false;}catch{button.hidden=true;}
window.addEventListener('storage',event=>{if(event.key==='electroshop_admin_session_v1'||event.key===null){button.hidden=true;dialog.close();location.reload();}});
