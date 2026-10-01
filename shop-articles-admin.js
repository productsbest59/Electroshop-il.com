import {getSession,isAdmin,getArticles,saveArticle,deleteArticle,uploadArticleImage,articleImageUrl} from './shop-api.js';
const adminHeader=document.querySelector('.product-admin-header');if(adminHeader){adminHeader.className='articles-admin-nav';adminHeader.innerHTML='<a href="index.html">דף הבית</a><a href="shop-admin.html">ניהול מוצרים</a><a href="shop-news.html" target="_blank" rel="noopener">תצוגת חדשות ומדריכים</a>'}
const slugInput=document.querySelector('input[name="slug"]');if(slugInput){const label=slugInput.closest('label'),text=[...label.childNodes].find(node=>node.nodeType===Node.TEXT_NODE);if(text)text.nodeValue='שם קצר לקישור';slugInput.placeholder='לדוגמה: iphone-17-review';label.querySelector('small').textContent='זהו החלק שיופיע בסוף הקישור. אותיות קטנות באנגלית ומקפים בלבד.'}
const session=await getSession();if(!session||!(await isAdmin(session).catch(()=>false))){location.replace('shop-login.html?next='+encodeURIComponent(location.pathname+location.search));throw new Error('Unauthorized')}
const form=document.querySelector('#articleForm'),list=document.querySelector('#articleList'),status=document.querySelector('#formStatus'),coverPreview=document.querySelector('#coverPreview'),saveButton=form.querySelector('button[type="submit"]');let articles=[],current=null,savedRange={};const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function showSaveStatus(message,state=''){status.textContent=message;status.dataset.state=state;status.hidden=!message}
const normalizeArticleHtml=value=>{const source=String(value||'').trim();if(!source)return'';const probe=document.createElement('div');probe.innerHTML=source;const visible=probe.textContent.trim();return /^<(?:p|h[1-6]|table|ul|ol|blockquote|div|figure|img)\b/i.test(visible)?visible:source};
const shortDashes=value=>String(value??'').replace(/[–—]/g,'-');
function normalizeArticleDashes(){
 document.querySelectorAll('.article-rich-editor').forEach(editor=>{
  const walker=document.createTreeWalker(editor,NodeFilter.SHOW_TEXT);let node;
  while((node=walker.nextNode()))node.nodeValue=shortDashes(node.nodeValue);
 });
 [...form.elements].forEach(field=>{if((field.matches('input:not([type="file"]), textarea'))&&!['id','slug','cover_path'].includes(field.name))field.value=shortDashes(field.value)});
}
const toolbarHtml=`<button type="button" data-cmd="bold" title="מודגש"><b>B</b></button><button type="button" data-cmd="italic" title="נטוי"><i>I</i></button><button type="button" data-cmd="underline" title="קו תחתון"><u>U</u></button><span class="toolbar-group" aria-label="יישור טקסט"><button type="button" data-cmd="justifyRight" title="יישור לימין">≡◀</button><button type="button" data-cmd="justifyCenter" title="יישור למרכז">≡</button><button type="button" data-cmd="justifyLeft" title="יישור לשמאל">▶≡</button></span><select data-block aria-label="סגנון"><option value="p">טקסט רגיל</option><option value="h2">כותרת גדולה</option><option value="h3">כותרת משנה</option><option value="blockquote">ציטוט</option></select><select data-font aria-label="סוג פונט"><option value="Arial">Arial</option><option value="Heebo">Heebo</option><option value="Assistant">Assistant</option><option value="Rubik">Rubik</option><option value="Georgia">Georgia</option><option value="Times New Roman">Times New Roman</option></select><select data-size aria-label="גודל טקסט"><option value="2">קטן</option><option value="3" selected>רגיל</option><option value="4">בינוני</option><option value="5">גדול</option><option value="6">גדול מאוד</option><option value="7">ענק</option></select><button type="button" data-cmd="insertUnorderedList" title="רשימת תבליטים">• רשימה</button><button type="button" data-cmd="insertOrderedList" title="רשימה ממוספרת">1. רשימה</button><button type="button" data-link title="הוספת קישור">🔗 קישור</button><label class="toolbar-color" title="צבע טקסט"><span>A</span><input type="color" data-color value="#172033" aria-label="בחירת צבע טקסט"></label><button type="button" data-image title="הוספת תמונה">🖼 תמונה</button><input type="file" data-image-file accept="image/jpeg,image/png,image/webp,image/gif" hidden><button type="button" data-cmd="removeFormat" title="ניקוי עיצוב">ניקוי</button>`;
document.querySelectorAll('.article-toolbar').forEach(bar=>{
 bar.innerHTML=toolbarHtml;
 const name=bar.dataset.for,editor=document.querySelector(`[data-editor="${name}"]`);
 const remember=()=>{const sel=getSelection();if(sel.rangeCount&&editor.contains(sel.anchorNode))savedRange[name]=sel.getRangeAt(0).cloneRange()};
 const restore=()=>{editor.focus();const range=savedRange[name];if(range){const sel=getSelection();sel.removeAllRanges();sel.addRange(range)}};
 const command=(cmd,value=null)=>{restore();document.execCommand('styleWithCSS',false,true);document.execCommand(cmd,false,value);remember()};
 editor.addEventListener('keyup',remember);editor.addEventListener('mouseup',remember);editor.addEventListener('touchend',remember);editor.addEventListener('input',remember);
 bar.addEventListener('mousedown',e=>{if(e.target.closest('button'))e.preventDefault()});
 bar.addEventListener('click',e=>{const button=e.target.closest('button');if(!button)return;if(button.dataset.cmd)command(button.dataset.cmd);if(button.dataset.link!==undefined){const range=savedRange[name]?.cloneRange(),url=prompt('כתובת הקישור');if(url&&range){savedRange[name]=range;command('createLink',/^(https?:|mailto:|tel:)/i.test(url)?url:`https://${url}`)}}if(button.dataset.image!==undefined)bar.querySelector('[data-image-file]').click()});
 bar.querySelector('[data-block]').onchange=e=>command('formatBlock',e.target.value);
 bar.querySelector('[data-font]').onchange=e=>command('fontName',e.target.value);
 bar.querySelector('[data-size]').onchange=e=>command('fontSize',e.target.value);
 const color=bar.querySelector('[data-color]');color.oninput=e=>command('foreColor',e.target.value);color.onchange=e=>command('foreColor',e.target.value);
 bar.querySelector('[data-image-file]').onchange=async e=>{const file=e.target.files[0];if(!file)return;status.textContent='מעלה תמונה...';try{const uploaded=await uploadArticleImage(session,file);command('insertHTML',`<img src="${uploaded.url}" alt="" loading="lazy"><p><br></p>`);status.textContent='התמונה נוספה במקום הסמן'}catch(err){status.textContent=err.message}e.target.value=''};
});
const imageResizeBox=document.createElement('div');
imageResizeBox.className='image-resize-box';
imageResizeBox.hidden=true;
imageResizeBox.innerHTML='<i data-side="top-left"></i><i data-side="top-right"></i><i data-side="bottom-left"></i><i data-side="bottom-right"></i>';
document.body.append(imageResizeBox);
let selectedEditorImage=null;
function positionImageResizeBox(){
 if(!selectedEditorImage||!selectedEditorImage.isConnected){imageResizeBox.hidden=true;selectedEditorImage=null;return}
 const rect=selectedEditorImage.getBoundingClientRect();
 imageResizeBox.style.left=`${rect.left}px`;imageResizeBox.style.top=`${rect.top}px`;imageResizeBox.style.width=`${rect.width}px`;imageResizeBox.style.height=`${rect.height}px`;imageResizeBox.hidden=false;
}
function selectEditorImage(image){selectedEditorImage=image;positionImageResizeBox()}
document.querySelectorAll('.article-rich-editor').forEach(editor=>editor.addEventListener('click',event=>{const image=event.target.closest('img');if(image&&editor.contains(image)){event.preventDefault();selectEditorImage(image)}}));
document.addEventListener('pointerdown',event=>{if(!event.target.closest('.image-resize-box')&&!event.target.closest('.article-rich-editor img')){selectedEditorImage=null;imageResizeBox.hidden=true}});
imageResizeBox.querySelectorAll('i').forEach(handle=>handle.addEventListener('pointerdown',event=>{
 if(!selectedEditorImage)return;event.preventDefault();event.stopPropagation();
 const startX=event.clientX,startWidth=selectedEditorImage.getBoundingClientRect().width,editor=selectedEditorImage.closest('.article-rich-editor'),direction=handle.dataset.side.includes('left')?-1:1;
 const move=moveEvent=>{const maxWidth=editor.clientWidth-32,next=Math.max(80,Math.min(maxWidth,startWidth+(moveEvent.clientX-startX)*direction));selectedEditorImage.style.width=`${Math.round(next)}px`;selectedEditorImage.style.height='auto';selectedEditorImage.style.maxWidth='100%';positionImageResizeBox()};
 const stop=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',stop);selectedEditorImage?.dispatchEvent(new Event('input',{bubbles:true}))};
 window.addEventListener('pointermove',move);window.addEventListener('pointerup',stop,{once:true});
}));
window.addEventListener('resize',positionImageResizeBox);window.addEventListener('scroll',positionImageResizeBox,true);
function clearForm(){selectedEditorImage=null;imageResizeBox.hidden=true;current=null;form.reset();form.elements.id.value='';form.elements.cover_path.value='';document.querySelectorAll('[data-editor]').forEach(e=>e.innerHTML='');coverPreview.hidden=true;render()}
function edit(a){selectedEditorImage=null;imageResizeBox.hidden=true;current=a;for(const [key,value] of Object.entries(a))if(form.elements[key]&&key!=='content_he'&&key!=='content_en')form.elements[key].value=value??'';document.querySelector('[data-editor=content_he]').innerHTML=normalizeArticleHtml(a.content_he);document.querySelector('[data-editor=content_en]').innerHTML=normalizeArticleHtml(a.content_en);coverPreview.src=articleImageUrl(a.cover_path);coverPreview.hidden=!a.cover_path;render();scrollTo({top:0,behavior:'smooth'})}
function render(){list.innerHTML=articles.map(a=>`<div class="admin-article-row ${current?.id===a.id?'active':''}" data-id="${a.id}"><strong>${esc(a.title_he)}</strong><small>${a.status==='published'?'מפורסמת':'טיוטה'} · ${esc(a.slug)}</small></div>`).join('')||'<p>עדיין אין כתבות.</p>';list.querySelectorAll('[data-id]').forEach(row=>row.onclick=()=>edit(articles.find(a=>a.id===row.dataset.id)))}
async function load(){articles=await getArticles(session,{all:true});render()}await load();document.querySelector('#newArticle').onclick=clearForm;
document.querySelector('#coverFile').onchange=async e=>{const file=e.target.files[0];if(!file)return;status.textContent='מעלה תמונה ראשית...';try{const up=await uploadArticleImage(session,file);form.elements.cover_path.value=up.path;coverPreview.src=up.url;coverPreview.hidden=false;status.textContent='התמונה הועלתה'}catch(err){status.textContent=err.message}e.target.value=''};
form.onsubmit=async e=>{e.preventDefault();saveButton.disabled=true;saveButton.setAttribute('aria-busy','true');showSaveStatus('שומר...','saving');normalizeArticleDashes();for(const name of ['content_he','content_en'])form.elements[name].value=document.querySelector(`[data-editor="${name}"]`).innerHTML;const data=Object.fromEntries(new FormData(form));try{current=await saveArticle(session,data);showSaveStatus(data.status==='published'?'✓ הכתבה נשמרה ופורסמה בהצלחה':'✓ הטיוטה נשמרה בהצלחה','success');await load()}catch(err){showSaveStatus(`השמירה נכשלה: ${err.message}`,'error')}finally{saveButton.disabled=false;saveButton.removeAttribute('aria-busy')}};
document.querySelector('#previewArticle').onclick=()=>{normalizeArticleDashes();const data=Object.fromEntries(new FormData(form));for(const name of ['content_he','content_en'])data[name]=document.querySelector(`[data-editor="${name}"]`).innerHTML;localStorage.setItem('electroshop_article_preview',JSON.stringify(data));window.open('shop-article-preview.html','_blank','noopener')};document.querySelector('#deleteArticle').onclick=async()=>{if(!current)return;if(!confirm(`למחוק את הכתבה "${current.title_he}"? הפעולה אינה ניתנת לביטול.`))return;await deleteArticle(session,current.id);clearForm();status.textContent='הכתבה נמחקה';await load()};
