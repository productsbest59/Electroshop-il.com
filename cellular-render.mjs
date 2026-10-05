export const providers = {
  pelephone: {name: 'פלאפון', english: 'Pelephone', mark: 'פלאפון', description: 'חבילות פלאפון בעיר, גלישה בדור 4 ו-5 והצטרפות דרך נציג אלקטרושופ.'},
  partner: {name: 'פרטנר', english: 'Partner', mark: 'partner', description: 'חבילות פרטנר, מסלולי דור 5 ומחירים לקו אחד או לכמה קווים.'},
  '019': {name: '019 מובייל', english: '019 Mobile', mark: '019', description: 'חבילות 019 מובייל, נפחי גלישה ומסלולים במחיר קבוע לפי תנאי החברה.'}
};
export const escape = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const bilingual = (he, en, lang = 'he') => `<span data-he="${escape(he)}" data-en="${escape(en)}">${escape(lang === 'en' ? en : he)}</span>`;
export function renderPlans(plans, lang = 'he') {
  return plans.map(p => `<article class="cellular-plan">
    <div class="plan-heading"><h2>${escape(p.name)}</h2><span class="plan-data" dir="ltr">${escape(p.data)}</span></div>
    <p class="plan-price">${/למצרפים|2-12|2–12/.test(p.priceSummary || '') ? bilingual('החל מ־', 'From ', lang) : ''}<b dir="ltr">₪${Number(p.price).toFixed(2)}</b></p>
    <p class="plan-price-label">${bilingual('לחודש', 'Per month', lang)}</p>
    <div class="plan-pricing"><h3>${bilingual('מחיר ותנאי החבילה', 'Plan pricing and conditions', lang)}</h3><p>${escape(p.priceSummary || p.priceTerms)}</p></div>
    <ul class="plan-features">${p.features.map(s => `<li>${escape(s)}</li>`).join('')}</ul>
    ${p.terms.length || p.priceSummary !== p.priceTerms ? `<details class="plan-terms"><summary>${bilingual('פרטים ותנאים נוספים', 'More details and conditions', lang)}</summary><p>${escape(p.priceTerms)}</p><ul>${p.terms.map(s => `<li>${escape(s)}</li>`).join('')}</ul></details>` : ''}
  </article>`).join('');
}
export function providerCards(lang = 'he') {
  const banners = {pelephone:'cellular-pelephone-banner.webp',partner:'cellular-partner-banner.webp','019':'cellular-019-banner.webp'};
  return Object.entries(providers).map(([id, p]) => `<a class="provider-card provider-${id}" href="cellular-${id}.html">
    <img src="images/${banners[id]}" width="2109" height="${id==='partner'?745:746}" alt="${escape(lang==='en' ? `${p.english} mobile plans - joining and number transfers` : `חבילות ${p.name} - הצטרפות וניוד מספר`)}" decoding="async">
  </a>`).join('');
}
