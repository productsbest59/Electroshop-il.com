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
 const text=element('p',displayText,'review-text');text.dir='auto';
 const source=element('a',label('ביקורות ב-Google','Reviews on Google'));source.href=googleUrl;source.target='_blank';source.rel='noopener noreferrer';
 card.append(name,stars,text,source);return card;
}
export async function reviewsRequest(body){
 let headers={apikey:config.publishableKey};
 if(body){const {getSession}=await import('./shop-api.js');const session=await getSession();if(!session)throw Error('יש להתחבר לניהול החנות');headers={...headers,'Content-Type':'application/json',Authorization:'Bearer '+session.accessToken};}
 const response=await fetch(endpoint,{method:body?'POST':'GET',headers,body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(45000)});
 const data=await response.json();if(!response.ok)throw Error(data.error||'לא ניתן לטעון ביקורות כרגע');return data;
}
const section=document.querySelector('#selectedGoogleReviews');
if(section){
 let reviews=[];
 const render=()=>{section.hidden=!reviews.length;if(!reviews.length)return;section.replaceChildren();section.append(element('h2',label('ביקורות נבחרות מ-Google','Selected Google reviews')));const grid=element('div',undefined,'google-reviews-grid');reviews.forEach(review=>grid.append(reviewCard(review)));section.append(grid);};
 document.addEventListener('electroshop-language-change',render);
 reviewsRequest().then(data=>{reviews=data.reviews||[];render()}).catch(()=>{section.hidden=true});
}
