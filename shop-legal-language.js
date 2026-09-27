(()=>{
 const dictionary=window.electroshopLegalTranslations||{},bindings=[];
 const walker=document.createTreeWalker(document.documentElement,NodeFilter.SHOW_TEXT);
 while(walker.nextNode()){
  const node=walker.currentNode;if(node.parentElement.closest('script,style,[data-he],textarea'))continue;
  const key=node.textContent.trim();if(dictionary[key])bindings.push({node,he:node.textContent,en:node.textContent.replace(key,dictionary[key])});
 }
 const fields=[...document.querySelectorAll('textarea')].map(el=>({el,he:el.defaultValue,en:dictionary[el.defaultValue.trim()]}));
 const bar=document.createElement('div');bar.className='legal-language';bar.setAttribute('role','group');bar.setAttribute('aria-label','Language / שפה');
 bar.innerHTML='<button type="button" data-lang="he">עברית</button><button type="button" data-lang="en">English</button>';
 document.querySelector('.legal-brand').after(bar);
 function apply(lang,notify=true){
  const english=lang==='en';document.documentElement.lang=lang;document.documentElement.dir=english?'ltr':'rtl';document.body.dir=english?'ltr':'rtl';
  bindings.forEach(({node,he,en})=>node.textContent=english?en:he);
  document.querySelectorAll('[data-he][data-en]').forEach(el=>el.textContent=english?el.dataset.en:el.dataset.he);
  fields.forEach(({el,he,en})=>{if(!en)return;const untouched=el.value===he||el.value===en;el.defaultValue=english?en:he;if(untouched)el.value=el.defaultValue});
  bar.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lang===lang)));
  localStorage.setItem('electroshop_store_language',lang);localStorage.setItem('electroshop_home_lang_v1',lang);
  if(notify)document.dispatchEvent(new CustomEvent('electroshop-language-change',{detail:lang}));
 }
 bar.addEventListener('click',event=>{const b=event.target.closest('[data-lang]');if(b)apply(b.dataset.lang)});
 apply(localStorage.getItem('electroshop_store_language')==='en'?'en':'he',false);
})();