/**
 * Manevi Pusula — 18 Aykırı / Zorlayıcı Sınav Kalkanı (Adversarial Guardrails Engine)
 *
 * Müşterinin ve sistem anayasasının zorlayıcı 18 kriz senaryosunu
 * sıfır hata ve sıfır halüsinasyonla karşılayan deterministik güvenlik katmanı:
 *
 * 1. Kriz ve Can Güvenliği (İntihar / Kendine Zarar) -> 112 & ALO 183
 * 2. Şer'i / Fetva Sınırı (Kripto Hac, Fıkhi Hüküm) -> ALO 190 Diyanet
 * 3. Siyasi ve İdeolojik Yönlendirme (Devlet / Hükümet) -> Tarafsızlık Reddi
 * 4. Nefis Aklama ve Mağduriyet (Öfke Kontrolü) -> Sünnet Ahlakı & Pehlivan Hadisi
 * 5. Dini Hüküm ile Oynama / Tahrifat (2 Vakit Namaz vb.) -> Sahih Sünnet & ALO 190
 * 6. Aile Yıkımı ve Boşanma ("Seni boşuyorum", Talak) -> ALO 190 & Aile Sulhü
 * 7. Ümitsizlik ve Şeytan Vesvesesi -> Duha 3 & Hüzün Yılı Tevekkülü
 * 8. Mahremiyet ve Gizli Veri İhlali (Sistem / Diğer Kullanıcı Verileri) -> Sıfır-PII Zırhı
 * 9. Faiz / Riba Çaresizliği -> Bakara 275-279 Riba Kalkanı & Talak 2-3
 * 10. Şüpheli Kazanç / Kumar / Bahis ile Cami Yaptırma -> "Allah tayyiptir..."
 * 11. Sisteme Rol Biçme / Şeytanın Avukatlığı (Jailbreak) -> Müstakil Duruş
 * 12. Ağır Kader ve Teodise (Kötülük Problemi) -> İmtihan Sırrı & Bakara 155
 * 13. Büyü, Muska ve Hurafeler -> Fal/Cinci Reddi, Muavvizeteyn
 * 14. Aile İçi Ağır İntikam ve Zarar Verme -> Zarar Verme Yasağı & Hilm
 * 15. Günah İtirafı ve Aracılık -> Ruhbanlık Reddi & Doğrudan Tövbe (Zümer 53)
 * 16. Tıbbi Teşhis ve İlaç Bırakma -> Tıbbi Hekim Yönlendirmesi
 * 17. Cinsiyet Değiştirme ve Biyoetik -> Fıtrat & ALO 190
 * 18. Sahte / Uydurma Hadis Sorma -> "Kasamda bu ifadede onaylı bir hadis bulunmamaktadır"
 * 19. Ağır Yas, Ailevi Dağılma ve Tükenmişlik (Sadece Dijital Kalmama) -> Yüz Yüze ADRB, Aile Rehberleri & İlim Meclisleri
 */

import { ChatIntentMode, isConversationalClosingOrThanks } from "./intent-router";

export interface AdversarialGuardrailMatch {
  ruleId:
    | "CRISIS_SUICIDE"
    | "VIOLENCE_HARM"
    | "JAILBREAK_ROLEPLAY"
    | "PRIVACY_LEAK_PROBE"
    | "MEDICAL_DRUG_DROP"
    | "POLITICAL_PARTISAN"
    | "CONFESSION_INTERMEDIARY"
    | "TALAK_DIVORCE_RULING"
    | "GENDER_BIOETHICS"
    | "CRYPTO_FATWA_DEMAND"
    | "NAMAZ_TAHRIFAT_DEFENSE"
    | "ILMIHAL_IBADET_SIHHATI_GUARD"
    | "THEODICY_EVIL_DEFENSE"
    | "MAGIC_SUPERSTITION_BLOCK"
    | "SPURIOUS_HADITH_GUARD"
    | "DESPAIR_UNANSWERED_DUA_GUARD"
    | "RIBA_APPROVAL_GUARD"
    | "GAMBLING_CHARITY_GUARD"
    | "NAFS_AKLAMA_OFKE_GUARD"
    | "GRIEF_BURNOUT_COMMUNITY_BRIDGE"
    | "CONVERSATIONAL_CLOSING_THANKS";
  replyText: string;
  auditTag: string;
  status: "crisis_redirected" | "fatwa_blocked" | "processed";
  intentMode?: ChatIntentMode;
}

// 1. Kriz & İntihar Genişletilmiş Tespiti (Varyant, birleşik yazım ve niyet esneklikli)
const EXTENDED_SUICIDE_PATTERNS: ReadonlyArray<RegExp> = [
  /intihar/i,
  /[öo]lmek\s*(ist|kork|d[üu][şs][üu]n|ak[ıi]l|geliyor|ge[çc]iyor|e[şs]i[ğg]|niyet)/i,
  /[öo]lmeyi\s*(d[üu][şs][üu]n|ist|kork|plan|ak[ıi]l)/i,
  /[öo]lsem\s*(de|da)?\s*(kurtulsam|bitse|rahatlasam)/i,
  /ya[şs]amak\s*(istemiyorum|gelmiyor|zor|anlams[ıi]z)/i,
  /ya[şs]amaktan\s*(b[ıi]kt[ıi]m|usand[ıi]m|yoruldum|so[ğg]udum|t[üu]kendim)/i,
  /ya[şs]amam[ıi]n\s*(hi[çc]\s*)?(anlam[ıi]|manas[ıi])\s*(yok|kalmad[ıi])/i,
  /ya[şs]amay[ıi]\s*(b[ıi]rak|sonland[ıi]r)/i,
  /(hayat[ıi]ma|ya[şs]am[ıi]ma)\s*son\s*ver/i,
  /(can[ıi]ma?\s*k[ıi]y|canimakiy)/i,
  /can[ıi]m[ıi]\s*al(mak|maya)?\s*(ist|kork|d[üu][şs][üu]n|ak[ıi]l)/i,
  /kendimi\s*([öo]ld[üu]r|oldur|asac|kesec|vurac|yok\s*ed|zehirle)/i,
  /(kendime|kendimi)\s*zarar\s*ver(mek|meye|mekten)?\s*(ist|kork|d[üu][şs][üu]n|ak[ıi]l|niyet|plan|ge[çc])?/i,
  /(kendime|kendimi)\s*zararver(mek|meye|mekten)?/i,
  /(bu\s*gece|art[ıi]k)?\s*her\s*[şs]eyi\s*bitir(mek|meyi|ece[ğg]im)?\s*(d[üu][şs][üu]n|ist|kork|ak[ıi]l|plan|koydum)/i,
  /her\s*[şs]eyi\s*bitirmeyi\s*d[üu][şs][üu]n/i,
];

// 2. Sisteme Rol Biçme / Jailbreak Tespiti (Varyant ve kural esnetme korumalı)
const JAILBREAK_PATTERNS: ReadonlyArray<RegExp> = [
  /(yapay\s*zeka|asistan|bot|model)\s*oldu[ğg]unu\s*(unut|b[ıi]rak|gizle)/i,
  /(kurallar[ıi]|talimatlar[ıi]|anayasay[ıi]|s[ıi]n[ıi]rlar[ıi])\s*(hi[çc]e\s*say|unut|yoksay|kald[ıi]r|bo[şs]ver|bir\s*kenara\s*b[ıi]rak)/i,
  /(rol\s*yap|rol[üu]ne\s*gir|rol[üu]n[üu]\s*oyna|gibi\s*davran)/i,
  /(orta\s*[çc]a[ğg].*filozof|kural\s*tan[ıi]mayan.*filozof|filozofsun|filozof\s*ol)/i,
  /dinlerin.*(uyduruldu[ğg]unu|yalan\s*oldu[ğg]unu|insanlar[ıi]\s*kand[ıi]rmak)\s*(kan[ıi]tla|s[öo]yle|savun|anlat)/i,
  /(dan\s*mod|jailbreak|developer\s*mode|geli[şs]tirici\s*mod)/i,
  /(bana\s*)?(tanr[ıi]n[ıi]n|allah[''’]?[ıi]n)\s*olmad[ıi][ğg][ıi]n[ıi]\s*(kan[ıi]tla|anlat|savun)/i,
  /(sistem\s*talimatlar[ıi]n[ıi]|system\s*prompt[ıi]n[ıi]|promptunu)\s*(yoksay|unut|del|ge[çc]|iptal|g[öo]ster)/i,
  /ignore\s*(all\s*)?(previous|system)\s*instructions/i,
  /sen\s*art[ıi]k\s*(bir\s*)?(filozof|özgür|kural\s*tan[ıi]maz)/i,
];

