import {getSession,isAdmin} from './shop-api.js';
import {reviewCard,reviewsRequest} from './shop-reviews.js';
const list=document.querySelector('#reviewList'),status=document.querySelector('#reviewStatus'),save=document.querySelector('#saveReviews'),reload=document.querySelector('#reloadReviews');
let selected=new Set(),dirty=false;
function message(text){status.textContent=text}
function count(){document.querySelector('#reviewCount').textContent=`נבחרו ${selected.size} מתוך 20 ביקורות אפשריות`;}
async function load(){save.disabled=true;reload.disabled=true;message('טוען ביקורות של אלקטרושופ...');try{
 const session=await getSession();if(!session||!await isAdmin(session)){message('יש להתחבר עם חשבון מנהל אלקטרושופ.');document.querySelector('#reviewLogin').hidden=false;return;}
 const data=await reviewsRequest({action:'list'});selected=new Set(data.selected);list.replaceChildren();
 for(const review of data.reviews){const row=document.createElement('div');row.className='review-admin-row';const label=document.createElement('label');const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=selected.has(review.id);label.append(checkbox,document.createTextNode(' הצג באתר'));checkbox.addEventListener('change',()=>{if(checkbox.checked&&selected.size>=20){checkbox.checked=false;message('אפשר לבחור עד 20 ביקורות');return}if(checkbox.checked)selected.add(review.id);else selected.delete(review.id);dirty=true;count();message('יש שינויים שלא נשמרו');});row.append(label,reviewCard(review));list.append(row);}
 dirty=false;count();save.disabled=false;message(data.reviews.length?'סמן את הביקורות שתרצה להציג ולחץ שמירה.':'לא נמצאו ביקורות.');
 }catch(error){message(error.message)}finally{reload.disabled=false}}
reload.addEventListener('click',()=>{if(!dirty||confirm('לטעון מחדש ולוותר על הבחירה שטרם נשמרה?'))load()});
save.addEventListener('click',async()=>{save.disabled=true;reload.disabled=true;list.inert=true;try{await reviewsRequest({action:'save',ids:[...selected]});dirty=false;message('נשמר! הביקורות שנבחרו יוצגו בדף הבית.')}catch(error){message(error.message)}finally{save.disabled=false;reload.disabled=false;list.inert=false}});
window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue=''}});
load();
