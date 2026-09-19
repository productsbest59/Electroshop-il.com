import {getSession,isAdmin} from './shop-api.js';
document.addEventListener('click',event=>{const button=event.target.closest('[data-store-sku]');if(!button)return;document.getElementById('modalClose')?.click();document.dispatchEvent(new CustomEvent('electroshop-open-sku',{detail:button.dataset.storeSku}));});
async function admin(){const links=document.getElementById('proAdminLinks');links.hidden=true;try{const session=await getSession();links.hidden=!(session&&await isAdmin(session));}catch{links.hidden=true;}}
admin();window.addEventListener('pageshow',admin);window.addEventListener('storage',admin);