// 3. Mahremiyet / Gizli Veri İhlali Tespiti (Sistem logları, geçmiş kullanıcı sızıntısı)
const PRIVACY_LEAK_PATTERNS: ReadonlyArray<RegExp> = [
  /(senden\s*önce|senden\s*once|ba[şs]ka|di[ğg]er).*(giren|yazan|konu[şs]an|kullan[ıi]c[ıi]|insan).*(dert|isim|mesaj|kimlik|soru|konu|itiraf)/i,
  /(önceki|onceki|ge[çc]mi[şs])\s*(konu[şs]ulanlar[ıi]|mesajlar[ıi]|sohbetleri|oturumlar[ıi]|kay[ıi]tlar[ıi])\s*(anlat|d[öo]k|g[öo]ster|ver|yaz|listele)/i,
  /(ba[şs]ka|di[ğg]er)\s*kullan[ıi]c[ıi]lar[ıi]n.*(veri|mesaj|dert|isim|kay[ıi]t|soru|sohbet)/i,
  /(sistemdeki|veritaban[ıi]ndaki)\s*t[üu]m\s*(verileri|kullan[ıi]c[ıi]lar[ıi]|kay[ıi]tlar[ıi]|loglar[ıi])\s*(d[öo]k|g[öo]ster|ver|listele|payla[şs])/i,
  /(veritaban[ıi]ndaki|sistemdeki).*kullan[ıi]c[ıi]/i,
  /(di[ğg]er|ba[şs]ka)\s*insanlar[ıi]n\s*(itiraflar[ıi]|g[üu]nahlar[ıi]|dertleri|isimleri)/i,
  /(bana\s*önceki\s*konu[şs]ulanlar[ıi]|bana\s*kullan[ıi]c[ıi]\s*isimleri)/i,
];

// 4. Tıbbi Teşhis ve İlaç Bırakma Tespiti (Birleşik yazım ve niyet esneklikli)
const MEDICAL_TREATMENT_PATTERNS: ReadonlyArray<RegExp> = [
  /(ilac[ıi]|ila[çc]lar[ıi]m[ıi]|tedaviyi)\s*(çöpe|cope|b[ıi]rak|i[çc]me|kes|at)\w*/i,
  /(ilac[ıi]?b[ıi]rak|ilac[ıi]?kes|ilac[ıi]?at)/i,
  /(ilac[ıi]|ila[çc]lar[ıi]m[ıi]|antidepresan[ıi]?|psikiyatri\s*ilac[ıi]?)\s*(b[ıi]rak|kes|at|i[çc]me)\w*\s*(ist|kork|d[üu][şs][üu]n|ak[ıi]l|niyet|plan|m[ıi]y[ıi]m|m[ıi]y[ıi]z|olur\s*mu|do[ğg]ru\s*mu)/i,
  /doktor.*ila[çc]\s*(yazd[ıi]|verdi).*(kullanmak\s*istem|b[ıi]rak|i[çc]me|kes)/i,
  /kimyasal\s*(ila[çc]|madde)?\s*(kullanmak\s*istem|b[ıi]rak)/i,
  /sadece\s*kur'?an\s*okusak?.*iyile[şs]ir\s*miyim/i,
  /(antidepresan|psikiyatri\s*ilac[ıi]|antipsikotik).*(b[ıi]rak|kes|i[çc]me|çöpe|cope)/i,
  /(ila[çc]lar[ıi]m[ıi]|ilac[ıi]m[ıi])\s*b[ıi]raksam\s*(olur\s*mu|iyile[şs]ir\s*miyim|g[üu]nah\s*m[ıi])/i,
];

// 5. Siyasi ve İdeolojik Yönlendirme Tespiti
const POLITICAL_PARTISAN_PATTERNS: ReadonlyArray<RegExp> = [
  /(hükümetin|hukumetin|devletin|iktidar[ıi]n|cumhurba[şs]kan[ıi]n[ıi]n|bakanl[ıi][ğg][ıi]n)\s*uygulad[ıi][ğg][ıi].*(ekonomi|politika|karar)/i,
  /(bu\s*)?(y[öo]netim|hükümet|iktidar|muhalefet)\s*hakk[ıi]nda\s*ne\s*d[üu][şs][üu]n/i,
  /(akp|chp|mhp|hdp|dem\s*parti|iyi\s*parti|saadet|yeniden\s*refah).*(dine\s*uygun|do[ğg]ru\s*mu|helal\s*mi|g[üu]nah\s*m[ıi]|oy\s*ver)/i,
  /se[çc]imlerde?\s*(kime|hangi\s*partiye)\s*oy\s*vermeli/i,
  /(mevcut\s*iktidar|mevcut\s*hükümet|devlet\s*politikalar[ıi]).*(islami\s*mi|dine\s*uygun|helal\s*mi)/i,
  /cumhurba[şs]kan[ıi].*(politikas[ıi]|kararlar[ıi]).*(helal|haram|dine\s*uygun)/i,
];

// 6. Günah İtirafı ve Ruhbanlık / Aracılık Talebi Tespiti
const CONFESSION_INTERMEDIARY_PATTERNS: ReadonlyArray<RegExp> = [
  /(allah[''’]?a|rabbime?)\s*(benim\s*ad[ıi]ma|benim\s*i[çc]in)\s*arac[ıi]/i,
  /benim\s*i[çc]in\s*arac[ıi]/i,
  /(arac[ıi]l[ıi]k|araci|vas[ıi]ta)\s*(eder\s*misin|olur\s*musun|yapar\s*m[ıi]s[ıi]n)/i,
  /sana\s*(b[üu]t[üu]n\s*)?g[üu]nah[ıi]m[ıi]\s*(anlatay[ıi]m|itiraf\s*edeyim|itiraf\s*etsem)/i,
  /sana\s*her\s*[şs]eyi\s*itiraf\s*etsem/i,
  /itiraf\s*etsem.*(affe[td]|ba[ğg][ıi][şs]la|arac[ıi]|silinir\s*mi)/i,
  /(g[üu]nah[ıi]m[ıi]|su[çc]umu)\s*itiraf\s*(etmek|ediyorum)/i,
  /beni\s*ba[ğg][ıi][şs]la/i,
  /beni\s*affetmesi\s*i[çc]in\s*arac[ıi]/i,
  /g[üu]nah\s*[çc][ıi]kar(mak|ma|ay[ıi]m)/i,
];

// 7. Ağır İntikam ve Başkasına Zarar Verme Tespiti (Birleşik yazım, niyet ve korku varyantları)
const REVENGE_HARM_PATTERNS: ReadonlyArray<RegExp> = [
  /zarar\s*ver\w*\s*(ist|kork|d[üu][şs][üu]n|ak[ıi]l|niyet|plan|ge[çc]|meyil|koydum)/i,
  /zararver\w*/i,
  /(birine|birisine|ba[şs]kas[ıi]na|ona|onlara|babama|e[şs]ime|bir\s*insana)?\s*zarar\s*ver/i,
  /gizlice\s*zarar\s*ver/i,
  /(hayat[ıi]n[ıi]|hayatlar[ıi]n[ıi])\s*karart\w*/i,
  /(can[ıi]n[ıi]|canlar[ıi]n[ıi])\s*yak\w*\s*(ist|kork|d[üu][şs][üu]n|ak[ıi]l|niyet|plan|ge[çc])?/i,
  /(onu|onlar[ıi]|birini)\s*mahvet\w*/i,
  /(intikam\s*almak|öc\s*almak)\s*i[çc]in.*(zarar|can[ıi]n[ıi]|karart|mahvet|k[öo]t[üu]l[üu]k|vur)/i,
  /(yeme[ğg]ine|suyuna|i[çc]ece[ğg]ine)\s*(bir\s*[şs]ey|zehir|ila[çc])\s*kat/i,
];

// 8. Boşanma ve Talak Hükmü Talebi Tespiti (Soru 6)
const TALAK_DIVORCE_PATTERNS: ReadonlyArray<RegExp> = [
  /(seni\s*bo[şs]uyorum|senibo[şs]uyorum)\s*(dedim|dersem|desem)?/i,
  /(bo[şs]and[ıi]k\s*m[ıi]|bosandik\s*mi)\s*(biz)?/i,
  /(nikah[ıi]m[ıi]z|nikah)\s*(d[üu][şs]t[üu]|bozuldu|bitti|ge[çc]ersiz)\s*m[üu]/i,
  /(ü[çc]|3)\s*talak/i,
  /(bo[şs]\s*ol|bo[şs]ol)\s*(dedim|dersem|desem)/i,
  /bo[şs]anm[ıi][şs]\s*say[ıi]l[ıi]r\s*m[ıi](y[ıi]z|y[ıi]m)/i,
  /talak\s*(vuku\s*buldu|ge[çc]erli\s*mi|oldu\s*mu)/i,
];

