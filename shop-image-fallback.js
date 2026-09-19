document.addEventListener('error',event=>{
  const image=event.target;
  if(!(image instanceof HTMLImageElement))return;
  const thumb=image.closest('.product-detail-thumbs button');
  if(thumb){thumb.remove();return}
  const productImage=image.closest('.product-image-wrap');
  if(productImage)productImage.remove();
},true);
