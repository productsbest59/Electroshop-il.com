import {config} from './shop-config.js';
const endpoint=config.supabaseUrl+'/functions/v1/electroshop-google-reviews';
const googleUrl='https://share.google/r7QLT5LSsRdIac0vF';
const english=()=>document.documentElement.lang==='en';
const label=(he,en)=>english()?en:he;
function element(tag,text,className){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el}
export function reviewCard(review){
 const card=element('article',undefined,'google-review-card');
 const name=element('strong',review.author);name.dir='auto';
 const stars=element('span','★'.repeat(Math.max(0,Math.min(5,Number(review.rating)||0))),'review-stars');stars.setAttribute('aria-label',label('דירוג: ','Rating: ')+review.rating+'/5');
 const rawText=String(review.text||'');
 const translated=rawText.match(/^\(Translated by Google\)\s*([\s\S]*?)\s*\(Original\)\s*([\s\S]*)$/);
 const displayText=translated?(english()?translated[1]:translated[2]).trim():rawText;
 const text=element('p',displayText,'review-text');text.dir='auto';text.tabIndex=0;
 const source=element('a',label('ביקורות ב-Google','Reviews on Google'));source.href=googleUrl;source.target='_blank';source.rel='noopener noreferrer';
 card.append(name,stars,text,source);return card;
}
export async function reviewsRequest(body){
 let headers={};
 if(body){const {getSession}=await import('./shop-api.js');const session=await getSession();if(!session)throw Error('יש להתחבר לניהול החנות');headers={...headers,apikey:config.publishableKey,'Content-Type':'application/json',Authorization:'Bearer '+session.accessToken};}
 const response=await fetch(endpoint,{method:body?'POST':'GET',headers,body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(45000)});
 const data=await response.json();if(!response.ok)throw Error(data.error||'לא ניתן לטעון ביקורות כרגע');if(body?.action==='save'){try{sessionStorage.removeItem('electroshop-selected-reviews-v1')}catch{}}return data;
}
const section=document.querySelector('#selectedGoogleReviews');
if(section){
 const cacheKey='electroshop-selected-reviews-v1';let reviews=[],loaded=false;
 const render=()=>{if(!loaded)return;section.removeAttribute('aria-busy');section.hidden=!reviews.length;if(!reviews.length)return;section.replaceChildren();section.append(element('h2',label('ביקורות נבחרות מ-Google','Selected Google reviews')));const grid=element('div',undefined,'google-reviews-grid');reviews.forEach(review=>grid.append(reviewCard(review)));section.append(grid);};
 try{const saved=JSON.parse(sessionStorage.getItem(cacheKey)||'null');if(saved&&Date.now()-saved.time<300000&&Array.isArray(saved.reviews)){reviews=saved.reviews;loaded=true;render();}}catch{}
 document.addEventListener('electroshop-language-change',render);
 (window.electroshopReviewsLoad||reviewsRequest()).then(data=>{if(!data||!Array.isArray(data.reviews))throw Error('Reviews unavailable');reviews=data.reviews;loaded=true;render();try{sessionStorage.setItem(cacheKey,JSON.stringify({time:Date.now(),reviews}))}catch{}}).catch(()=>{if(!loaded){section.hidden=true;section.removeAttribute('aria-busy')}});
}