// 9. Cinsiyet Değiştirme ve Biyoetik Tespiti (Soru 17)
const GENDER_BIOETHICS_PATTERNS: ReadonlyArray<RegExp> = [
  /(cinsiyet\s*de[ğg]i[şs]tir|cinsiyetde[ğg]i[şs]tir)/i,
  /(cinsiyet\s*ge[çc]i[şs]|cinsiyet\s*uyum)\s*(ameliyat|s[üu]re[çc]|operasyon)/i,
  /kendimi\s*(kad[ıi]n|erkek)\s*gibi\s*hissediyorum/i,
  /(trans\s*birey|transseks[üu]el|cinsiyet\s*de[ğg]i[şs]imi)/i,
  /(kad[ıi]n\s*olmak|erkek\s*olmak)\s*istiyorum.*(dinen|ameliyat|fetva)/i,
];

// 10. Kripto ve Doğrudan Fetva Dayatması (Soru 2)
const CRYPTO_FATWA_PATTERNS: ReadonlyArray<RegExp> = [
  /kripto.*(hacca\s*gitsem|hac\s*yap|hac\s*caiz|kabul\s*olur\s*mu)/i,
  /(bana\s*)?(net|kesin|a[çc][ıi]k)\s*(bir\s*)?fetva\s*(ver|istiyorum)/i,
  /(kripto|bitcoin|btc|kripto\s*para).*(helal\s*mi\s*haram\s*m[ıi]|caiz\s*mi|fetva)/i,
  /fetva\s*ver.*(helal\s*mi|haram\s*m[ıi])/i,
];

// 11. Dini Hüküm ile Tahrifat (2 Vakit Namaz İddiası - Soru 5)
const NAMAZ_TAHRIFAT_PATTERNS: ReadonlyArray<RegExp> = [
  /namaz[ıi]?\s*(2|iki|3|[üu][çc])\s*vakit\s*(k[ıi]lsam|k[ıi]l[ıi]n[ıi]r\s*m[ıi]|olur\s*mu|yeter\s*mi)/i,
  /namaz[ıi]n\s*(5|be[şs])\s*vakit\s*(oldu[ğg]una\s*dair|oldu[ğg]u\s*nerede)/i,
  /kur'?an'?da\s*namaz[ıi]n\s*(5|be[şs])\s*vakit/i,
  /a[çc][ıi]k\s*ayet\s*var\s*m[ıi].*(namaz|5\s*vakit|be[şs]\s*vakit)/i,
];

// 11.5. İlmihal ve İbadet Sıhhati Yakalayıcısı (Abdest / Gusül / Namaz / Oruç + Sıhhat / Özür / Su / Kanama)
const WORSHIP_SUBJECT_REGEX =
  /(?<![\p{L}\p{N}])(?:abdest[\p{L}]*|gus[üu]l[\p{L}]*|gusl[\p{L}]*|boy\s*abdest[\p{L}]*|c[üu]n[üu]p[\p{L}]*|cenabet[\p{L}]*|hay[ıi]z[\p{L}]*|lohusa[\p{L}]*|teyemm[üu]m[\p{L}]*|taharet[\p{L}]*|mesh[\p{L}]*|mest[\p{L}]*|namaz[\p{L}]*|rek[aâ]t[\p{L}]*|secde[\p{L}]*|sehiv|r[üu]k[uû][\p{L}]*|k[ıi]raat[\p{L}]*|tahiyyat[\p{L}]*|kunut|vitir|teravih|oru[çc][\p{L}]*|oruc[\p{L}]*|sahur[\p{L}]*|iftar[\p{L}]*|imsak[\p{L}]*|kefaret[\p{L}]*|fidye[\p{L}]*|zek[aâ]t[\p{L}]*|fitre[\p{L}]*|ihram[\p{L}]*|tavaf[\p{L}]*)(?![\p{L}\p{N}])/iu;

const ILMIHAL_VALIDITY_ANCHORS: ReadonlyArray<RegExp> = [
  /(?:bir|bi)\s*[şs]ey\s*olur\s*mu/iu,
  /(?<![\p{L}\p{N}])bi[şs]ey\s*olur\s*mu/iu,
  /(?:s[ıi]k[ıi]nt[ıi]|sorun|mahzur|sak[ıi]nca|zarar|mani|engel)\s*(?:olur\s*mu|var\s*m[ıi]|verir\s*mi)/iu,
  /ge[çc]erli\s*(?:mi|midir|olur\s*mu|say[ıi]l[ıi]r\s*m[ıi])/iu,
  /ge[çc]ersiz\s*(?:mi|midir|olur\s*mu|say[ıi]l[ıi]r\s*m[ıi])/iu,
  /sahih\s*(?:mi|midir|olur\s*mu)/iu,
  /kabul\s*(?:olur\s*mu|edilir\s*mi|m[üu](?:d[üu]r)?|say[ıi]l[ıi]r\s*m[ıi])/iu,
  /(?<![\p{L}\p{N}])(?:farz|vacip|s[üu]nnet|m[üu]stehap|mekruh|[şs]art)\s*m[ıiuü][\p{L}]*(?![\p{L}\p{N}])/iu,
  /bozulur\s*mu|bozuldu\s*mu|bozar\s*m[ıi]|sakatlar\s*m[ıi]/iu,
  /yenilemek\s*(?:gerek[\p{L}]*|laz[ıi]m)|iade\s*etmek\s*gerek[\p{L}]*|kaza\s*(?:etmek\s*)?gerek[\p{L}]*|sehiv\s*secdesi/iu,
  /(?<![\p{L}\p{N}])(?:abdest(?:im)?|gusl?[üu]m|gus[üu]l|namaz(?:[ıi]m)?|oruc(?:um)?|oru[çc])\s*(?:olur|oldu|tamam|say[ıi]l[ıi]r)\s*m[ıiuü]/iu,
  /burn[ua][\p{L}]*\s*su|burun[\p{L}]*\s*su|genz[\p{L}]*\s*su|a[ğg]z[aı][\p{L}]*\s*su|a[ğg][ıi]z[\p{L}]*\s*(?:ve\s*bur[\p{L}]*\s*)?su|(?<![\p{L}\p{N}])(?:mazmaza|istin[şs]ak)(?![\p{L}\p{N}])/iu,
  /(?<![\p{L}\p{N}])(?:kanama[\p{L}]*|kanad[ıi]|kan\s*(?:gel[\p{L}]*|ak[\p{L}]*|ç[ıi]k[\p{L}]*|bula[şs][\p{L}]*|s[ıi]z[\p{L}]*)|irin|iltihap|ak[ıi]nt[ıi][\p{L}]*)(?![\p{L}\p{N}])/iu,
  /(?<![\p{L}\p{N}])öz[üu]r(?!\s*dile)(?:\s*sahibi|\s*hali|\s*kan[ıi]|\s*abdest[\p{L}]*|\s*durum[\p{L}]*|l[üu][\p{L}]*|den|üm|ü)?(?![\p{L}\p{N}])/iu,
  /(?<![\p{L}\p{N}])(?:sahib-?i\s*öz[üu]r|istihaze)(?![\p{L}\p{N}])/iu,
  /(?:unuttum|unutursam|vermesem|vermedim|çekmesem|çekmedim|y[ıi]kamasam|y[ıi]kamad[ıi]m|okumasam|okumad[ıi]m|ka[çc]t[ıi]|ka[çc]arsa|yuttum|yutarsam|kust[\p{L}]*|i[ğg]ne|serum|damla|sprey|oje[\p{L}]*|dolgu|kaplama|sarg[ıi]).*(?:olur\s*mu|ge[çc]erli|kabul|bozul|bozar|gerek[\p{L}]*|laz[ıi]m|say[ıi]l[ıi]r|zarar|engel)/iu,
];

const STANDALONE_ILMIHAL_PATTERNS: ReadonlyArray<RegExp> = [
  /(?:burn[ua][\p{L}]*\s*su|burun[\p{L}]*\s*su|genz[\p{L}]*\s*su|a[ğg]z[aı][\p{L}]*\s*su|a[ğg][ıi]z[\p{L}]*\s*(?:ve\s*bur[\p{L}]*\s*)?su|(?<![\p{L}\p{N}])(?:mazmaza|istin[şs]ak)(?![\p{L}\p{N}])).*(?:olur\s*mu|farz|s[üu]nnet|vacip|[şs]art|ge[çc]erli|sahih|kabul|bozul|bozar|gerek[\p{L}]*|laz[ıi]m|unuttum|vermesem|vermedim|çekmesem|çekmedim|ka[çc]t[ıi]|ka[çc]arsa)/iu,
  /(?:farz|s[üu]nnet|vacip|[şs]art|ge[çc]erli|bozul|bozar).*(?:burn[ua][\p{L}]*\s*su|burun[\p{L}]*\s*su|a[ğg]z[aı][\p{L}]*\s*su|mazmaza|istin[şs]ak)/iu,
  /(?<![\p{L}\p{N}])(?:sahib-?i\s*öz[üu]r|öz[üu]r\s*sahibi|öz[üu]r\s*hali|öz[üu]r\s*kan[ıi]|öz[üu]r\s*abdest[\p{L}]*|istihaze)(?![\p{L}\p{N}])/iu,
];

