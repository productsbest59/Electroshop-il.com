import {readFile, writeFile} from 'node:fs/promises';
import {providers, providerCards, renderPlans, escape, bilingual} from '../cellular-render.mjs';
const origin = 'https://electroshop-il.com/';
const data = JSON.parse(await readFile('cellular-data.json', 'utf8'));
const styles = ['shop-base.css','shop-theme.css?v=media-webp-1','shop-components.css','shop-page-navigation.css','shop-header.css?v=gap-background-5','shop-menu-visibility.css','shop-mobile-header.css?v=2','shop-mobile-layout.css?v=2','shop-unified-menu.css?v=3','shop-shared-footer.css?v=1','shop-articles.css?v=6','cellular-plans.css?v=1'];
function page(provider) {
 const info = providers[provider], file = provider ? `cellular-${provider}.html` : 'cellular-plans.html';
 const title = info ? `חבילות ${info.name} - הצטרפות וניודים | אלקטרושופ` : 'חבילות סלולר - הצטרפות וניודים | אלקטרושופ';
 const description = info ? `${info.description} פרטי המחיר והתנאים מוצגים בנפרד לכל חבילה. הצטרפות וניוד דרך נציג אלקטרושופ.` : 'חבילות סלולר של פלאפון, פרטנר ו-019: השוו גלישה, מחירים ותנאי חבילה. הצטרפות וניוד מספר דרך נציג אלקטרושופ.';
 const name = info ? `חבילות ${provider === '019' ? '019' : info.name}` : 'חבילות סלולר - הצטרפות וניודים';
 const breadcrumb = [{ '@type':'ListItem', position:1, name:'דף הבית', item:origin }, { '@type':'ListItem',position:2,name:'חבילות סלולר',item:origin+'cellular-plans.html' }];
 if(info) breadcrumb.push({'@type':'ListItem',position:3,name,item:origin+file});
 const graph = [{'@type':'CollectionPage','@id':origin+file+'#webpage',url:origin+file,name:title,description,inLanguage:'he-IL',isPartOf:{'@id':origin+'#website'}}, {'@type':'BreadcrumbList',itemListElement:breadcrumb}];
 if(!info) graph.push({'@type':'ItemList',name:'חברות סלולר',itemListElement:Object.entries(providers).map(([id,p],i)=>({'@type':'ListItem',position:i+1,name:p.name,url:origin+`cellular-${id}.html`}))});
 const snapshot = info ? data.find(d=>d.provider===provider) : null;
 return `<!doctype html>
<html lang="he" dir="rtl"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(title)}</title><meta name="description" content="${escape(description)}">
<meta name="robots" content="index,follow"><meta name="theme-color" content="#101010"><meta name="author" content="אלקטרושופ">
<meta name="google-adsense-account" content="ca-pub-1309654214103822">
<link rel="canonical" href="${origin+file}"><link rel="icon" href="favicon.ico">
<meta property="og:type" content="website"><meta property="og:locale" content="he_IL"><meta property="og:site_name" content="אלקטרושופ"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${origin+file}"><meta property="og:image" content="${origin}images/logo.webp"><meta property="og:image:alt" content="אלקטרושופ - חבילות סלולר, הצטרפות וניודים">
<meta name="twitter:card" content="summary"><meta name="twitter:title" content="${escape(title)}"><meta name="twitter:description" content="${escape(description)}"><meta name="twitter:image" content="${origin}images/logo.webp">
<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@graph':graph}).replaceAll('<','\\u003c')}</script>
<script src="shop-ga4.js?v=1"></script>
${styles.map(s=>`<link rel="stylesheet" href="${s}">`).join('\n')}
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
</head><body class="electro-store news-page cellular-page"${info ? ` data-provider="${provider}"` : ''}>
<div id="articleSiteTop"></div>
<main class="cellular-shell ${info ? 'provider-'+provider : ''}">
<nav class="cellular-breadcrumbs" aria-label="מיקום באתר"><a href="index.html">${bilingual('דף הבית','Home')}</a><span aria-hidden="true">/</span>${info ? `<a href="cellular-plans.html">${bilingual('חבילות סלולר','Mobile plans')}</a><span aria-hidden="true">/</span><span>${escape(info.name)}</span>` : `<span>${bilingual('חבילות סלולר','Mobile plans')}</span>`}</nav>
${info ? `<header class="cellular-provider-title"><h1>${bilingual(name,'Mobile plans · '+info.english)}</h1></header><div class="cellular-hero"><p>${escape(info.description)}</p></div><p id="catalogueStatus" class="cellular-status">קטלוג נבדק ב-${new Date(snapshot.checked_at).toLocaleDateString('he-IL')}</p><section id="plansGrid" class="cellular-grid" aria-label="חבילות ${escape(info.name)}">${renderPlans(snapshot.plans)}</section>` : `<header class="cellular-hero"><p class="eyebrow">${bilingual('בוחרים חבילה. מדברים עם נציג.','Choose a plan. Talk to a representative.')}</p><h1>${bilingual(name,'Mobile plans · Joining & number transfers')}</h1><p>${bilingual('מצטרפים לקו חדש או עוברים חברה עם המספר הקיים? בחרו חברה לצפייה בחבילות ובמחירים, ופנו אלינו להתאמה ולהצטרפות.','Starting a new line or switching providers with your existing number? Choose a provider to view plans, then contact us for assistance.')}</p></header><section class="provider-grid" aria-label="בחירת חברת סלולר">${providerCards()}</section>`}
<aside class="cellular-disclaimer"><h2>${bilingual('חשוב לדעת לפני שמצטרפים','Before you join')}</h2><p>${bilingual('מחירי החבילות, תנאיהן, תקופות המבצע וזמינותן נקבעים ובאחריות חברות הסלולר, ולא על ידי אלקטרושופ. אלקטרושופ משמשת משווקת. המידע עשוי להשתנות ואינו הצעת מחיר מחייבת; לפני ההצטרפות הנציג יאמת את המחיר והתנאים העדכניים, לרבות המחיר לאחר המבצע, מספר הקווים הנדרש ועלויות SIM, חיבור או מעבר אם קיימות. ההצטרפות כפופה לתנאי החברה, לשימוש סביר ולזמינות השירות.','Prices, conditions, promotion periods and availability are determined by the mobile providers, not Electroshop. Electroshop is a reseller. Information may change and is not a binding quotation. Your representative will confirm current terms, subsequent prices, required line count and any SIM, connection or switching fees before you join. Provider terms, fair-use and service availability apply.')}</p></aside>
<section class="cellular-contact"><p>${bilingual('רוצים להצטרף או לנייד? הנציג יעזור לבחור את החבילה המתאימה.','Ready to join or transfer your number? Our representative can help you choose.')}</p><a href="index.html#contact">${bilingual('יצירת קשר עם נציג','Contact a representative')}</a></section>
</main><div id="articleSiteBottom"></div><script type="module" src="cellular-plans.js?v=2"></script></body></html>\n`;
}
for (const provider of [null,...Object.keys(providers)]) await writeFile(provider ? `cellular-${provider}.html` : 'cellular-plans.html', page(provider));
console.log('Built four public cellular pages with crawlable plan details and SEO.');
