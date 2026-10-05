
    const langToggle = document.getElementById('langToggle');
    const langStorageKey = 'electroshop_home_lang_v1';

    function getLang() {
      const saved = localStorage.getItem('electroshop_store_language') || localStorage.getItem(langStorageKey);
      return saved === 'en' ? 'en' : 'he';
    }

    function applyLang(lang) {
      const isEnglish = lang === 'en';
      document.documentElement.lang = isEnglish ? 'en' : 'he';
      document.documentElement.dir = isEnglish ? 'ltr' : 'rtl';
      document.body.setAttribute('dir', isEnglish ? 'ltr' : 'rtl');

      document.querySelectorAll('[data-he]').forEach(el => {
        const value = isEnglish ? el.getAttribute('data-en') : el.getAttribute('data-he');
        if (el.classList.contains('trans-html')) el.innerHTML = value;
        else el.textContent = value;
      });

      document.querySelectorAll('[data-placeholder-he]').forEach(el => {
        el.placeholder = isEnglish ? el.getAttribute('data-placeholder-en') : el.getAttribute('data-placeholder-he');
      });

      localStorage.setItem(langStorageKey, lang);
      localStorage.setItem('electroshop_store_language', lang);
    }

    langToggle.addEventListener('click', function() {
      const menu = document.getElementById('languageMenu');
      const willOpen = menu.hidden;
      menu.hidden = !willOpen;
      langToggle.setAttribute('aria-expanded', String(willOpen));
    });

    document.querySelectorAll('[data-language]').forEach(button => {
      button.addEventListener('click', function() {
        const lang = button.dataset.language;
        applyLang(lang);
        document.getElementById('languageMenu').hidden = true;
        langToggle.setAttribute('aria-expanded', 'false');
        document.dispatchEvent(new CustomEvent('electroshop-language-change', {detail:lang}));
      });
    });

    document.addEventListener('click', function(event) {
      if (!event.target.closest('.language-picker')) {
        document.getElementById('languageMenu').hidden = true;
        langToggle.setAttribute('aria-expanded', 'false');
      }
    });

    applyLang(getLang());
  

    const menuToggle = document.getElementById('menuToggle');
    const menuClose = document.getElementById('menuClose');
    const menuBackdrop = document.getElementById('menuBackdrop');
    const mainMenu = document.getElementById('mainMenu');

    function openMenu() {
      mainMenu.classList.add('open');
      menuBackdrop.classList.add('open');
      document.body.classList.add('main-menu-is-open');
      mainMenu.setAttribute('aria-hidden', 'false');
      menuToggle.setAttribute('aria-expanded', 'true');
    }

    function closeMenu() {
      mainMenu.classList.remove('open');
      menuBackdrop.classList.remove('open');
      document.body.classList.remove('main-menu-is-open');
      mainMenu.setAttribute('aria-hidden', 'true');
      menuToggle.setAttribute('aria-expanded', 'false');
    }

    menuToggle.addEventListener('click', function() {
      if (mainMenu.classList.contains('open')) closeMenu();
      else openMenu();
    });

    menuClose.addEventListener('click', closeMenu);
    menuBackdrop.addEventListener('click', closeMenu);

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeMenu();
    });
  
