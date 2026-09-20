import {request,isAdmin} from './shop-api.js?v=multi-category-1';
const tokenHash=new URLSearchParams(location.hash.slice(1)).get('token_hash');
history.replaceState(null,'',location.pathname);
const form=document.querySelector('#setupForm'),message=document.querySelector('#setupMessage');
let session=null;
if(!tokenHash){message.textContent='יש לפתוח את הקישור האישי להגדרת הסיסמה.';message.className='status show error';form.querySelector('button').disabled=true;}
form.addEventListener('submit',async event=>{
  event.preventDefault();
  const values=new FormData(form),button=form.querySelector('button');
  if(values.get('password')!==values.get('confirm')){message.textContent='הסיסמאות אינן זהות';message.className='status show error';return;}
  button.disabled=true;message.textContent='שומר...';message.className='status show';
  try{
    if(!session){
      const data=await request('/auth/v1/verify',{method:'POST',body:{token_hash:tokenHash,type:'invite'}});
      session={accessToken:data.access_token,refreshToken:data.refresh_token,expiresAt:Date.now()+data.expires_in*1000,user:data.user};
    }
    if(!await isAdmin(session))throw new Error('החשבון אינו מוגדר כמנהל אלקטרושופ');
    await request('/auth/v1/user',{method:'PUT',token:session.accessToken,body:{password:values.get('password')}});
    localStorage.setItem('electroshop_admin_session_v1',JSON.stringify(session));
    location.replace('shop-admin.html');
  }catch(error){message.textContent=error.message;message.className='status show error';button.disabled=false;}
});
