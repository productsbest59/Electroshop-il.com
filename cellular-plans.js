import {renderArticleShell} from './shop-articles-shell.js?v=cellular-2';
import {renderPlans, providers} from './cellular-render.mjs?v=2';
import {request} from './shop-api.js?v=media-webp-1';
import {cellularConfig} from './cellular-config.js?v=2';
renderArticleShell();
const provider = document.body.dataset.provider;
const lang = document.documentElement.lang;
if (provider && providers[provider] && cellularConfig.syncEnabled) {
  const status = document.querySelector('#catalogueStatus');
  try {
    const rows = await request(`/rest/v1/electroshop_cellular_catalogues?select=provider,checked_at,plans&provider=eq.${encodeURIComponent(provider)}`);
    const catalogue = rows[0];
    if (catalogue?.plans?.length) {
      document.querySelector('#plansGrid').innerHTML = renderPlans(catalogue.plans, lang);
      status.textContent = `${lang === 'en' ? 'Last verified' : 'אימות אחרון'}: ${new Date(catalogue.checked_at).toLocaleDateString(lang === 'en' ? 'en-GB' : 'he-IL')}`;
      if (Date.now() - new Date(catalogue.checked_at).getTime() > 7 * 86400000) status.textContent += lang === 'en' ? ' Prices need re-verification.' : ' נדרש אימות מחירים מחדש.';
    }
  } catch {
    // An unavailable sync never erases the verified, dated HTML snapshot.
    status.textContent += lang === 'en' ? ' · Showing the saved catalogue, not a live price quote.' : ' · מוצג קטלוג שמור, לא הצעת מחיר בזמן אמת.';
  }
}