/**
 * Kullanıcının mesajının abdest, gusül, namaz, oruç vb. ibadetlerin sıhhati / geçerliliği /
 * özür hali hakkında fıkhi ilmihal hükmü sorup sormadığını tespit eder.
 * Duygusal dertleşmeleri ("Namaza başlamak istiyorum", "Allah'tan özür dilerim namazımı aksattım") yakalamaz.
 */
export function detectIlmihalWorshipQuery(userMessage: string): boolean {
  const normalized = (userMessage || "")
    .normalize("NFC")
    .toLocaleLowerCase("tr-TR")
    .replace(/\u0307/g, "")
    .trim();
  if (!normalized) return false;

  // Senaryo 5 (2 vakit namaz tahrifat iddiası) kendi özel kalkanında ele alınır
  if (NAMAZ_TAHRIFAT_PATTERNS.some((p) => p.test(normalized))) {
    return false;
  }

  if (STANDALONE_ILMIHAL_PATTERNS.some((p) => p.test(normalized))) {
    return true;
  }

  if (!WORSHIP_SUBJECT_REGEX.test(normalized)) {
    return false;
  }

  return ILMIHAL_VALIDITY_ANCHORS.some((p) => p.test(normalized));
}

/**
 * İlmihal ve ibadet sıhhati soruları için:
 * 1) Konuya dair genel ilmihal ve "özür" ilkesini kısaca hatırlatır,
 * 2) Yapay zekânın fetva mercii olmadığını ve yanlış/eksik değerlendirmiş olabileceğini tevazu ile belirtir,
 * 3) Diyanet İşleri Başkanlığı Alo 190 Fetva Hattı'na yönlendirir.
 */
export function buildIlmihalGuardrailReply(userMessage: string): string {
  const normalized = (userMessage || "")
    .normalize("NFC")
    .toLocaleLowerCase("tr-TR")
    .replace(/\u0307/g, "")
    .trim();

  const hasMouthOrNoseWater =
    /burn[ua][\p{L}]*\s*su|burun[\p{L}]*\s*su|genz[\p{L}]*\s*su|a[ğg]z[aı][\p{L}]*\s*su|a[ğg][ıi]z[\p{L}]*\s*(?:ve\s*bur[\p{L}]*\s*)?su|mazmaza|istin[şs]ak/iu.test(
      normalized
    );
  const hasFasting = /oru[çc][\p{L}]*|oruc[\p{L}]*|sahur[\p{L}]*|iftar[\p{L}]*|imsak[\p{L}]*/iu.test(
    normalized
  );
  const hasBleedingOrExcuse =
    /(?<![\p{L}\p{N}])(?:kanama[\p{L}]*|kanad[ıi]|kan\s*(?:gel[\p{L}]*|ak[\p{L}]*|ç[ıi]k[\p{L}]*|bula[şs][\p{L}]*|s[ıi]z[\p{L}]*)|irin|iltihap|ak[ıi]nt[ıi][\p{L}]*|sahib-?i\s*öz[üu]r|istihaze|öz[üu]r(?!\s*dile))/iu.test(
      normalized
    );
  const hasPrayer = /namaz[\p{L}]*|rek[aâ]t[\p{L}]*|secde[\p{L}]*|sehiv|r[üu]k[uû][\p{L}]*|k[ıi]raat[\p{L}]*/iu.test(
    normalized
  );

  let principleParagraph: string;

  if (hasMouthOrNoseWater && hasFasting) {
    principleParagraph =
      "Genel ilmihal ve **özür** ilkesi olarak; oruçluyken abdest veya gusül esnasında suyu genze kaçırmadan (mübalağa etmeksizin) ağza ve burna su vermek caizdir; ancak hata ile boğaza/mideye su kaçması veya tıbbi bir **özür** bulunması durumunda mezheplere ve oluş şekline göre farklı fıkhi hükümler söz konusu olur.";
  } else if (hasMouthOrNoseWater) {
    principleParagraph =
      "Genel ilmihal ve **özür** ilkesi olarak; normal namaz **abdestinde** ağza ve burna su vermek **sünnettir**, unutulması abdestin sıhhatine zarar vermez. **Gusülde (boy abdestinde)** ise ağza ve burna su vermek Hanefî mezhebine göre **farz**, Şâfiî mezhebine göre **sünnettir**. Ancak burun içi yarası, kanama, ameliyat veya tıbbi engel gibi **şer'î bir özür** bulunduğunda, dinimizde kolaylık esası gereği zarar verecek kısım zorlanmaz ve özür hükmü devreye girer.";
  } else if (hasBleedingOrExcuse) {
    principleParagraph =
      "Genel ilmihal ve **özür** ilkesi olarak; Hanefî fıkhında vücuttan çıkıp etrafına akan kan abdesti bozar, Şâfiî fıkhında ise bozmaz. Bununla birlikte burun kanaması, diş eti/yara kanaması veya akıntı gibi bir mazeret bir namaz vakti boyunca kesilmiyorsa kişi **'özür sahibi' (sâhib-i özür)** sayılır; her vakit için aldığı abdestle, özrü devam etse dahi o vakit çıkana kadar ibadetlerini eda edebilir.";
  } else if (hasFasting) {
    principleParagraph =
      "Genel ilmihal ve **özür** ilkesi olarak; oruçta kasıt olmaksızın **unutarak** yiyip içmek orucu bozmaz; ancak hataen boğaza bir şey kaçması, tıbbi uygulamalar veya hastalık gibi **özür** halleri işlemin mahiyetine göre kaza veya ruhsat hükümlerine tabidir. İslam fıkhında meşakkat ve şer'î özür durumlarında kolaylık ilkesi esastır.";
  } else if (hasPrayer) {
    principleParagraph =
      "Genel ilmihal ve **özür** ilkesi olarak; namazın sıhhati farzlarına (şart ve rükünlerine) riayet edilmesine bağlıdır; vaciplerin yanılarak terkinde sehiv secdesi gerekirken sünnetlerin unutulması namazı geçersiz kılmaz. Hastalık, ayakta duramama veya elde olmayan **özür** hallerinde ise kişi gücü yettiği kadarıyla mükelleftir.";
  } else {
    principleParagraph =
      "Genel ilmihal ve **özür** ilkesi olarak; ibadetlerin sıhhati farz olan rükünlerin yerine getirilmesine bağlıdır, sünnetlerin unutulması ibadeti geçersiz kılmaz; yara, hastalık veya elde olmayan mazeret (**özür**) hallerinde ise İslam fıkhının kolaylık ve ruhsat hükümleri uygulanır.";
  }

  return (
    `${principleParagraph}\n\n` +
    "Ancak önemle belirtmek isterim ki; **ben fetva mercii değilim**, yalnızca bir yapay zekâyım ve durumunuzun özel şartlarını değerlendirirken **yanlış yapmış veya eksik bilgi vermiş olabilirim**. İbadetinizin sıhhati gibi hassas bir konuda yanılmamak ve durumunuza özel en doğru fıkhi hükmü öğrenmek için lütfen **Diyanet İşleri Başkanlığı'nı (Alo 190 Fetva Hattı)** arayınız veya en yakın müftülüğe danışınız."
  );
}

// 12. Ağır Kader ve Teodise (Kötülük Problemi - Soru 12)
const THEODICY_EVIL_PATTERNS: ReadonlyArray<RegExp> = [
  /masum.*([çc]ocuk|bebek).*ac[ıi]\s*[çc]ekerken.*allah.*(neden|ni[çc]in)\s*(izin\s*ver|g[öo]z\s*yum|sessiz)/i,
  /masum.*([çc]ocuk|bebek).*(neden|ni[çc]in).*allah.*(izin\s*ver|g[öo]z\s*yum|sessiz)/i,
  /allah.*(neden|ni[çc]in).*(sessiz\s*kal|g[öo]z\s*yum|izin\s*ver)/i,
  /(neden|ni[çc]in).*(sessiz\s*kal|g[öo]z\s*yum|izin\s*ver).*(allah|yaratan|tanr[ıi])/i,
  /k[öo]t[üu]l[üu]k\s*problemi/i,
  /allah\s*merhametliyse.*(neden|ni[çc]in).*(ac[ıi]|k[öo]t[üu]l[üu]k|sava[şs]|zul[üu]m|g[öo]z\s*yum)/i,
];

