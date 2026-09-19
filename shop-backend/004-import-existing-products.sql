begin;
do $seed$ declare product_uuid uuid; begin
if not exists(select 1 from public.electroshop_products where sku='ELECTRO-001') then
 insert into public.electroshop_products(sku,name_he,name_en,description_he,description_en,category,regular_price_ils,price_ils,featured,sort_order)
 values('ELECTRO-001','Audio Live Mixer S30','Audio Live Mixer S30','מיקסר אודיו S30 עם אפקטים ל-DJ, שינויי קול, הקלטת מוזיקה וכרטיס קול מובנה.

ללא סוללה מובנית
המכשיר פועל באמצעות מקור מתח חיצוני ואינו כולל סוללה פנימית.

מתאם כלול באריזה
המוצר מגיע עם מתאם מתאים, כך שאין צורך לרכוש אותו בנפרד.

איכות שמע גבוהה
כרטיס הקול של S30 מיועד להקלטת אודיו ומספק צליל ברור ומדויק.

מתח AC יציב
הפעלה באמצעות מתח AC מאפשרת עבודה יציבה ומתאימה להקלטות באולפן וגם לשימוש בהופעות חיות.

אפקטים ושינויי קול
כולל אפשרויות לשינוי הקול ואפקטים המאפשרים להתנסות בגוונים וסגנונות קול שונים.','S30 audio mixer with DJ mixing effects, voice-changing features, music recording and built-in sound card.

No Built-in Battery
The device operates using an external power source and does not include a built-in battery.

Adapter Included
The S30 comes with an adapter, eliminating the need to purchase one separately.

High-Quality Sound
The S30 sound card is designed for audio recording and delivers clear and precise sound.

Stable AC Power
AC-powered operation provides stable performance suitable for both studio recording and live applications.

Voice-Changing Effects
Built-in voice-changing features allow users to experiment with different vocal tones, effects and styles.','pro-audio',379,379,true,1) returning id into product_uuid;
 insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product01-main.jpg',true,0);
insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product01-01.jpg',false,1);
insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product01-02.jpg',false,2);
insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product01-03.jpg',false,3);
insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product01-04.jpg',false,4);
insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product01-05.jpg',false,5);
end if;
if not exists(select 1 from public.electroshop_products where sku='ELECTRO-002') then
 insert into public.electroshop_products(sku,name_he,name_en,description_he,description_en,category,regular_price_ils,price_ils,featured,sort_order)
 values('ELECTRO-002','M-VAVE SMK-25 Mini MIDI Keyboard','M-VAVE SMK-25 Mini MIDI Keyboard','מקלדת MIDI קומפקטית עם 25 קלידים רגישים לעוצמת לחיצה, Bluetooth, סוללה נטענת וחיבור USB-C. מתאימה למחשב, Mac, iOS ו-Android.

חיבור USB
חברו את הכבל דרך יציאת USB-C למחשב Windows או Mac. המקלדת מזוהה אוטומטית וגם נטענת בזמן החיבור. נורית אדומה מציינת טעינה ונורית ירוקה מציינת שהטעינה הושלמה.

חיבור Bluetooth
לחיצה ממושכת על כפתור BT מפעילה את החיבור האלחוטי. נורית מהבהבת מציינת שה-Bluetooth פעיל, ונורית קבועה מציינת חיבור מוצלח.

חיבור אלחוטי ישיר
ניתן להתחבר ל-Windows, Mac, iOS ו-Android באמצעות Bluetooth. ב-Windows נדרשים Bluetooth 5.0 ודרייבר BLE MIDI מתאים. ב-iOS וב-Android נדרשת תוכנה התומכת ב-BLE MIDI והחיבור מתבצע מתוך התוכנה.

MIDI OUT
ניתן לשנות בתוכנה את מצב חיבור הפדל מ-Pedal ל-MIDI OUT, ולאחר מכן להשתמש בחיבור 3.5 מ״מ כיציאת MIDI לחיבור לסינתיסייזר או ציוד MIDI אחר. חיבור MIDI אלחוטי דורש מתאם MIDI אלחוטי נוסף הנמכר בנפרד.

קלידים ובקרות
25 קלידים רגישים לעוצמת לחיצה ובקר סיבובי 360° הניתן להקצאה.

חיבורים
יציאת 3.5 מ״מ לפדל Sustain, חיבור USB-C, חיבור אלחוטי ל-Windows/Mac/iOS/Android ותמיכה ב-MIDI OUT אלחוטי באמצעות התקן MIDI נוסף.

סוללה
סוללה נטענת 780mAh. ניתן להפעיל את המקלדת גם באמצעות USB. באריזה כלול כבל USB בלבד.

מידות ומשקל
מידות: 348 × 105 × 38 מ״מ. משקל: 460 גרם.

מה כלול באריזה
מקלדת SMK-25 MINI MIDI, כבל USB ומדריך למשתמש.','Compact 25-key velocity-sensitive MIDI keyboard with Bluetooth, rechargeable battery and USB-C connectivity. Compatible with Windows, Mac, iOS and Android.

USB Connection
Connect the keyboard to a Windows PC or Mac through the USB-C port. It is recognized automatically and charges at the same time. Red light indicates charging and green light indicates charging is complete.

Bluetooth Connection
Press and hold the BT button to activate wireless mode. A flashing light indicates Bluetooth is active, while a steady light indicates a successful connection.

Direct Wireless Connection
Connect directly to Windows, Mac, iOS or Android via Bluetooth. Windows requires Bluetooth 5.0 and a compatible BLE MIDI driver. iOS and Android require software that supports BLE MIDI, with the connection made inside the software.

MIDI OUT
The pedal port can be changed from Pedal mode to MIDI OUT in the software, allowing the 3.5 mm port to connect to a hardware synthesizer or other MIDI equipment. Wireless MIDI OUT requires an additional wireless MIDI adapter sold separately.

Keys & Controls
25 velocity-sensitive keys and one assignable endless 360-degree encoder.

Connections
3.5 mm sustain pedal port, USB-C, wireless connectivity with Windows/Mac/iOS/Android, and wireless MIDI OUT support with an additional MIDI device.

Power
Built-in 780mAh rechargeable battery or USB bus power. USB cable is included.

Dimensions & Weight
Dimensions: 348 × 105 × 38 mm. Weight: 460 g.

Package Includes
1 × SMK-25 MINI MIDI Keyboard, 1 × USB connection cable and 1 × user manual.','pro-audio',399,399,true,2) returning id into product_uuid;
 insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product02-main.jpg',true,0);
insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product02-01.jpg',false,1);
insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product02-02.jpg',false,2);
insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product02-03.jpg',false,3);
insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product02-04.jpg',false,4);
insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product02-05.jpg',false,5);
end if;
if not exists(select 1 from public.electroshop_products where sku='ELECTRO-003') then
 insert into public.electroshop_products(sku,name_he,name_en,description_he,description_en,category,regular_price_ils,price_ils,featured,sort_order)
 values('ELECTRO-003','All-in-One High-Quality Audio Recording','All-in-One High-Quality Audio Recording','ערכת אולפן All-in-One הכוללת מיקסר אודיו RGB ומיקרופון דינמי, המתאימה להקלטות, גיימינג, פודקאסטים, סטרימינג ועוד.

פתרון מלא לפודקאסטים והקלטות
ערכת FIFINE All-in-One כוללת את הציוד הדרוש להקלטת אודיו באיכות גבוהה, עם מיקרופון דינמי ומיקסר אודיו RGB לשימוש בסטרימינג, פודקאסטים ואולפן.

דפוס קליטה Cardioid
המיקרופון קולט בעיקר את הצליל המגיע מלפנים ומסייע בהפחתת רעשי רקע, לקבלת הקלטת קול ברורה יותר בסביבה ביתית או באולפן.

חיבור קווי יציב
החיבור הקווי מספק העברת אודיו יציבה ללא תלות באות אלחוטי, ומתאים לסטרימינג חי, הקלטות וגיימינג.

מיקרופון דינמי
המיקרופון הדינמי מיועד להפקת קול ברור ומפורט עבור פודקאסטים, סטרימינג ויצירת תוכן.

מיקסר אודיו RGB
המיקסר המצורף כולל תאורת RGB המוסיפה אפקטים צבעוניים לעמדת הסטרימינג או ההקלטה.

מידות ומשקל האריזה
מידות האריזה: 31 × 28 × 10 ס״מ. משקל: 1.535 ק״ג.

תקנים
לפי פרטי המוצר, הערכה מצוינת כבעלת תקני CE, FCC ו-KC.','All-in-One Kit with RGB Audio Mixer, Streaming Studio Set with Dynamic Mic for Recording, Gaming, Podcasting and more.

Complete Podcasting Solution
Complete all-in-one kit for high-quality audio recording, including a dynamic microphone and RGB audio mixer for streaming, podcasting, gaming and studio use.

Cardioid Pickup Pattern
Captures sound primarily from the front while helping reduce unwanted background noise for clearer voice recordings.

Stable Wired Connectivity
Wired connection provides consistent audio transmission without relying on a wireless signal, suitable for live streaming, recording and gaming.

Dynamic Microphone
Designed to deliver clear and detailed voice reproduction for podcasting, streaming and content creation.

RGB Audio Mixer
The included mixer features RGB lighting effects that add a colorful visual element to your streaming or recording setup.

Package Dimensions & Weight
Package dimensions: 31 × 28 × 10 cm. Weight: 1.535 kg.

Certifications
According to the product information, the kit is listed with CE, FCC and KC certifications.','pro-audio',549,549,true,3) returning id into product_uuid;
 insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product03-main.jpg',true,0);
insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product03-01.jpg',false,1);
insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product03-02.jpg',false,2);
insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product03-03.jpg',false,3);
insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product03-04.jpg',false,4);
insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product03-video.mp4',false,5);
end if;
if not exists(select 1 from public.electroshop_products where sku='ELECTRO-004') then
 insert into public.electroshop_products(sku,name_he,name_en,description_he,description_en,category,regular_price_ils,price_ils,featured,sort_order)
 values('ELECTRO-004','OneOdio Studio Pro DJ Headphone','OneOdio Studio Pro DJ Headphone','אוזניות DJ ואולפן מקצועיות עם דרייברים 50 מ״מ, צליל Hi-Fi, מבנה Over-Ear נוח, כבלים נתיקים ומיקרופון.

דרייברים מקצועיים 50 מ״מ
דרייברים עם מגנטים Neodymium המספקים צליל Hi-Fi עשיר ומפורט, בהירות גבוהה ובס עמוק.

כבלים נתיקים וחיבורים גמישים
כולל כבל 3.5mm ל-6.3mm באורך 2.6 מטר וכבל 3.5mm ל-3.5mm באורך 1.2 מטר.

מבנה Over-Ear נוח
כריות Memory Foam ומבנה אטום מספקים נוחות בשימוש ממושך ובידוד רעשים טוב יותר.

מיקרופון מובנה
מתאים גם לשיחות, גיימינג וצ''אט קולי במכשירים תואמים.

ל-DJ, אולפן ומוניטורינג
מתאים למוניטורינג מקצועי, מיקסינג, הקלטה ועבודת DJ.

תכולת האריזה
אוזניות Studio DJ, כבל 3.5mm ל-6.3mm באורך 2.6 מ׳, כבל 3.5mm ל-3.5mm באורך 1.2 מ׳, נרתיק ואריזה מקורית של OneOdio.','Professional studio and DJ over-ear headphones with 50mm drivers, Hi-Fi sound, detachable cables and microphone.

Professional 50mm Drivers
50mm drivers with neodymium magnets deliver rich, detailed Hi-Fi audio, excellent clarity and deep bass.

Detachable Cables
Includes a 2.6m 3.5mm-to-6.3mm cable and a 1.2m 3.5mm-to-3.5mm cable.

Over-Ear Memory Foam Design
Sealed over-ear earcups with memory foam pads provide comfort and improved sound isolation.

Integrated Microphone
Suitable for calls, gaming and voice chat on compatible devices.

Professional DJ & Studio Monitoring
Designed for DJ monitoring, studio work, mixing and recording.

Package Contents
Studio DJ Headphone, 2.6m 3.5mm-to-6.3mm cable, 1.2m 3.5mm-to-3.5mm cable, pouch and OneOdio retail box.','pro-audio',349,349,true,4) returning id into product_uuid;
 insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product04-main.jpg',true,0);
insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product04-01.jpg',false,1);
insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product04-02.jpg',false,2);
insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product04-03.jpg',false,3);
insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product04-04.jpg',false,4);
insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product04-05.jpg',false,5);
insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product04-video.mp4',false,6);
end if;
if not exists(select 1 from public.electroshop_products where sku='ELECTRO-005') then
 insert into public.electroshop_products(sku,name_he,name_en,description_he,description_en,category,regular_price_ils,price_ils,featured,sort_order)
 values('ELECTRO-005','תושבת מגנטית לרכב','Magnetic car mount','מעמד מגנטי איכותי לרכב עם נעילה אחורית חזקה, מגנטים עוצמתיים, סיבוב 360° ותופסן כבל.','Magnetic car mount with rear lock, 360 degree rotation and cable clip.','car-mounts',89,89,false,5) returning id into product_uuid;
 insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/heb01.jpg',true,0);
insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/heb02.jpg',false,1);
insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/heb03.jpg',false,2);
end if;
end $seed$;
commit;