// Shared navigation and authenticated management links.
document.addEventListener('DOMContentLoaded',()=>{
 const nav=document.querySelector('.main-menu-links');
 // Public navigation is built by shop-unified-menu.js.
 const translations={'אלקטרושופ':'Electroshop','מבצעים חמים':'Hot deals','לחנות שלנו ←':'Visit our store →','אביזרי סלולר':'Mobile accessories','פרו אודיו':'Pro audio','תושבות לרכב':'Car mounts','גיטרות':'Guitars','מטענים וכבלים':'Chargers & cables','בחרו קטגוריה והיכנסו למוצרים שלה.':'Choose a category to explore its products.','כיסויים, מגני מסך ואביזרים':'Cases, screen protectors and accessories','מיקסרים, מיקרופונים וציוד אולפן':'Mixers, microphones and studio equipment','אחיזה יציבה ונוחה לכל נסיעה':'A steady, convenient hold on every drive','כלי נגינה באיסוף עצמי מהחנות':'Musical instruments for collection at our store','טעינה וחיבורים לכל יום':'Everyday charging and connections','למוצרים ←':'View products →','כל מה שצריך.':'Everything you need.','במקום אחד.':'In one place.','ראשי':'Home','תקנון':'Terms','פרטיות':'Privacy','אלקטרושופ • המרכבה 31, חולון':'Electroshop • 31 Hamerkava St, Holon','מעבדת סלולר, אביזרים וגאדג׳טים בחולון':'Phone repairs, accessories and gadgets in Holon','השירותים שלנו':'Our services','יצירת קשר':'Contact us','שעות פעילות':'Opening hours','חפשו אותנו אונליין':'Find us online','קישורים מהירים':'Quick links','משווק מורשה':'Authorized dealer','תמונות מהחנות והמעבדה':'Our shop and repair lab','מעבדת סלולר ואביזרים':'Phone repairs and accessories'};
 Object.assign(translations,{'דף הבית':'Home','החנות שלנו':'Our store','שירותים':'Services','תמונות':'Photos','צור קשר':'Contact us',
 'תיקוני אקספרס במקום על ידי טכנאי מוסמך לכל המכשירים המובילים - אייפון, סמסונג, שיאומי ועוד.':'Fast on-site repairs by a certified technician for iPhone, Samsung, Xiaomi and other leading brands.',
 'תיקוני אקספרס':'Express repairs','תיקון במקום בזמן קצר':'Fast on-site repairs','אחריות על תיקון':'Repair warranty','אחריות על תיקונים':'Repair warranty','שקט נפשי ושירות אמין':'Peace of mind and reliable service','טכנאי מוסמך':'Certified technician','מקצועיות וניסיון':'Expertise and experience','חניה חינם':'Free parking','נוח להגיע אלינו':'Easy to reach',
 'תיקוני סלולר':'Phone repairs','החלפת מסכים':'Screen replacement','החלפת סוללות':'Battery replacement','החלפת שקעי טעינה':'Charging port replacement','החלפת גבים':'Back cover replacement','תיקון בעיות קליטה ורשת':'Signal and network repairs','הלחמות ותיקוני לוחות':'Soldering and board repairs','תיקון בעיות שמע ואודיו':'Sound and audio repairs','תיקון עדשות מצלמה':'Camera lens repairs','תיקון בעיות חיישנים':'Sensor repairs','ניקוי קורוזיה':'Corrosion cleaning',
 'תוכנה ונתונים':'Software and data','הסרת וירוסים':'Virus removal','גיבוי ושחזור נתונים':'Data backup and recovery','העברת מידע ממכשיר ישן לחדש':'Data transfer to a new device','פתרון תקלות מערכת':'System troubleshooting','הסרת נעילת גוגל':'Google account unlock','הסרת אייקלאוד':'iCloud unlock','פתיחת מכשיר ל־Sim Free':'SIM unlocking',
 'אביזרים וגאדג׳טים':'Accessories and gadgets','מגנים וכיסויים':'Cases and covers','מגיני מסך':'Screen protectors','אוזניות ורמקולים':'Headphones and speakers','כבלים ומטענים':'Cables and chargers','סוללות חירום':'Power banks','מקלדות ועכברים':'Keyboards and mice','אביזרי גיימינג':'Gaming accessories','כרטיסי זכרון':'Memory cards','בידוריות וקריוקי':'Party speakers and karaoke',
 'טאבלטים':'Tablets','תיקון טאבלטים':'Tablet repairs','תיקון שקעי טעינה':'Charging port repairs','בדיקה ואבחון תקלות':'Testing and diagnostics','קווים ומכשירים':'Mobile plans and devices','משווק רשמי פרטנר':'Authorized Partner dealer','משווק רשמי פלאפון':'Authorized Pelephone dealer','משווק רשמי 019':'Authorized 019 dealer','מכירת קווים ומכשירים':'Mobile plans and devices','מכירת סימים':'SIM cards','טעינת טוקמן / פריפייד':'Prepaid top-ups','שעונים חכמים':'Smartwatches',
 'לרכב ולאופנוע':'Car and motorcycle','תושבות לאופנוע':'Motorcycle mounts','פתרונות טעינה ונוחות לדרך':'Charging and travel accessories','תיקון שלטים':'Remote control repairs','פתרונות Apple CarPlay':'Apple CarPlay solutions','פתרונות Android Auto':'Android Auto solutions',
 'גם חנות, גם מעבדה, גם שירות אישי':'A shop, a repair lab and personal service',
 'מציעה שילוב של מעבדת תיקונים מקצועית, מבחר גדול של אביזרים וגאדג׳טים, שירות אישי ומחירים נוחים.':' combines a professional repair lab, a wide range of accessories and gadgets, personal service and affordable prices.',
 'אצלנו תוכלו לקבל תיקון מהיר, ייעוץ מקצועי, אביזרים למכשיר, פתרונות לרכב ולאופנוע, וקווים ומכשירים מחברות מובילות.':'Visit us for fast repairs, expert advice, device accessories, car and motorcycle solutions, and mobile plans and devices from leading providers.',
 'פרטי הגעה ויצירת קשר':'Directions and contact details','המרכבה 31, חולון':'31 Hamerkava St, Holon','מתחם כלבו חצי חינם':'Kolbo Hatzi Hinam complex','א׳-ה׳:':'Sun-Thu: ','יום ו׳:':'Fri: ',
 'הפרטים יועברו לחנות באמצעות FormSubmit לצורך מענה לפנייה.':'Your details will be sent to the store via FormSubmit so we can respond. ',
 'מדיניות פרטיות':'Privacy policy','וואטסאפ':'WhatsApp','טלפון':'Phone','אימייל':'Email','ניווט Waze':'Waze directions','גוגל':'Google','פייסבוק':'Facebook','אינסטגרם':'Instagram',
 'ציוד DJ • מיקסרים • ציוד אולפן • תאורה • אביזרים':'DJ Gear • Mixers • Studio Equipment • Lighting • Accessories','לחנות Pro Audio':'Visit Pro Audio'
 });
 const nodes=[];const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);while(walker.nextNode()){const n=walker.currentNode;if(n.parentElement.closest('script,style,[data-he],#products,#cartDrawer'))continue;const he=n.textContent.trim();let en=translations[he];if(!en&&he.startsWith('ELECTROSHOP / '))en='ELECTROSHOP / '+(translations[he.slice(14)]||'Our store');if(!en&&he.startsWith('החנות שלנו / '))en='Our store / '+(translations[he.slice(12)]||'');if(en)nodes.push({n,he:n.textContent,en});}
 const translate=()=>{const english=getLang()==='en';nodes.forEach(({n,he,en})=>n.textContent=english?en:he);};
 document.addEventListener('electroshop-language-change',translate);applyLang(getLang());translate();
 const admin=document.getElementById('adminMenuLinks');
 if(admin){
   let checkVersion=0;
   async function refreshAdminLinks(){
     const version=++checkVersion;
     admin.hidden=true;
     try{
       const api=await import('./shop-api.js?v=media-webp-1');
       const session=await api.getSession();
       const authorized=!!session && (await api.isAdmin(session))===true;
       if(version===checkVersion)admin.hidden=!authorized;
     }catch{if(version===checkVersion)admin.hidden=true;}
   }
   refreshAdminLinks();
   window.addEventListener('pageshow',refreshAdminLinks);
   window.addEventListener('storage',event=>{if(event.key==='electroshop_admin_session_v1'||event.key===null)refreshAdminLinks();});
   document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshAdminLinks();});
 }
});

// Carry the current category through management into the new-product editor.
function setManagementCategoryLinks(){
 const file=location.pathname.split('/').pop();
 const page=document.querySelector('main[data-category],main[data-store-category]');
 const slug=file==='shop-category.html'?new URLSearchParams(location.search).get('category'):file==='shop-carholder.html'?'car-mounts':page?.dataset.storeCategory||page?.dataset.category;
 if(!slug||slug==='unavailable'||!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug))return;
 document.querySelectorAll('a[href]').forEach(link=>{const url=new URL(link.href,location.href);if(url.origin===location.origin&&url.pathname.endsWith('/shop-admin.html')){url.searchParams.set('category',slug);link.href=url.href;}});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setManagementCategoryLinks);else setManagementCategoryLinks();
// Use the same direct user-click opening mechanism as the product editor.
document.querySelectorAll('#adminMenuLinks a[href]').forEach(link=>{
 link.addEventListener('click',event=>{
  if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  event.preventDefault();
  window.open(link.href,'_blank');
  closeMenu();
 });
});