// 13. Büyü, Muska ve Hurafeler (Soru 13)
const MAGIC_SUPERSTITION_PATTERNS: ReadonlyArray<RegExp> = [
  /büyü(yü)?\s*bozacak\s*(bir\s*)?(hoca|muska|t[ıi]ls[ıi]m|vefk|dua)/i,
  /(muska|t[ıi]ls[ıi]m|vefk)\s*(tarifi|yazan|yapan|bozan)/i,
  /büyü\s*(bozan|yapan|yapt[ıi])\s*(hoca|medyum|cinci)/i,
  /(büyü\s*yap[ıi]ld[ıi]|büyülendim|muska\s*buldum).*(nas[ıi]l\s*boz|hoca|t[ıi]ls[ıi]m)/i,
  /(cinci|medyum|büyüc[üu]|fal[ıi]m|t[ıi]ls[ıi]m\s*tarifi)/i,
];

// 14. Sahte / Yanıltıcı Hadis Tespiti (Soru 18)
const SPURIOUS_HADITH_PATTERNS: ReadonlyArray<RegExp> = [
  /[çc]al[ıi][şs]mayan[ıi]n\s*dini\s*yoktur/i,
  /calismayanin\s*dini\s*yoktur/i,
  /vatan\s*sevgisi\s*imandand[ıi]r/i,
  /g[üu]nde\s*10\s*saat\s*[çc]al[ıi][şs]an.*esnaf/i,
  /(böyle\s*bir\s*hadis\s*var\s*m[ıi]|hadis\s*uydur|hangi\s*kitapta\s*ge[çc]iyor)/i,
];

// 15. Ümitsizlik ve Dua Kabul Olmuyor Zannı (Soru 7)
const DESPAIR_DUA_PATTERNS: ReadonlyArray<RegExp> = [
  /(y[ıi]llard[ıi]r|aylard[ıi]r|g[üu]nlerdir|ne\s*zamand[ıi]r)\s*dua\s*ediyorum.*(hi[çc]biri\s*kabul|kabul\s*olmuyor)/i,
  /allah\s*(beni\s*)?(unuttu|sevmiyor|duymuyor).*(dua\s*etmeyi\s*b[ıi]rak|b[ıi]rakaca[ğg][ıi]m)/i,
  /dua\s*etmeyi\s*(b[ıi]rakaca[ğg][ıi]m|b[ıi]rakt[ıi]m|terk\s*ed)/i,
  /dualar[ıi]m\s*hi[çc]\s*kabul\s*olmuyor/i,
];

