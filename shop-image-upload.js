export const readAsDataUrl=file=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file)});

// Preserve dimensions, transparency and already optimized/animated formats.
export async function prepareImageBlob(file){
  if(!/^image\/(jpeg|png)$/i.test(file.type))return file;
  const bitmap=await createImageBitmap(file),canvas=document.createElement('canvas');
  canvas.width=bitmap.width;canvas.height=bitmap.height;
  const context=canvas.getContext('2d');
  if(!context){bitmap.close();return file}
  context.drawImage(bitmap,0,0);bitmap.close();
  const converted=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.96));
  return converted?.type==='image/webp'&&converted.size<file.size?converted:file;
}
export async function prepareImageUpload(file){return readAsDataUrl(await prepareImageBlob(file))}
