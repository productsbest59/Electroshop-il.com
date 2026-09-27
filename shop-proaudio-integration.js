import {getSession,isAdmin} from './shop-api.js?v=option-images-2';
document.addEventListener('click',event=>{const button=event.target.closest('[data-store-sku]');if(!button)return;document.getElementById('modalClose')?.click();document.dispatchEvent(new CustomEvent('electroshop-add-sku',{detail:button.dataset.storeSku}));});
async function admin(){const links=document.getElementById('proAdminLinks');if(!links)return;links.hidden=true;try{const session=await getSession();links.hidden=!(session&&await isAdmin(session));}catch{links.hidden=true;}}
admin();window.addEventListener('pageshow',admin);window.addEventListener('storage',admin);

// Place each legacy product's cart action beside its existing price.
document.querySelectorAll('.product-card .product-cart-add').forEach(button=>{
 const card=button.closest('.product-card'),price=card.querySelector('.price');if(!price)return;
 const row=document.createElement('div');row.className='price-row compact-price-row';price.before(row);row.append(price,button);
});