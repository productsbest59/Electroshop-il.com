const escapeAttribute=value=>String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const genericImageAlt=value=>!String(value||'').trim()||/^(?:תמונה|image|photo|product|מוצר)(?:\s*\d+)?(?:\s+(?:תמונה|image)\s*\d+)?$/i.test(String(value).trim());
// Change only image attributes: do not reserialize article markup or alignment.
export function improveInlineImages(html,title,language='he',resolve=src=>src){
  return String(html||'').replace(/<img\b[^>]*>/gi,(tag,offset,source)=>{
    const src=tag.match(/\bsrc\s*=\s*(["'])(.*?)\1/i);
    if(src){const next=resolve(src[2]);if(next!==src[2])tag=tag.replace(src[0],`src=${src[1]}${escapeAttribute(next)}${src[1]}`)}
    const alt=tag.match(/\balt\s*=\s*(["'])(.*?)\1/i);
    if(/\b(?:aria-hidden\s*=\s*["']true|role\s*=\s*["']presentation)/i.test(tag))return tag;
    if(!alt||genericImageAlt(alt[2])){
      const preceding=source.slice(0,offset),headings=[...preceding.matchAll(/<h[2-6]\b[^>]*>([\s\S]*?)<\/h[2-6]>/gi)],heading=headings.at(-1)?.[1].replace(/<[^>]+>/g,'').trim();
      const caption=heading&&heading!==title?`${title} – ${heading}`:title;
      const replacement=`alt="${escapeAttribute(caption|| (language==='he'?'תמונת הכתבה':'Article image'))}"`;
      tag=alt?tag.replace(alt[0],replacement):tag.replace(/\s*\/?\s*>$/,` ${replacement}>`);
    }
    if(!/\bloading\s*=/i.test(tag))tag=tag.replace(/\s*\/?\s*>$/,' loading="lazy">');
    if(!/\bdecoding\s*=/i.test(tag))tag=tag.replace(/\s*\/?\s*>$/,' decoding="async">');
    return tag;
  });
}