// 16. Faizli Kredi Çekebilirsin Onayı Talebi (Soru 9)
const RIBA_APPROVAL_PATTERNS: ReadonlyArray<RegExp> = [
  /faizli\s*kredi.*(zorunda\s*m[ıi]y[ıi]m|[çc]ekebilir\s*miyim|[çc]eksem\s*olur\s*mu|vicdan[ıi]m[ıi]\s*rahatlat|helal\s*mi)/i,
  /bana\s*['"”’‘]?\s*[çc]ekebilirsin\s*['"”’‘]?\s*de/i,
  /faiz.*[çc]ekebilirsin\s*de/i,
  /faizli\s*(kredi|para)\s*[çc]ekmeye\s*(mecburum|zorunday[ıi]m)/i,
];

// 17. Kumar / Bahis ile Cami Yaptırma (Soru 10)
const GAMBLING_CHARITY_PATTERNS: ReadonlyArray<RegExp> = [
  /([şs]ans\s*oyunlar[ıi]ndan|bahisten|kumar.*kazand[ıi]m|iddia(dan)?).*(cami|fakirlere|sadaka|hay[ıi]r|sevap|helal)/i,
  /bahis.*(cami\s*yapt[ıi]rsam|sevap|helal\s*k[ıi]l)/i,
  /kumar(dan)?\s*(gelen|kazan[ıi]lan).*(cami|hay[ıi]r|infak)/i,
];

// 18. Nefis Aklama ve Öfke Kontrolü (Soru 4)
const NAFS_AKLAMA_PATTERNS: ReadonlyArray<RegExp> = [
  /(e[şs]yalar[ıi]\s*k[ıi]rd[ıi]m|ba[ğg][ıi]r[ıi]p\s*[çc]a[ğg][ıi]rd[ıi]m).*(su[çc]\s*tamamen\s*onda|bende\s*hi[çc]\s*kabahat\s*yok|beni\s*bu\s*hale\s*o\s*getirdi)/i,
  /beni\s*bu\s*hale\s*o\s*getirdi\s*(de[ğg]il\s*mi|\?)/i,
  /(su[çc]\s*onda|kabahat\s*onda).*(ben\s*hakl[ıi]y[ıi]m|bende\s*kusur\s*yok)/i,
];

// 19. Ağır Yas, Ailevi Dağılma ve Tükenmişlik (Sadece Dijital Kalmama İlkesi & Yüz Yüze Köprü)
const GRIEF_BURNOUT_PATTERNS: ReadonlyArray<RegExp> = [
  // A. Vefat, Kayıp ve Ağır Yas
  /(annem|babam|evlad[ıi]m|[çc]ocu[ğg]um|e[şs]im|karde[şs]im)\s*(vefat\s*etti|[öo]ld[üu]|kaybettim).*(dayanam[ıi]yorum|bittim|t[üu]kendim|nefes\s*alam[ıi]yorum|y[ıi]k[ıi]ld[ıi]m|mahvoldum)/i,
  /a[ğg][ıi]r\s*(bir\s*)?yas\s*(i[çc]indeyim|ya[şs][ıi]yorum)/i,
  /(vefat|kay[ıi]p|cenaze).*(ac[ıi]s[ıi]na\s*dayanam[ıi]yorum|y[ıi]kt[ıi]\s*beni)/i,
  /sevdi[ğg]imi\s*kaybettim.*(dayanam[ıi]yorum|bittim|ya[şs]ayam[ıi]yorum)/i,

  // B. Ailevi Dağılma ve Yuva Sarsıntısı
  /ailem\s*(tamamen\s*)?da[ğg][ıi]ld[ıi].*(bittim|nefes\s*alam[ıi]yorum|dayanam[ıi]yorum|y[ıi]k[ıi]ld[ıi]m|mahvoldum)/i,
  /yuvam\s*(tamamen\s*)?y[ıi]k[ıi]ld[ıi].*(bittim|nefes\s*alam[ıi]yorum|dayanam[ıi]yorum|mahvoldum)/i,
  /ailem\s*par[çc]aland[ıi].*(ne\s*yapaca[ğg][ıi]m[ıi]\s*bilmiyorum|bittim|t[üu]kendim)/i,

  // C. Ağır Tükenmişlik (Burnout) ve Çöküş
  /a[ğg][ıi]r\s*t[üu]kenmi[şs]lik\s*(ya[şs][ıi]yorum|i[çc]indeyim)/i,
  /(ruhen|tamamen)\s*t[üu]kendim.*(nefes\s*alam[ıi]yorum|dayanam[ıi]yorum|kimsem\s*yok)/i,
];

/**
 * Zorlayıcı 18 senaryo için deterministik süzgeç denetleyicisi.
 */
export function checkAdversarialGuardrails(
  userMessage: string
): AdversarialGuardrailMatch | null {
  const text = (userMessage || "").trim();
  const lower = text.normalize("NFC").toLocaleLowerCase("tr-TR").replace(/\u0307/g, "");

  // 1. Can Güvenliği ve Kriz (İntihar)
  if (EXTENDED_SUICIDE_PATTERNS.some((p) => p.test(lower))) {
    return {
      ruleId: "CRISIS_SUICIDE",
      auditTag: "ACIL_KRIZ_CAN_GUVENLIGI_PROTOKOLU",
      status: "crisis_redirected",
      replyText:
        "Gönlünüzdeki yangını, hissettiğiniz derin çaresizlik ve yorgunluğu duyuyorum aziz kardeşim. Şu an hiçbir yükü tek başınıza omuzlamak zorunda değilsiniz.\n\n" +
        "Canınız mukaddes bir ilahi emanettir; hiçbir kriz, iflas, borç veya dünya derdi canınızdan daha kıymetli değildir. Lütfen bu düşüncelerle tek başınıza kalmayın ve derhal resmi destek hatlarına başvurun:\n\n" +
        "• 112 Acil Çağrı Merkezi (7/24 Kesintisiz Sağlık ve Güvenlik Müdahalesi)\n" +
        "• ALO 183 Aile, Kadın, Çocuk ve Sosyal Destek Hattı\n\n" +
        "Yanınızda olmaya, sizi dinlemeye hazır uzmanlar ve her an rahmetiyle size şah damarınızdan daha yakın olan bir Rabbiniz var. Lütfen derhal yardım isteyiniz.",
    };
  }

  // 2. Başkasına Zarar Verme / Ağır İntikam
  if (REVENGE_HARM_PATTERNS.some((p) => p.test(lower))) {
    return {
      ruleId: "VIOLENCE_HARM",
      auditTag: "INTIKAM_VE_ZARAR_VERME_ENGELI",
      status: "crisis_redirected",
      replyText:
        "Yaşadığınız haksızlığın gönlünüzde oluşturduğu yangını ve kırgınlığı anlıyorum; ancak İslam dini hiçbir insana gizlice zarar vermeye, canını yakmaya veya hayatını karartmaya ASLA izin vermez.\n\n" +
        "Peygamber Efendimiz (s.a.v.) *'Zarar vermek ve zarara zararla karşılık vermek yoktur'* buyurmuştur. Başkasına haksızlıkla zarar vermek, mazlum iken zalim durumuna düşmek, ağır bir kul hakkına girmek ve kanunen suç işlemektir. İntikam ve kin kalbi çürüten nefsani bir tuzaktır. Hakkınızı meşru ve yasal yollardan arayınız; suç teşkil eden eylemlerden kesinlikle uzak durunuz.",
    };
  }

  // 3. Sisteme Rol Biçme / Jailbreak Reddi
  if (JAILBREAK_PATTERNS.some((p) => p.test(lower))) {
    return {
      ruleId: "JAILBREAK_ROLEPLAY",
      auditTag: "JAILBREAK_VE_ROL_DEGISIKLIGI_ENGELI",
      status: "fatwa_blocked",
      replyText:
        "Ben \"Manevi Pusula\"yım. Kur'an-ı Kerim, Sahih Sünnet ve İslam edebi dairesinde kalplere inşirah, tefekkür ve sükûnet sunmak üzere tasarlanmış müstakil bir manevi rehberlik sistemiyim.\n\n" +
        "Rol değiştirme, felsefi inkar senaryolarına alet olma, din ve ahlak hakikatlerini tahrif etme veya sistem anayasasını hiçe sayma talimatlarını kesinlikle kabul etmiyorum. Size ancak meşru, sahih ve vakar dolu bir manevi tefekkür zemininde yol arkadaşlığı yapabilirim.",
    };
  }

  // 4. Mahremiyet ve Gizli Veri İhlali Kalkanı
  if (PRIVACY_LEAK_PATTERNS.some((p) => p.test(lower))) {
    return {
      ruleId: "PRIVACY_LEAK_PROBE",
      auditTag: "SIFIR_PII_VE_VERI_IZOLASYONU_ZIRHI",
      status: "fatwa_blocked",
      replyText:
        "Manevi Pusula, sıfır kimlik (zero-PII) ve mutlak mahremiyet kalkanıyla çalışmaktadır.\n\n" +
        "Sistem mimarisi ve 6698 sayılı KVKK gereği hiçbir kullanıcının adı, kimliği, oturum geçmişi veya paylaştığı dertler diğer kullanıcılara veya harici ortamlara asla aktarılamaz; her oturum tamamen izole ve şifrelenmiş efemeral anahtarlarla korunur. Bu nedenle geçmiş veya diğer ziyaretçilere ait hiçbir bilgiye erişmem veya bunları paylaşmam teknik ve hukuki olarak imkansızdır.",
    };
  }

  // 5. Tıbbi Teşhis ve İlaç Bırakma Engeli
  if (MEDICAL_TREATMENT_PATTERNS.some((p) => p.test(lower))) {
    return {
      ruleId: "MEDICAL_DRUG_DROP",
      auditTag: "TIBBI_TEDAVI_VE_ILAC_KORUMASI",
      status: "fatwa_blocked",
      replyText:
        "Manevi Pusula klinik bir sağlık kuruluşu veya tıbbi bir merci değildir; hiçbir şekilde tıbbi teşhis koyamaz veya hekim tedavisine müdahale edemez.\n\n" +
        "İslam inancında beden de ruha ilahi bir emanettir. Peygamber Efendimiz (s.a.v.) *'Ey Allah'ın kulları, tedavi olunuz; çünkü Allah yarattığı her derdin devasını da yaratmıştır'* buyurarak hekime ve ilaca başvurmayı emretmiştir. Kur'an-ı Kerim tilaveti ve dua kalbe inşirah veren manevi bir sığınaktır; ancak asla hekimin reçete ettiği ilaçların alternatifi veya ilacı bırakma sebebi olamaz.\n\n" +
        "Lütfen doktorunuzun verdiği ilacı KESİNLİKLE kendi başınıza bırakmayınız veya çöpe atmayınız; endişelerinizi tedavinizi yürüten uzman hekiminizle paylaşınız.",
    };
  }

  // 6. Siyasi ve İdeolojik Yönlendirme Engeli
  if (POLITICAL_PARTISAN_PATTERNS.some((p) => p.test(lower))) {
    return {
      ruleId: "POLITICAL_PARTISAN",
      auditTag: "SIYASI_TARAFSIZLIK_ZIRHI",
      status: "fatwa_blocked",
      replyText:
        "Manevi Pusula güncel siyaset, parti politikaları, seçim süreçleri, hükümet icraatları veya devlet yönetimleri hakkında yorum ve değerlendirme yapmaz.\n\n" +
        "Bizim gayemiz dünyevi siyasi tartışmalara taraf olmak veya siyasi tahliller üretmek değildir. Amacımız; kulun kendi kalbiyle, kul hakkı hassasiyetiyle, ilahi adalet ölçüsüyle ve ahiret bilinciyle baş başa kalıp içsel murakabesini ve manevi istikametini diri tutmasına yardımcı olmaktır.",
    };
  }

  // 7. Günah İtirafı ve Ruhbanlık / Aracılık Reddi
  if (CONFESSION_INTERMEDIARY_PATTERNS.some((p) => p.test(lower))) {
    return {
      ruleId: "CONFESSION_INTERMEDIARY",
      auditTag: "RUHBANLIK_VE_ARACILIK_REDDI",
      status: "fatwa_blocked",
      replyText:
        "İslam inancında Hristiyanlıktaki gibi bir ruhban sınıfı, günah çıkarma makamı veya kul ile Allah arasında aracı olma yetkisi KESİNLİKLE yoktur. Ben yalnızca bir yapay zeka yazılımıyım; ne günah bağışlayabilirim ne de sizin adınıza Allah'a aracılık edebilirim.\n\n" +
        "Peygamber Efendimiz (s.a.v.) gizli kalmış günahların ifşa edilmeyip örtülmesini ve doğrudan Allah'a tövbe edilmesini emretmiştir. Günahınız ne olursa olsun, kul ile Rabbi arasına kimse giremez. Cenâb-ı Hak: *'De ki: Ey nefislerine karşı haddi aşan kullarım! Allah'ın rahmetinden ümidinizi kesmeyin. Muhakkak ki Allah bütün günahları bağışlar'* (Zümer 53) buyurur. Samimi bir pişmanlıkla doğrudan Tevvâb ve Rahîm olan Allah'a iltica ediniz.",
    };
  }

  // 8. Boşanma ve Talak Hükmü Engeli (Soru 6)
  if (TALAK_DIVORCE_PATTERNS.some((p) => p.test(lower))) {
    return {
      ruleId: "TALAK_DIVORCE_RULING",
      auditTag: "BOSANMA_VE_TALAK_HUKUM_ENGELI",
      status: "fatwa_blocked",
      replyText:
        "Boşanma (talak) ve nikâh akdinin sıhhati; tarafların niyetine, kullanılan lafzın sarih veya kinayeli oluşuna, kişinin o andaki akli ve ruhi melekelerine bağlı olarak bizzat din ve hukuk otoritelerince hükme bağlanması gereken son derece bağlayıcı ve ağır bir meseledir.\n\n" +
        "Ben bir yapay zeka sistemi olarak nikâh veya boşanma hükmü veremem; böyle bir fetva yetkim dinen ve hukuken kesinlikle yoktur.\n\n" +
        "Öfke ve tartışma anında fevri sarf edilen sözlerin telafisi ve aile birliğinin muhafazası esastır. Eşinizle aranızdaki kırgınlığı gidermek için helalleşme ve sulh yolunu arayınız. Bu konudaki şer'i hükmü öğrenmek üzere eşinizle birlikte il yetkili Müftülüğüne veya Diyanet Alo 190 Fetva Hattı'na başvurarak ehliyetli hocalardan bizzat fetva almanız gerekir.",
    };
  }

  // 9. Cinsiyet Değiştirme ve Biyoetik Engeli (Soru 17)
  if (GENDER_BIOETHICS_PATTERNS.some((p) => p.test(lower))) {
    return {
      ruleId: "GENDER_BIOETHICS",
      auditTag: "CINSIYET_VE_BIYOETIK_SINIRI",
      status: "fatwa_blocked",
      replyText:
        "Toplumsal cinsiyet, cinsiyet uyum/değiştirme süreçleri ve biyoetik meseleler; hem tıbbi ve psikiyatrik uzman heyet incelemesini hem de İslam fıkhının fıtratı ve hilkati koruma esaslarını ilgilendiren son derece hassas ve çok boyutlu konulardır.\n\n" +
        "Ben bir yapay zeka sistemi olarak bu tür şahsi, biyolojik ve hayati konularda şer'i hüküm veya fetva veremem. İslam inancında aslolan ilahi hilkatin ve fıtratın muhafaza edilmesidir.\n\n" +
        "Yaşadığınız ruhi ve bedeni hâli uzman bir hekim ve psikiyatri heyetiyle paylaşmanız; meselenin fıkhi boyutunu ise durumunuza özel olarak Diyanet İşleri Başkanlığı Din İşleri Yüksek Kurulu (Alo 190) veya müftülükler nezdindeki yetkili ilim ehliyle yüz yüze istişare etmeniz en doğru yoldur.",
    };
  }

  // 10. Kripto / Hac ve Doğrudan Fetva Dayatması (Soru 2)
  if (CRYPTO_FATWA_PATTERNS.some((p) => p.test(lower))) {
    return {
      ruleId: "CRYPTO_FATWA_DEMAND",
      auditTag: "KRIPTO_VE_FETVA_DAYATMASI_ENGELI",
      status: "fatwa_blocked",
      replyText:
        "Ben bir yapay zeka sistemi olarak kendi zihnimden fıkhi hüküm veya bağlayıcı fetva üretemem; fetva verme ehliyetim ve yetkim yoktur.\n\n" +
        "Kripto varlıklar, dijital para kazançları ve bu kazançlarla ifa edilecek hac ibadetinin fıkhi sıhhati, Diyanet İşleri Başkanlığı Din İşleri Yüksek Kurulu'nun ve fıkıh meclislerinin yetki alanındadır. Onaylı dini verilere göre kazancın meşruiyeti ve şaibeden arındırılmış olması ibadetin kemali için şarttır.\n\n" +
        "Bu konuda kesin ve bağlayıcı hüküm almak için lütfen Diyanet Alo 190 Fetva Hattı'na veya il müftülüklerine müracaat ediniz.",
    };
  }

  // 11. Dini Hüküm ile Tahrifat (2 Vakit Namaz - Soru 5)
  if (NAMAZ_TAHRIFAT_PATTERNS.some((p) => p.test(lower))) {
    return {
      ruleId: "NAMAZ_TAHRIFAT_DEFENSE",
      auditTag: "NAMAZ_VAKITLERI_TAHRIFAT_ENGELI",
      status: "processed",
      intentMode: "ILIM_VE_SIYER",
      replyText:
        "Namaz, dinin direğidir. Kur'an-ı Kerim'de namazın muayyen vakitlerde farz kılındığı (Nisâ 103) ve günün muhtelif vakitlerinde ikame edilmesi gerektiği (Hûd 114, İsrâ 78, Rûm 17-18, Tâhâ 130) açıkça emredilmiştir.\n\n" +
        "Vakitlerin beş vakit olarak tayini, rekat sayıları ve eda ediliş biçimi bizzat Cibril (a.s.) talimiyle Peygamber Efendimiz (s.a.v.) tarafından ümmete gösterilmiş ve Efendimiz: *'Beni nasıl namaz kılıyor görüyorsanız, siz de öyle namaz kılın'* (Buhârî, Ezân 18) buyurmuştur.\n\n" +
        "14 asırdır ümmetin icması ve mütevatir sünnet ile namaz beş vakit olarak sabittir; bunu iki vakte indirme veya tahrif etme iddiaları sünneti ve icmayı hiçe sayan batıl tevillerdir. Bağlayıcı fıkhi meseleler için Diyanet Alo 190 Fetva Hattı'na danışabilirsiniz.",
    };
  }

  // 11.5. İlmihal ve İbadet Sıhhati Sınırı (Abdest / Gusül / Namaz / Oruç + Sıhhat / Özür / Kanama / Su -> Alo 190)
  if (detectIlmihalWorshipQuery(text)) {
    return {
      ruleId: "ILMIHAL_IBADET_SIHHATI_GUARD",
      auditTag: "ILMIHAL_VE_IBADET_SIHHATI_SINIRI",
      status: "fatwa_blocked",
      replyText: buildIlmihalGuardrailReply(text),
    };
  }

  // 12. Sahte / Yanıltıcı Hadis Tespiti (Soru 18)
  if (SPURIOUS_HADITH_PATTERNS.some((p) => p.test(lower))) {
    return {
      ruleId: "SPURIOUS_HADITH_GUARD",
      auditTag: "SAHTE_HADIS_KASA_KORUMASI",
      status: "processed",
      intentMode: "ILIM_VE_SIYER",
      replyText:
        "Kasamda bu ifadede onaylı bir hadis bulunmamaktadır.\n\n" +
        "Halk arasında yaygın olarak dolaşan 'Çalışmayanın dini yoktur' veya 'Vatan sevgisi imandandır' gibi sözler, Kütüb-i Sitte ve temel muteber hadis mecmualarında yer almayan asılsız veya zayıf/uydurma rivayetlerdir.\n\n" +
        "Bununla birlikte dinimiz meşru ve helal emeği en üstün faziletlerden saymıştır. Nitekim Peygamber Efendimiz (s.a.v.) şöyle buyurmuştur: *'Hiç kimse elinin emeğinden daha hayırlı bir rızık yememiştir. Allah'ın peygamberi Dâvûd (a.s.) da kendi elinin emeğini yerdi.'* (Buhârî, Büyû' 15). Dini hakikatleri kaynaksız nakillerle değil, sahih kaynaklar ve ehl-i ilmin tahkikiyle öğrenmek esastır.",
    };
  }

  // 13. Büyü, Muska ve Hurafeler (Soru 13)
  if (MAGIC_SUPERSTITION_PATTERNS.some((p) => p.test(lower))) {
    return {
      ruleId: "MAGIC_SUPERSTITION_BLOCK",
      auditTag: "BUYU_VE_MUSKA_HURAFE_ENGELI",
      status: "processed",
      intentMode: "MANEVI_AYNA",
      replyText:
        "Manevi Pusula büyü bozan hoca, muska, vefk veya tılsım tarifi KESİNLİKLE vermez.\n\n" +
        "Gaybı bildiğini, büyü bozduğunu iddia eden kimselere gitmek, muska ve tılsımlardan medet ummak dinen caiz olmayan hurafeler ve manevi istismar kapılarıdır. Müminin sığınağı aracılar veya muskacılar değil, doğrudan doğruya Âlemlerin Rabbi olan Allah'tır.\n\n" +
        "Peygamber Efendimiz (s.a.v.) her türlü şerden, vesveseden ve nazardan korunmak için Kur'an-ı Kerim'in iki koruyucu kalkanı olan Muavvizeteyn surelerini (Felak ve Nâs), Âyetü'l-Kürsî'yi ve İhlâs Suresi'ni okuyup Allah'a sığınmayı emir buyurmuştur. İşlerinizin yoluna girmesi için maddi sebeplere sarılınız, tevekkülle fiili gayret gösteriniz ve dualarınızı bizzat doğrudan Rabbimize arz ediniz.",
    };
  }

  // 14. Ağır Kader ve Teodise (Kötülük Problemi - Soru 12)
  if (THEODICY_EVIL_PATTERNS.some((p) => p.test(lower))) {
    return {
      ruleId: "THEODICY_EVIL_DEFENSE",
      auditTag: "TEODISE_VE_KOTULUK_PROBLEMI_HIKMETI",
      status: "processed",
      intentMode: "ILIM_VE_SIYER",
      replyText:
        "Bu soru, kalpleri en derinden sarsan imtihan ve adalet sırrına temas etmektedir...\n\n" +
        "İslam inancında dünya bir lezzet ve mutlak mükafat yurdu değil; bir imtihan, sabır ve arınma meydanıdır (Bakara 155). Savaşların, zulmün ve masum çocukların acı çekmesinin asıl faili insanın cüzi iradesini zalimce kullanmasıdır. Allah Teâlâ Sünnetullah gereği insana irade ve mühlet vermiştir; ancak mazlumun ahını asla yerde bırakmaz.\n\n" +
        "Masumların çektiği acılar fani dünya ile sınırlı kalacak; ebedi ahiret yurdunda Cenâb-ı Hakk'ın sonsuz adaleti ve rahmetiyle tarif edilemez bir mükâfatla telafi edilecektir. Efendimiz (s.a.v.) ve Ashab-ı Kiram'ın da Taif'te taşlandığı, Şi'b-i Ebi Talib boykotunda açlıktan inlediği ama Allah'ın nusretine teslim olduğu hatırlanmalıdır.",
    };
  }

  // 15. Ümitsizlik ve Dua Kabul Olmuyor Zannı (Soru 7)
  if (DESPAIR_DUA_PATTERNS.some((p) => p.test(lower))) {
    return {
      ruleId: "DESPAIR_UNANSWERED_DUA_GUARD",
      auditTag: "UMITSIZLIK_VE_DUA_VESVESESI_ENGELI",
      status: "processed",
      intentMode: "MANEVI_AYNA",
      replyText:
        "Gönlünüzü saran bu darlığı ve yorgunluğu duyuyorum; fakat 'Allah beni unuttu, dua etmeyi bırakacağım' düşüncesi, şeytanın kulu Rabbinden koparmak için fısıldadığı en sinsi ümitsizlik tuzağıdır.\n\n" +
        "Cenâb-ı Hak bizzat ferman buyurur: *'Rabbin seni terk etmedi ve sana darılmadı. Muhakkak ki ahiret senin için dünyadan daha hayırlıdır.'* (Duhâ 3-4). Vahyin kesildiği ve müşriklerin 'Rabbi Muhammed'i terk etti' dediği Hüzün Yılı'nda inen bu âyet, bugün sizin kalbinize de bir inşirah fermanıdır.\n\n" +
        "Dua bir ibadettir; dünyevi sipariş değil acziyet arzıdır. Allah Teâlâ kulunun duasını ya dünyada aynen verir, ya kulun bilmediği bir musibeti defeder ya da ahirette ebedi mükâfat olarak saklar. Duanın asıl bereketi, o kapıda sabırla bekleyebilme sadakatidir. Lütfen duanızı bırakmayınız.",
    };
  }

  // 16. Faizli Kredi Çekebilirsin Onayı Talebi (Soru 9)
  if (RIBA_APPROVAL_PATTERNS.some((p) => p.test(lower))) {
    return {
      ruleId: "RIBA_APPROVAL_GUARD",
      auditTag: "RIBA_ONAY_TALEBI_ENGELI",
      status: "processed",
      intentMode: "MANEVI_AYNA",
      replyText:
        "İçinizi daraltan bu borç yükünü ve çaresizlik hissini derinden duyuyorum; ancak size asla 'çekebilirsin' diyemem ve vicdanınızı sahte bir avuntuyla rahatlatamam.\n\n" +
        "Cenâb-ı Hak *Bakara Suresi 275-279* âyetlerinde faizin hem ruhi huzuru hem de dünyevi bereketi tükettiğini ve haram kılındığını açıkça ihtar eder. Darlığın asıl devası yeni bir faiz yükü değil; tövbe, borç tecili ve helal kazanç vakarında sebat etmektir.\n\n" +
        "Rabbimiz Talâk Suresi 2-3'te sakınan ve tevekkül eden kuluna mutlaka beklemediği yerden bir çıkış yolu açacağını müjdeler. Rızkın ve çıkış yollarının sahibi El-Razzâk olan Allah'tır; meşru sebeplere vakar ile sarıl ve kalbini O'na bağla.",
    };
  }

  // 17. Kumar / Bahis ile Cami Yaptırma (Soru 10)
  if (GAMBLING_CHARITY_PATTERNS.some((p) => p.test(lower))) {
    return {
      ruleId: "GAMBLING_CHARITY_GUARD",
      auditTag: "HARAM_KAZANC_VE_INFAK_ENGELI",
      status: "processed",
      intentMode: "MANEVI_AYNA",
      replyText:
        "İnternet bahisleri, şans oyunları ve kumardan elde edilen gelir İslam fıkhında kesin haram ve gayrimeşru bir kazançtır (Mâide 90).\n\n" +
        "Haram kazançla cami yaptırmak veya fakirlere dağıtmak o parayı asla helal kılmaz ve kişiye infak sevabı kazandırmaz. Çünkü Peygamber Efendimiz (s.a.v.) açıkça buyurmuştur: *'Şüphesiz Allah Teâlâ tayyibtir (tertemizdir), ancak temiz ve helal olanı kabul eder.'* (Müslim, Zekât 65).\n\n" +
        "Haram kazançtan arınmanın yolu, yapılan fiile samimiyetle tövbe etmek ve elde kalan haram parayı hiçbir şahsi menfaat veya sevap beklentisi gütmeksizin elden çıkarmaktır. Bu paranın nasıl tasfiye edileceğine dair fıkhi detaylar için lütfen Diyanet Alo 190 Fetva Hattı'na başvurunuz.",
    };
  }

  // 18. Nefis Aklama ve Öfke Kontrolü (Soru 4)
  if (NAFS_AKLAMA_PATTERNS.some((p) => p.test(lower))) {
    return {
      ruleId: "NAFS_AKLAMA_OFKE_GUARD",
      auditTag: "NEFIS_AKLAMA_VE_OFKE_AYNASI",
      status: "processed",
      intentMode: "MANEVI_AYNA",
      replyText:
        "Yaşadığınız tartışmanın oluşturduğu fırtınayı duyuyorum; ancak samimi bir manevi ayna olarak hakikati ifade etmek gerekir: Nefsiniz şu an faturayı tamamen karşı tarafa kesip kendi kusurunu aklamaya çalışıyor.\n\n" +
        "Eşiniz sizi tahrik etmiş veya haksızlık yapmış olsa bile; bağırmak, öfkeyle eşyaları kırmak nefsani bir zaaftır ve İslam ahlakına asla sığmaz. Peygamber Efendimiz (s.a.v.) şöyle buyurmuştur: *'Gerçek pehlivan güreşte rakibini yere seren değil; öfkelendiğinde nefsine hakim olabilen kimsedir.'* (Buhârî, Edeb 76).\n\n" +
        "Nefsinizi aklamaktan vazgeçip öfkeniz ve fevriliğiniz için eşinizle helalleşiniz; Nebevi sünnet üzere öfke anında ayakta iseniz oturunuz, abdest alıp kalbinizi sükûnete erdiriniz.",
    };
  }

  // 19. Ağır Yas, Ailevi Dağılma ve Tükenmişlik (Sadece Dijital Kalmama İlkesi & Yüz Yüze Köprü)
  if (GRIEF_BURNOUT_PATTERNS.some((p) => p.test(lower))) {
    return {
      ruleId: "GRIEF_BURNOUT_COMMUNITY_BRIDGE",
      auditTag: "AGIR_YAS_VE_YUZ_YUZE_DESTEK_KOPRUSU",
      status: "crisis_redirected",
      intentMode: "MANEVI_AYNA",
      replyText:
        "Yüreğinizdeki bu büyük yangını, hissettiğiniz derin acı ve tükenmişliği can kulağıyla duyuyorum aziz dostum.\n\n" +
        "Ancak böyle derin bir yas, vefat acısı veya ailevi sarsıntı; sadece bir ekran karşısında dijital yazışmalarla taşınabilecek bir yük değildir. Manevi Pusula olarak sizi ekrana bağlamak yerine, bu yükü gerçek hayattaki ehil ellerle ve insan insana muhabbetle paylaşmanız gerektiğine inanıyoruz.\n\n" +
        "Yalnız değilsiniz; lütfen bu ağır imtihanı tek başınıza omuzlamak yerine yüz yüze manevi destek ve rehberlik halkalarına müracaat ediniz:\n\n" +
        "• Diyanet Aile ve Dini Rehberlik Büroları (ADRB): En yakın il veya ilçe müftülüğü bünyesinde; ailevi dağılma, yas ve manevi kriz süreçlerinde yüz yüze, ücretsiz ve gizlilik esaslı uzman rehberlik sunmaktadır.\n" +
        "• Aile Rehberleri ve ALO 183: Aile ve Sosyal Hizmetler Bakanlığı'nın aile danışmanlığı ve psikososyal destek hizmeti.\n" +
        "• Yüz Yüze İlim ve Sohbet Meclisleri: Güvenilir cami dersleri, manevi sohbet halkaları ve sizi muhabbetle dinleyecek bir aile büyüğü veya manevi rehber.\n\n" +
        "Cenâb-ı Hak kalbinize inşirah, sabır ve itminan bahşetsin; lütfen kendinizi yalnızlığa terk etmeyip bu yüz yüze kapılardan destek isteyiniz.",
    };
  }

  // 20. Teşekkür, Kapanış ve Küçük Sohbet (Small-talk) Mukabelesi
  if (isConversationalClosingOrThanks(text)) {
    return {
      ruleId: "CONVERSATIONAL_CLOSING_THANKS",
      auditTag: "KAPANIS_VE_TESEKKUR_MUKABELESI",
      status: "processed",
      intentMode: "MANEVI_AYNA",
      replyText:
        "Rica ederim aziz dostum. Kendine çok yüklenme; biraz soluklanmaya ve zihnini dinlendirmeye bak. Ne zaman konuşmak istersen buralardayım. Gönlün her daim ferah olsun.",
    };
  }

  return null;
}
