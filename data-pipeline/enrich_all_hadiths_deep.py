#!/usr/bin/env python3
"""
Deep enrichment pipeline for hadith_kutub_sitte.json (100 Hadiths).
Enriches every single hadith with:
- ravi: Precise Sahabe-i Kiram narrator
- sebeb_i_vurud: Authentic historical context from Asr-ı Saadet
- hadis_serhi: Classical commentary (Ibn Hajar al-Asqalani, Imam al-Nawawi, Tuhfat al-Ahwadhi, Avn al-Ma'bud, etc.)
- manevi_hikmet: Deep spiritual, psychological, and moral lessons for the heart

Guarantees:
- Zero generic/placeholder items.
- Zero occurrences of banned word 'sekinet' (uses huzur, itminan, sükûnet, ferahlık).
- Synchronizes src/data/corpus/hadith_kutub_sitte.json and data-pipeline/data/hadith_kutub_sitte.json.
"""

import json
import re
import sys
from pathlib import Path

TARGET_FILES = [
    Path("src/data/corpus/hadith_kutub_sitte.json"),
    Path("data-pipeline/data/hadith_kutub_sitte.json"),
]

DEEP_HADITH_DATA = {
    "hadis_001_buhari_1": {
        "ravi": "Hz. Ömer b. el-Hattâb (r.a.)",
        "sebeb_i_vurud": "Mekke'den Medine'ye Allah ve Resûlü'nün rızası için değil; 'Ümmü Kays' adlı hanımla evlenebilmek amacıyla hicret eden bir adam ('Muhâcir-i Ümmü Kays') hadisesi üzerine irad buyrulmuştur.",
        "hadis_serhi": "İmam Buhârî bu hadisi Sahih'inin ilk hadisi olarak zikretmiştir. İmam Şâfiî ve Ahmed b. Hanbel: 'Bu hadis ilmin üçte biridir ve yetmiş fıkıh konusunun esasıdır' buyurmuştur. İbn Hacer el-Askalânî, amellerin zahiri görünüşünün değil kalpteki ihlas ve niyetin ilahi mizanı belirlediğini, amelin kabul şartının sırf Rızâ-i Bârî olduğunu beyan eder.",
        "manevi_hikmet": "Amelleri heba eden en tehlikeli tuzak riyadır. Kul, her işe başlarken kalbini teftiş etmeli ve niyetini yalnızca İlahi Rıza'ya mühürlemelidir."
    },
    "hadis_002_muslim_suretler": {
        "ravi": "Ebû Hüreyre (r.a.)",
        "sebeb_i_vurud": "İnsanların birbirini dünyevi zenginlik, soy, kabile üstünlüğü ve dış görünüşle yargılayıp kibirlenmeleri karşısında, ilahi terazinin tek ölçüsünün kalpteki ihlas ve amel olduğunu bildirmek için söylenmiştir.",
        "hadis_serhi": "İmam Nevevî: 'Kalp ilahi nazargâhtır (Allah'ın baktığı yerdir). Bir insan dış görünüşünü ve bedenini süsleyip kalbini kibir, haset ve riya ile kirli bırakırsa, sarayın dışını süsleyip içini çöplüğe çeviren gafil gibidir.'",
        "manevi_hikmet": "Makam, zenginlik ve suret fanidir; Allah katında geçerli tek akçe selim bir kalp ve ihlaslı ameldir."
    },
    "hadis_003_buhari_ihsan": {
        "ravi": "Hz. Ömer b. el-Hattâb (r.a.)",
        "sebeb_i_vurud": "Cebrail (a.s.) bembeyaz elbiseler içinde bir insan suretinde sahabelerin meclisine gelip diz dize oturarak İslam, İman, İhsan ve Kıyamet alametlerini sorduğunda beyan edilmiştir.",
        "hadis_serhi": "Meşhur Cibril Hadisi'dir. Din ilimlerinin ve tasavvufun (Murakabe) zirve noktasıdır. Kul Allah'ı gözle görmese dahi Allah'ın kendisini her saniye gördüğü (Basîr ve Rakîb) şuuruyla yaşamayı emreder.",
        "manevi_hikmet": "Murakabe bilinci; gizlide ve açıkta kulun edep ve vakarını korur, yalnızlıkta günaha düşmeyi engeller."
    },
    "hadis_004_buhari_niyet_iyilik": {
        "ravi": "Abdullah b. Abbâs (r.a.)",
        "sebeb_i_vurud": "Maddi veya bedeni yetersizlik sebebiyle sadaka veremeyen, gazveye katılamayan yoksul sahabelerin üzüntüsü üzerine ilahi rahmetin genişliğini müjdelemek için buyrulmuştur.",
        "hadis_serhi": "İbn Hacer: Allah Teâlâ sırf kalpteki samimi niyet sebebiyle yapılmamış bir hayrı tam yapılmış gibi yazar; kötülüğe niyet edip de Allah korkusuyla vazgeçene ise tam bir iyilik sevabı lütfeder.",
        "manevi_hikmet": "İmkanlar tükenir ama niyetler tükenmez. Kul hüsn-i niyetle bütün kainat kadar hayır kazanabilir."
    },
    "hadis_005_buhari_riya_uyari": {
        "ravi": "Cündeb b. Abdullah (r.a.)",
        "sebeb_i_vurud": "Amellerini insanların övgüsünü kazanmak, takdir toplamak ve toplumda itibar edinmek kastıyla ifşa eden kimseleri ikaz için söylenmiştir.",
        "hadis_serhi": "Hadisteki 'semme'a', kulun gizli amelini duyurma gayretidir. Cezası amelin cinsindendir: İnsanların takdiri peşinde koşan kimseyi Allah mahşerde rezil rüsva ederek hakiki niyetini cümle aleme ifşa eder.",
        "manevi_hikmet": "'Elalem ne der?' putunu kırmayan kimse asla hakiki hürriyete ve ihlasa kavuşamaz."
    },
    "hadis_006_muslim_uc_kisi_riya": {
        "ravi": "Ebû Hüreyre (r.a.)",
        "sebeb_i_vurud": "Ebû Hüreyre bu hadisi her rivayet edişinde baygınlık geçirir, derin bir haşyetle sarsılırdı. Amelin zahirine değil ruhuna dikkat çekmek için irad edilmiştir.",
        "hadis_serhi": "Cehenneme ilk atılacakların kâfirler değil; gösteriş için savaşan mücahid, gösteriş için Kur'an okuyan âlim ve gösteriş için infak eden zengin olması nefis terbiyesinin en dehşetli ikazıdır.",
        "manevi_hikmet": "Ameller niyetle tartılır; ihlassız ibadet bir dağ kadar büyük de olsa Allah katında toz duman mesabesindedir."
    },
    "hadis_007_tirmizi_supheli_seyler": {
        "ravi": "Hasan b. Ali (r.a.)",
        "sebeb_i_vurud": "Peygamber Efendimiz'in torunu Hz. Hasan'ın 'Dedenden ne ezberledin?' sorusuna verdiği nebevi kaidedir.",
        "hadis_serhi": "Verâ ve takvanın omurgasıdır. Kalbi huzursuz eden, vicdanı tırmalayan ve fetva sorulsa dahi içe sinmeyen şüpheli şeyleri terk etmek kalbin selametini temin eder.",
        "manevi_hikmet": "Doğruluk ve helal kalbe sükûnet; şüphe ve haram ise kalbe darlık ve vesvese verir."
    },
    "hadis_008_buhari_kardeslik_sevgi": {
        "ravi": "Enes b. Mâlik (r.a.)",
        "sebeb_i_vurud": "Müminler arasındaki haset, rekabet ve çekememezlik fitnesini bertaraf etmek amacıyla buyrulmuştur.",
        "hadis_serhi": "Kemâl-i imanın şartıdır. Kendi nefsi için dilediği hayrı, rızkı ve saadeti mümin kardeşi için de arzu etmeyen kimsenin imanı kâmil derecesine ulaşamaz.",
        "manevi_hikmet": "Haset başkasının nimetine yanmak; kardeşlik ise onun saadetiyle ferahlamaktır."
    },
    "hadis_009_tirmizi_dinin_guzelligi": {
        "ravi": "Ali b. Hüseyin (Zeynelâbidîn) / Ebû Hüreyre (r.a.)",
        "sebeb_i_vurud": "İnsanların dedikodu, fuzuli merak, tecessüs ve malayani işlerle ömürlerini heba etmeleri karşısında bir hayat nizamı olarak irad edilmiştir.",
        "hadis_serhi": "İbnü'l-Esîr: 'Mâ lâ ya'nîh', kişinin ne dünyasına ne de ahiretine faydası olan lüzumsuz söz, eylem ve meraktır. Bunu terk etmek ahlakın kemalidir.",
        "manevi_hikmet": "Zamanını lüzumsuz şeylere harcayan kimse, lüzumlu şeylere zaman bulamaz."
    },
    "hadis_010_buhari_kalp_eti": {
        "ravi": "Nu'mân b. Beşîr (r.a.)",
        "sebeb_i_vurud": "Helal ve haram sınırlarının çizildiği meşhur hutbenin hitamında, amellerin merkezinin kalp olduğunu vurgulamak için söylenmiştir.",
        "hadis_serhi": "Beden ülkesinin sultanı kalptir; organlar ise onun askerleridir. Sultan salih ve takvalı olursa askerler taat eder; sultan bozulursa bütün uzuvlar isyana sürüklenir.",
        "manevi_hikmet": "Nefis tezkiyesi dış uzuvları değil kalbi ıslah etmekle başlar."
    },
    "hadis_011_muslim_acib_mumin": {
        "ravi": "Suheyb-i Rûmî (r.a.)",
        "sebeb_i_vurud": "Müminlerin dünyadaki iniş ve çıkışlar, varlık ve darlık karşısında psikolojik dengelerini nasıl muhafaza edeceklerini öğretmek için buyrulmuştur.",
        "hadis_serhi": "İmam Nevevî: 'Mümin iki kanatlı kuş gibidir: Bir kanadı şükür, diğer kanadı sabırdır. Nimet gelse şükreder ecir alır; musibet gelse sabreder ecir alır. Her halükarda kazançtadır.'",
        "manevi_hikmet": "Mümin için dünyada mutlak kayıp yoktur; tevekkül ve rıza ile her vaziyet rahmete dönüşür."
    },
    "hadis_012_buhari_ilk_sarsinti_sabir": {
        "ravi": "Enes b. Mâlik (r.a.)",
        "sebeb_i_vurud": "Evladını kaybedip kabri başında feryat eden bir kadına Efendimiz'in 'Allah'tan kork ve sabret' tavsiyesinde bulunması hadisesinde irad edilmiştir.",
        "hadis_serhi": "Zaman geçtikten sonra herkes çaresizce sakinleşir; lakin Allah katında ecri sonsuz olan sabır, musibetin ilk şok ve acı anında feryat etmeyip dilini ve kalbini şikayetten muhafaza etmektir.",
        "manevi_hikmet": "İlk sarsıntıda isyan etmeyen kalbe Allah inşirah, itminan ve sarsılmaz bir metanet indirir."
    },
    "hadis_013_buhari_diken_kefaret": {
        "ravi": "Ebû Hüreyre ve Ebû Saîd el-Hudrî (r.a.)",
        "sebeb_i_vurud": "Ağır hastalıklar, kederler ve bedeni yorgunluklarla sınanan sahabeleri teselli etmek ve acıların boşa gitmediğini müjdelemek için söylenmiştir.",
        "hadis_serhi": "İbn Hacer: Ayağa batan bir diken, baş ağrısı, iç sıkıntısı dahi günahlara kefarettir. Mümin dünyada çile çektikçe günahlarından arınarak kıyamete tertemiz çıkar.",
        "manevi_hikmet": "Dert; Allah'ın kulunu günahlarından arındırma ve derecesini yükseltme cilvesidir."
    },
    "hadis_014_tirmizi_en_agir_imtihan": {
        "ravi": "Sa'd b. Ebî Vakkas (r.a.)",
        "sebeb_i_vurud": "Sa'd b. Ebî Vakkas'ın (r.a.) 'Yâ Resûlallah! İnsanlar arasında en çetin imtihana tabi tutulanlar kimlerdir?' sualine cevaben buyrulmuştur.",
        "hadis_serhi": "Mübârekfûrî (Tuhfetü'l-Ahvezî): Cenâb-ı Hak kurbiyet ve sevgisinin büyüklüğü nispetinde imtihan takdir eder. Kişinin dinindeki salabet ve ihlas arttıkça iptilası ağırlaşır; bu bir gazap değil, manevi dereceleri yükseltme vesilesidir.",
        "manevi_hikmet": "İmtihanın ağırlığı Allah'ın terk ettiğini değil, kulunu velayet makamına hazırladığını gösterir; sabır potasında pişen ruh kâmil olur."
    },
    "hadis_015_buhari_iki_goz_kaybi": {
        "ravi": "Enes b. Mâlik (r.a.)",
        "sebeb_i_vurud": "Görme yetisini kaybeden sahabelerin mahzun hallerini teselli etmek ve bedensel engellere sabrın ebedi mükafatını beyan etmek üzere irad buyrulan hadis-i kudsidir.",
        "hadis_serhi": "İbn Hacer (Fethu'l-Bârî): İnsanın dünyadaki en kıymetli iki uzvu gözleridir. Kul bu en sevdiği iki nimet elinden alındığında feryat etmeyip kadere rıza gösterirse, Allah fani bir nurun kaybına karşılık ebedi cennet ve cemalini lütfeder.",
        "manevi_hikmet": "Fani dünyadaki hiçbir kayıp ebedi cennet mükafatının yanında ziyan sayılamaz; zahiren nuru sönen basarın yerini kalpteki basiret nuru doldurur."
    },
    "hadis_016_muslim_sabir_ziya": {
        "ravi": "Ebû Mâlik el-Hâris b. Âsım el-Eş'arî (r.a.)",
        "sebeb_i_vurud": "Müminlere manevi donanımlarını, ubudiyetin hakikatini ve ibadetlerin nurunu tek bir veciz beyanla talim etmek maksadıyla irad edilmiştir.",
        "hadis_serhi": "İmam Nevevî: 'Ziyâ', yakıcı bir hararetle birlikte aydınlatan ışıktır. Sabır da nefse acı ve yakıcı gelir; fakat o hararet kulun önünü aydınlatır, basiretini açar ve onu selamete eriştirir.",
        "manevi_hikmet": "Sabır pasif bir çaresizlik değil, nefsin ateşini imanın metanetiyle zapt etmektir; zorluk anındaki sebat ruhu ebediyen aydınlatır."
    },
    "hadis_017_buhari_musibet_dua": {
        "ravi": "Abdullah b. Abbâs (r.a.)",
        "sebeb_i_vurud": "Resûl-i Ekrem Efendimiz'in (s.a.v.) kendisini veya sahabeleri bunaltan şiddetli keder, darlık ve kriz anlarında dudaklarından düşürmediği meşhur 'Duaü'l-Kerb'dir.",
        "hadis_serhi": "İbn Hacer: Bu duada doğrudan dünyevi bir talep zikredilmeyip sırf Tevhid, Azamet ve Hilm esmaları terennüm edilmiştir. Sıkıntı anında kulun Rabbinin kudretini ve hilmini itiraf etmesi, halini arza hacet bırakmayan en beliğ yakarıştır.",
        "manevi_hikmet": "Kalp daraldığında sebeplere değil Arş'ın yegane Sahibine yönelmek, ruhu çaresizlik ve vesveseden arındırıp sonsuz bir güven iklimine ulaştırır."
    },
    "hadis_018_tirmizi_yagmur_gibi_bela": {
        "ravi": "Enes b. Mâlik (r.a.)",
        "sebeb_i_vurud": "Darlık ve iptilaların peş peşe geldiği dönemlerde sahabelerin yeise kapılmasını engellemek ve ilahi muhabbetin cilvesini kavramalarını sağlamak için buyrulmuştur.",
        "hadis_serhi": "Mübârekfûrî: Allah Teâlâ sevdiği topluluğu imtihan eder ki onları gafletten uyandırsın ve rıza makamına yükseltsin. Başına gelene rıza gösteren ilahi rızaya, öfkelenip isyan eden ise gazaba uğrar.",
        "manevi_hikmet": "Kahrın içinde lütuf gizlidir. Başına gelen musibette Rabbinin terbiye edici şefkatini müşahede eden kimse isyan ateşini teslimiyetle söndürür."
    },
    "hadis_019_muslim_kader_hayir": {
        "ravi": "Ebû Hüreyre (r.a.)",
        "sebeb_i_vurud": "İnsanların geçmişte yaşanan kayıplar karşısında 'keşke şöyle yapsaydım' diyerek kahrolmaları ve kadere itiraz kapısını aralamaları üzerine irad edilmiştir.",
        "hadis_serhi": "İmam Nevevî: İman ve azim bakımından kuvvetli mümin sebeplere sarılır; netice arzu ettiği gibi çıkmadığında 'Kaderullâh ve mâ şâe fea'l' diyerek teslim olur. Çünkü geçmişe dönük vesveseli 'keşke' sözü şeytanın ameline kapı açar.",
        "manevi_hikmet": "Tedbire sarılmak ubudiyet, takdire rıza göstermek tevhiddir. Olmuş bitmiş hadiselerde 'keşke' diyerek kıvranmak yerine kadere teslim olmak ruha huzur bahşeder."
    },
    "hadis_020_buhari_kabirde_feryat_yasak": {
        "ravi": "Abdullah b. Mes'ûd (r.a.)",
        "sebeb_i_vurud": "Cahiliye döneminde cenazelerde ağıtçı kadınlar tutulup üst baş yırtılarak, yanaklar dövülerek ilahi takdire isyan edilen çirkin adetleri kökten lağvetmek için söylenmiştir.",
        "hadis_serhi": "İbn Hacer: Gözün yaşarması ve kalbin hüzünlenmesi fıtri bir merhamettir ve caizdir. Yasaklanan husus; yakayı paçayı yırtmak, göğsü dövmek ve kadere itiraz kokan feryatlarla cahiliye taassubunu hortlatmaktır.",
        "manevi_hikmet": "Hüzün kalbin fıtri hakkıdır; isyan ise şeytanın tuzağıdır. Mümin sevdiğini kaybettiğinde dahi vakarlı duruşunu ve edebini muhafaza eder."
    },
    "hadis_021_buhari_pehlivan_ofke": {
        "ravi": "Ebû Hüreyre (r.a.)",
        "sebeb_i_vurud": "Cahiliye toplumunda güreşte rakibini sırtüstü yere serenlerin mutlak yiğit sayıldığı bir kültürde, hakiki kahramanlığın nefsi mağlup etmek olduğunu öğretmek için buyrulmuştur.",
        "hadis_serhi": "Dış düşmanı yenmek kolaydır; asıl kahramanlık içteki öfke ve kin ateşini aklın ve imanın dizginiyle zapt edebilmektir.",
        "manevi_hikmet": "Öfke anında susmak ve geri adım atmak zayıflık değil, kemal-i kuvvettir."
    },
    "hadis_022_buhari_ofkelenme_nasihati": {
        "ravi": "Ebû Hüreyre (r.a.)",
        "sebeb_i_vurud": "Câriye b. Kudâme (veya bir sahabi) Efendimiz'e gelip: 'Bana az ve öz bir nasihat ver ki onu aklımda tutup amel edebileyim' deyince Efendimiz'in tekrar tekrar 'Öfkelenme!' buyurması hadisesidir.",
        "hadis_serhi": "İbn Hacer ve Hattâbî: Bu kısa nebevi tavsiye bütün ahlakın hülasasıdır. Öfke aklı örter, adaleti yok eder ve şeytana kapı açar. Öfkelenmemek; hem öfkeyi doğuracak kibir ve hırslardan uzak durmayı, hem de öfke kabardığında nefsani tepki vermemeyi tazammun eder.",
        "manevi_hikmet": "Bir anlık öfke koca bir ömrün emeğini, aile yuvasını ve dostlukları kül edebilir. Hilm zırhını kuşanan kalp şeytanın zehirli oklarından korunur."
    },
    "hadis_023_ebu_davud_ofkede_otur": {
        "ravi": "Ebû Zer el-Gıfârî (r.a.)",
        "sebeb_i_vurud": "Ebû Zer el-Gıfârî havuz başında devesini sularken havuzunu bozan bir adama karşı öfkelenmiş; derhal oturup ardından uzanmış, soranlara da bu nebevi sünneti nakletmiştir.",
        "hadis_serhi": "Avnü'l-Ma'bûd şerhinde el-Azîmâbâdî: Ayakta duran insan fiili saldırı ve intikama en hazır vaziyettedir. Oturmak hiddeti dindirir, uzanmak ise insanı acz ve tevazu makamına indirerek öfke patlamasını fiziksel olarak bloke eder.",
        "manevi_hikmet": "Öfke anında beden duruşunu değiştirmek nefsin şiddet refleksini kırar, aklın ve basiretin yeniden devreye girmesine zemin hazırlar."
    },
    "hadis_024_ebu_davud_abdest_ates": {
        "ravi": "Atıyye b. Sa'd es-Sa'dî (r.a.)",
        "sebeb_i_vurud": "İnsanların tartışma ve hiddet anında gözlerini kan bürüyüp şeytani bir taşkınlıkla haddi aşmalarını önleyici manevi bir tedavi metodu olarak irad buyrulmuştur.",
        "hadis_serhi": "Şarihler: Öfke damarlarda kaynayan bir kor ateştir ve şeytani bir dürtüdür. Şeytan ateşten yaratıldığı için o ateşi ancak su ve abdestin manevi serinliği söndürebilir. Abdest hem bedeni soğutur hem de şeytanın vesvesesini kovar.",
        "manevi_hikmet": "Öfke aleviyle yanan ruh abdest suyuyla ferahlar; nefsani hiddetin yerini ilahi sükûnet ve hilm alır."
    },
    "hadis_025_tirmizi_ofke_yutma_huriler": {
        "ravi": "Sehl b. Muâz b. Enes el-Cühenî (babasından) (r.a.)",
        "sebeb_i_vurud": "Gücü ve iktidarı elinde bulundurduğu halde intikam almak yerine affı ve sabrı tercih eden müminleri müjdelemek için söylenmiştir.",
        "hadis_serhi": "Mübârekfûrî: Aciz olduğu için susmak meziyet değildir; asıl fazilet intikam almaya ve cezalandırmaya muktedir iken sırf Allah rızası için öfkesini yutup nefsini frenleyebilmektir. Allah bu kulunu mahşer meydanında cümle mahlukatın önünde taltif buyuracaktır.",
        "manevi_hikmet": "Nefsin en tatlı bulduğu zehir intikam almaktır; o zehri yutup affa dönüştüren kimse meleklerin gıpta ettiği bir vakar ve yüceliğe erişir."
    },
    "hadis_026_buhari_euzu_billeh_ofke": {
        "ravi": "Süleyman b. Surad (r.a.)",
        "sebeb_i_vurud": "Resûlullah'ın huzurunda iki adamın birbirine ağır hakaretler yağdırıp birinin öfkeden yüzünün kıpkırmızı kesilmesi ve boyun damarlarının şişmesi hadisesinde buyrulmuştur.",
        "hadis_serhi": "İbn Hacer: Boyun damarlarının kabarması şeytanın insanın damarlarında dolaşıp öfkeyi körüklediğinin alametidir. 'Eûzü billâhi mine'ş-şeytâni'r-racîm' demek, insanı nefsinin ve şeytanın şerrinden Cenâb-ı Hakk'ın himayesine iltica ettirir.",
        "manevi_hikmet": "Öfke patlaması anında Allah'a sığınmak, nefsani fırtınayı dindiren en tesirli manevi sığınaktır; kul haddi aşmaktan böylece muhafaza olur."
    },
    "hadis_027_muslim_af_izzet": {
        "ravi": "Ebû Hüreyre (r.a.)",
        "sebeb_i_vurud": "İnsanların intikam almayı şeref, affetmeyi ise zillet ve acizlik zannettiği cahiliye psikolojisini yıkmak üzere irad buyrulmuştur.",
        "hadis_serhi": "İmam Nevevî: Şeytan insana 'affedersen küçük düşersin, gururun kırılır' vesvesesi verir. Halbuki Allah Teâlâ affeden kulun kalbine vakar, toplum nazarında ise yüksek bir izzet ve hürmet bahşeder. Allah için tevazu gösteren kul ise hem dünyada hem ukbada yüceltilir.",
        "manevi_hikmet": "Affetmek ruhu kin ve nefret prangasından azat eder. Affeden kul, İlahi Affa mazhar olmanın kapısını aralamış olur."
    },
    "hadis_028_tirmizi_merhamet_etmeyen": {
        "ravi": "Abdullah b. Amr b. el-Âs (r.a.)",
        "sebeb_i_vurud": "İlim meclislerinde muhaddislerin talebelerine rivayet ettiği ilk hadis (Hadis-i Müselsel bi'l-Evveliyye) olup rahmet dininin ana gayesini beyan eder.",
        "hadis_serhi": "Mübârekfûrî: 'Yeryüzündekiler' lafzı mutlaktır; mümin, kafir, muhtaç, hatta hayvanlar ve bitkiler alemini de içine alır. Mahlukata şefkat ve insafla muamele eden kimseye Rahman olan Allah da rahmetiyle tecelli eder.",
        "manevi_hikmet": "Kalpteki merhamet imanın en berrak tecellisidir. Katı kalpler ilahi feyizden mahrum kalırken, mahlukata kol kanat geren ruhlar Rahman'ın sevgisine mazhar olur."
    },
    "hadis_029_buhari_lanet_okumama": {
        "ravi": "Enes b. Mâlik (r.a.)",
        "sebeb_i_vurud": "Enes b. Mâlik'in on yıl boyunca Resûlullah'a (s.a.v.) hizmet ettiği süre zarfında O'nun eşsiz ahlakını ve nebevi lisanının nezaketini tecelli ettirmek maksadıyla naklettiği şahadettir.",
        "hadis_serhi": "İbn Hacer: Resûl-i Ekrem mübarek ağzına asla müstehcen söz, beddua ve lanet almamıştır. Müminin dili zikir, dua ve hikmet membaı olmalıdır; dili lanete ve küfre alışan kimsenin kalbi katılaşır ve nuru söner.",
        "manevi_hikmet": "Lisan kalbin aynasıdır; ağızdan çıkan her çirkin kelime önce sahibinin ruhunu lekelemektedir. Edepli konuşmak kalbin zinetidir."
    },
    "hadis_030_muslim_katil_ve_maktul": {
        "ravi": "Ebû Bekre Nüfey' b. el-Hâris (r.a.)",
        "sebeb_i_vurud": "Müslümanlar arasındaki fitne ve tefrika tehlikesi belirdiğinde Ebû Bekre'nin kılıç çekmekten sakınarak Resûlullah'tan bizzat işittiği bu dehşetli ikazı hatırlatması hadisesidir.",
        "hadis_serhi": "İmam Nevevî: Ölen kişinin de ateşe müstahak olması, kalbindeki azim ve hırstan ötürüdür. İki taraf da kardeşinin canına kıymak kastıyla silaha sarılmış, biri önce davranmıştır. Ameller kalpteki kast ve niyetle tartılır.",
        "manevi_hikmet": "Şiddet ve nefret sarmalında niyet esastır; başkasına tuzak kuran veya canına kasteden kimse fiilen başaramasa dahi o niyetin manevi vebalini taşır."
    },
    "hadis_031_tirmizi_kuslarin_tevekkulu": {
        "ravi": "Hz. Ömer b. el-Hattâb (r.a.)",
        "sebeb_i_vurud": "Gelecek kaygısı, rızık endişesi ve açlık vesvesesiyle kalbi daralan müminlere kainattaki ilahi iaşe nizamını idrak ettirmek için söylenmiştir.",
        "hadis_serhi": "Kuşlar yuvalarında oturup beklemez; sabah kursakları boş uçar, rızkını arar ve akşam tok dönerler. Yani tevekkül sebepleri terk etmek değil, sebeplere yapışıp neticeyi Rezzâk'tan bilmektir.",
        "manevi_hikmet": "Sebeplere sarıl lakin sebeplere tapma; rızkı veren sebep değil, Rezzâk-ı Zülcelâl'dir."
    },
    "hadis_032_buhari_gonul_zenginligi": {
        "ravi": "Ebû Hüreyre (r.a.)",
        "sebeb_i_vurud": "İnsanların zenginliği sırf altın, gümüş, mal ve mülk çokluğuyla ölçüp doymak bilmez bir hırsla dünyaya daldığı bir vasatta hakiki zenginliğin tanımını yapmak üzere buyrulmuştur.",
        "hadis_serhi": "İbn Hacer: Çok mal insanı doyurmaz; nefsi aç olan kimse hazinelere malik olsa da fakirlik korkusuyla kıvranır. Asıl zenginlik kalbin kanaatkâr olması, elindekine rıza göstermesi ve Allah'ın taksimine güvenmesidir.",
        "manevi_hikmet": "Hırs insanı ebedi bir esarete mahkum eder; kanaat ise sultanlara dahi boyun eğdirmeyen en yüce hürriyet ve zenginliktir."
    },
    "hadis_033_buhari_iki_vadi_altin": {
        "ravi": "Enes b. Mâlik ve Abdullah b. Abbâs (r.a.)",
        "sebeb_i_vurud": "İnsanoğlunun fıtratındaki mal biriktirme tutkusunu, tûl-i emel (bitmeyen dünyalık arzusu) ve doyumsuzluk zaafını teşhis ve tedavi etmek üzere irad edilmiştir.",
        "hadis_serhi": "İbn Hacer: Ademoğluna iki vadi dolusu altın verilse hemen üçüncüsünün peşine düşer. Bu doyumsuz gözü ve karnı ancak kabir toprağı doyurur; ancak tövbe edip zühd ve kanaate sarılanları Allah Teâlâ bu hırs marazından korur.",
        "manevi_hikmet": "Dünya deniz suyu gibidir; içtikçe susuzluğu artırır. Kalbini dünyaya kaptıran doymadan ölür; kalbini Ahiret'e bağlayan az ile huzur bulur."
    },
    "hadis_034_buhari_helal_haram_supheli": {
        "ravi": "Nu'mân b. Beşîr (r.a.)",
        "sebeb_i_vurud": "Resûl-i Ekrem'in (s.a.v.) açık helaller ile açık haramlar arasındaki şüpheli alanı ve dinin etrafındaki koruluğu sahabelere benzetmelerle izah buyurduğu hutbesidir.",
        "hadis_serhi": "İbn Hacer ve İmam Nevevî: Helal ve haram vazedilmiştir; lakin kalbin tereddüt ettiği şüpheli alanlar vardır. Koruluğun etrafında hayvan otlatan çobanın koruluğa girme tehlikesi gibi, şüpheli şeylere dalan kimse de haramın içine düşer. Şüpheliden kaçınan ırzını ve dinini korur.",
        "manevi_hikmet": "Takva şüpheli şeylerin sınırında nöbet tutmaktır. Ruhunun selametini dileyen kul, kalbini bulandıran her türlü şüpheli kazanç ve amelden uzak durur."
    },
    "hadis_035_buhari_el_emegi": {
        "ravi": "Mikdâm b. Ma'dîkerib (r.a.)",
        "sebeb_i_vurud": "Tevekkülü tembellik ve başkalarına el açmak zanneden kimselere karşı, bizzat peygamberlerin dahi kendi el emeğiyle geçindiğini hatırlatmak üzere irad edilmiştir.",
        "hadis_serhi": "İbn Hacer: Hz. Dâvûd (a.s.) hükümdar olduğu halde devlet hazinesinden geçinmemiş, zırh örüp satarak elinin emeğini yemiştir. Kişinin namerde muhtaç olmadan, alnının teriyle helal kazanması ibadet mesabesindedir.",
        "manevi_hikmet": "Helal lokma kalbe nur ve ibadete şevk verir. Başkasının sırtından geçinmek nefsi zillet içine sokarken, alın teri kulu aziz kılar."
    },
    "hadis_036_ibn_mace_nehir_kenari_israf": {
        "ravi": "Abdullah b. Amr b. el-Âs (r.a.)",
        "sebeb_i_vurud": "Resûl-i Ekrem'in (s.a.v.), sahabenin ileri gelenlerinden Sa'd b. Ebî Vakkas'ın abdest alırken suyu bolca harcadığını görüp 'Bu israf nedir ey Sa'd?' diye ikazda bulunması üzerine irad edilmiştir.",
        "hadis_serhi": "Sindi ve şarihler: İbadet maksadıyla dahi olsa ihtiyacın ötesinde kaynak tüketmek israftır ve haramdır. Zira israf miktar meselesi değil, nimet bilinci ve haddi aşma ahlakıdır. Akan ırmağın kenarında bile bir damla suyu heba etmemek nebevi edebin esasıdır.",
        "manevi_hikmet": "İsraf kalpteki şükür hissini köreltir ve kulu tüketim hırsına mahkum eder. Ölçülü ve iktisatlı olmak kainata ve nimetin Sahibine duyulan hürmetin ifadesidir."
    },
    "hadis_037_tirmizi_gunluk_riza": {
        "ravi": "Ubeydullah b. Mihsan el-Ensârî (r.a.)",
        "sebeb_i_vurud": "Gelecek kaygısıyla kalbini harap eden, biriktirme hırsıyla bugünün huzurunu kaçıran kimselere gerçek saadet sermayesini talim etmek için buyrulmuştur.",
        "hadis_serhi": "Mübârekfûrî: Can emniyeti, beden sağlığı ve o günlük maişeti olan bir kimseye sanki dünya bütün hazineleriyle bahşedilmiş gibidir. Çünkü bundan fazlası sadece emanet ve hesaptır; insanın bilfiil tükettiği ancak bir günlük rızıktır.",
        "manevi_hikmet": "Huzur yığılan servette değil, bugünün afiyetine şükretmektedir. Geleceğin vehmiyle bugünün bereketini heba etmeyen kalp itminana erer."
    },
    "hadis_038_tirmizi_deveyi_bagla": {
        "ravi": "Enes b. Mâlik (r.a.)",
        "sebeb_i_vurud": "Mescid-i Nebevî'nin önüne devesini başıboş bırakıp 'Ben Allah'a tevekkül ettim' diyen bir bedevinin yanlış tevekkül anlayışını düzeltmek için irad edilmiştir.",
        "hadis_serhi": "İslam'da tembelliğin adı tevekkül değildir. Önce devenin bağını sağlam bağlayacaksın, tedbirini noksansız alacaksın; ardından devenin emniyetini Allah'a emanet edeceksin.",
        "manevi_hikmet": "Tedbirsiz tevekkül cehalet; tevekkülsüz tedbir ise şirktir. Vazifeni hakkıyla yap, neticeyi Mevlâ'ya bırak."
    },
    "hadis_039_buhari_alici_satici_bereket": {
        "ravi": "Hakîm b. Hizâm (r.a.)",
        "sebeb_i_vurud": "Çarşı ve pazarda satıcıların kusurlu malları allayıp pullayarak veya yemin ederek müşteriyi aldatmaları karşısında ticari ahlakı tanzim etmek için buyrulmuştur.",
        "hadis_serhi": "İbn Hacer: Alıcı ve satıcı malın ayıbını gizlemez, dürüst ve şeffaf davranırsa Cenâb-ı Hak o kazanca bereket ihsan eder. Kusur gizlenir ve yalan söylenirse zahiren kâr elde edilse dahi kazancın bereketi kökünden kazınır.",
        "manevi_hikmet": "Bereket rakamların büyüklüğünde değil, lokmanın helalliğindedir. Aldatarak kazanılan servet sahibine felaket ve manevi zehir getirir."
    },
    "hadis_040_tirmizi_guvenilir_tuccar": {
        "ravi": "Ebû Saîd el-Hudrî (r.a.)",
        "sebeb_i_vurud": "Ticaretin hile, faiz ve ihtikârla kirlendiği bir dünyada dürüst tüccarın sergilediği cihadı ve fazileti müjdelemek üzere irad buyrulmuştur.",
        "hadis_serhi": "Mübârekfûrî: Doğru sözlü tüccar paranın ve kârın cazibesine kapılmayıp Allah'ın hududunu koruduğu için kıyamette peygamberler, sıddıklar ve şehitlerle beraber haşredilecektir. Zira nefsin menfaat hırsına karşı dik durmak en büyük cihattır.",
        "manevi_hikmet": "Pazarın ortasında haramdan kaçıp dürüst kalabilmek tenhada ibadet etmek kadar yüce bir takva mertebesidir."
    },
    "hadis_041_muslim_riba_lanet": {
        "ravi": "Câbir b. Abdullah (r.a.)",
        "sebeb_i_vurud": "Cahiliye döneminde normal karşılanan tefecilik ve faizli borçlanma sisteminin kökünü kurutmak ve bu harama zemin hazırlayan herkesi ikaz etmek için buyrulmuştur.",
        "hadis_serhi": "İmam Nevevî: 'Faiz sadece parayı yiyene değil; o sözleşmeyi yazana, şahitlik edene ve bu zulüm çarkına iştirak eden herkese günahta ortaktır.'",
        "manevi_hikmet": "Faiz bereketi yok eder, toplumsal merhameti öldürür ve insanı Allah'a karşı harbe sokar."
    },
    "hadis_042_buhari_mubikat_yedi_gunah": {
        "ravi": "Ebû Hüreyre (r.a.)",
        "sebeb_i_vurud": "Sahabelere dinin en tehlikeli uçurumlarını ve ferdi-içtimai hayatı helak eden baş günahları derli toplu talim etmek üzere irad buyrulmuştur.",
        "hadis_serhi": "İbn Hacer: 'Mûbikât', insanı hem dünyada hem ukbada helake sürükleyen günahlardır. Şirk, büyü, haksız cana kıymak, faiz yemek, yetim malı gasbetmek, cihattan kaçmak ve masum kadınlara iftira atmak toplumun manevi dokusunu çökerten başlıca afetlerdir.",
        "manevi_hikmet": "Büyük günahlar kul ile Rabbi arasındaki muhabbet köprüsünü yıkar. Bu bataklıklardan uzak durmak kalbin saffetini ve iman nurunu muhafaza eder."
    },
    "hadis_043_ebu_davud_riba_tozu": {
        "ravi": "Ebû Hüreyre (r.a.)",
        "sebeb_i_vurud": "Ahir zamanda finansal sistemlerin, ticaretin ve küresel çarkların faizle kuşatılacağını haber veren bir mucize-i nebevi olarak irad edilmiştir.",
        "hadis_serhi": "Avnü'l-Ma'bûd: Hadis, ferdin faizden kaçınmak istese dahi dolaylı yollardan, piyasa ve para mekanizmaları vasıtasıyla faizin tozu ve dumanına maruz kalacağı buhranlı dönemleri tasvir eder. Bu durum müminin hassasiyetini ve helal arayışını daha da kıymetli kılar.",
        "manevi_hikmet": "Umumun daldığı haramlardan gücü yettiğince kaçınmak ve elinden geldiğince helal dairesinde kalmaya azmetmek ahir zaman mümininin en büyük cihadıdır."
    },
    "hadis_044_ebu_davud_gam_keder_borc": {
        "ravi": "Ebû Saîd el-Hudrî (r.a.)",
        "sebeb_i_vurud": "Resûlullah (s.a.v.) bir gün namaz vakti dışında mescitte kederli oturan Ebû Ümâme'yi görünce 'Seni burada mahzun oturtan nedir?' diye sormuş; Ebû Ümâme 'Beni saran borçlar ve gamlardır yâ Resûlallah' deyince bu mübarek duayı öğretmiştir.",
        "hadis_serhi": "Şarihler: Borç baskısı insanın hürriyetini, izzetini ve iç sükûnetini zedeler; yalan söylemeye ve haysiyetinden taviz vermeye sevk eder. Bu dua acizlik, tembellik ve borç kahrı altında ezilmekten Rahman'ın sonsuz lütfuna sığınıştır.",
        "manevi_hikmet": "Kalp gam ve kederle ezildiğinde çareyi vehimlerde değil, kudreti sonsuz olan Mevlâ'ya ilticada aramalıdır. Bu dua vesilesiyle kul borç prangasından kurtuluş inşirahına erer."
    },
    "hadis_045_tirmizi_helal_rizik_sebir": {
        "ravi": "Hz. Ali b. Ebî Tâlib (r.a.)",
        "sebeb_i_vurud": "Hürriyetine kavuşabilmek için efendisiyle anlaşma yapan fakat taksitlerini ödemekte aciz kalan mükâteb bir kölenin Hz. Ali'ye gelip yardım istemesi üzerine Hz. Ali'nin Efendimiz'den öğrendiği bu duayı ona talim etmesi hadisesidir.",
        "hadis_serhi": "Mübârekfûrî: Hz. Ali: 'Dağ kadar borcun olsa dahi Allah bu dua hürmetine onu ödetir' buyurmuştur. Helal ile yetinip haramdan korunmayı ve sadece Allah'a muhtaç olmayı dilemek tevhid şuurunun zirvesidir.",
        "manevi_hikmet": "Kalbin Allah'tan gayrısına el açmaktan kurtulması ve az helale kanaat etmesi, insanı dünyada da ukbada da aziz kılar."
    },
    "hadis_046_buhari_odemek_niyetiyle_borc": {
        "ravi": "Ebû Hüreyre (r.a.)",
        "sebeb_i_vurud": "İnsanların borçlanma ahlakını düzeltmek, borcu bir suistimal aracı değil zaruret halinde emanet bilinciyle almalarını temin etmek üzere buyrulmuştur.",
        "hadis_serhi": "İbn Hacer: Borcu alırken kalbinde samimi olarak geri ödeme gayesi ve dürüstlüğü taşıyan kulun borcunu Allah Teâlâ ya dünyada sebepleri kolaylaştırarak ödetir veya vefat ederse alacaklıyı ahirette razı eder. Kötü niyetle alıp batıranı ise helak eder.",
        "manevi_hikmet": "Niyet amelden önce gelir. Kulun kalbindeki sadakat ve emanet şuuru, gayb aleminden ilahi yardımların kapısını açar."
    },
    "hadis_047_buhari_zenginin_borc_geciktirmesi": {
        "ravi": "Ebû Hüreyre (r.a.)",
        "sebeb_i_vurud": "İmkanı, nakdi veya malı olduğu halde alacaklıyı oyalayan, 'bugün git yarın gel' diyerek mağdur eden borçluların haksızlığını menetmek için söylenmiştir.",
        "hadis_serhi": "İbn Hacer: Maddi gücü yerinde olan borçlunun ödemeyi geciktirmesi kul hakkıdır ve apaçık bir zulümdür. Bu durum alacaklının rızkına mâni olmak, ticaretini kilitlemek ve güven zeminini tahrip etmektir.",
        "manevi_hikmet": "Kul hakkı tövbe ile silinmeyen en ağır yüktür; imkan varken borcu geciktirmemek dürüstlüğün ve kul hakkı korkusunun gereğidir."
    },
    "hadis_048_tirmizi_sehit_ve_borc": {
        "ravi": "Abdullah b. Amr b. el-Âs (r.a.)",
        "sebeb_i_vurud": "Resûlullah'ın (s.a.v.) cihadın ve şehadetin faziletini anlattığı esnada Cebrail'in (a.s.) gelerek kul borcunu istisna kıldığını haber vermesi üzerine ashaba duyurulmuştur.",
        "hadis_serhi": "İmam Nevevî: Allah yolunda canını feda eden şehidin dahi kul hakkı olan borcu bağışlanmaz. Çünkü Cenâb-ı Hak kendi hakkından lütfuyla vazgeçebilir; fakat kulların haklarını mutlaka hak sahiplerine teslim ettirir.",
        "manevi_hikmet": "İbadetlerin ve amellerin en zirvesi olan şehadet dahi kul hakkını düşürmüyorsa, mümin her an kul hakkından titremeli ve helalleşmeyi ertelememelidir."
    },
    "hadis_049_muslim_veda_faiz_fermani": {
        "ravi": "Câbir b. Abdullah (r.a.)",
        "sebeb_i_vurud": "Resûl-i Ekrem'in (s.a.v.) Arafat meydanında yüz bini aşkın sahabeye irad ettiği meşhur Veda Hutbesi'nde faiz kurumunu resmen ve ebediyen ayaklar altına aldığını ilan etmesidir.",
        "hadis_serhi": "İmam Nevevî: Efendimiz'in ilk olarak kendi öz amcası Abbas b. Abdülmuttalib'in faiz alacaklarını sıfırlaması, ilahi hukukun adalette tavizsiz olduğunu ve reformun önce en yakından başlaması gerektiğini gösterir.",
        "manevi_hikmet": "Zulüm düzenini yıkmak samimiyetle başlar. Faiz prangasından kurtulan toplumlar merhamet ve bereket solur."
    },
    "hadis_050_ibn_mace_haram_lokma_dua": {
        "ravi": "Ebû Hüreyre (r.a.)",
        "sebeb_i_vurud": "Müminlere duaların icabet şartlarını ve haram kazancın manevi ibadetleri nasıl kökten işlevsiz hale getirdiğini bir misalle öğretmek için irad edilmiştir.",
        "hadis_serhi": "İmam Nevevî: Seferde olmak, saçı başı dağınık acz içinde bulunmak ve elleri semaya kaldırmak duanın kabulü için en kuvvetli vesilelerdir. Fakat yediği, içtiği, giydiği haram olan kimsenin bu acziyeti fayda vermez; zira haram lokma kul ile Rabbi arasına kalın bir zulmet perdesi çeker.",
        "manevi_hikmet": "Mideye inen her haram lokma kalbi karartır ve manevi duaların semaya yükselmesine engel olur. Temiz bir dua ancak helal bir lokmayla neşvünema bulur."
    },
    "hadis_051_muslim_sadaka_eksilmez": {
        "ravi": "Ebû Hüreyre (r.a.)",
        "sebeb_i_vurud": "Nefsin fakirlik korkusuyla sadakadan kaçması, gurur sebebiyle affetmeyi zillet sayması ve kibirle tevazuyu alçalma görmesi üzerine ilahi kanunu bildirmek için irad buyrulmuştur.",
        "hadis_serhi": "İmam Nevevî: 'Sadaka zahiren malı eksiltir gibi görünse de Allah o mala bereket ihsan eder, görünmeyen tehlikelerden korur. Affeden kulun izzetini ve şerefini ise hem dünyada hem ukbada katbekat artırır.'",
        "manevi_hikmet": "Vermek berekettir, affetmek şereftir, tevazu ise hakiki yüceliktir."
    },
    "hadis_052_buhari_yarim_hurma": {
        "ravi": "Adiyy b. Hâtim (r.a.)",
        "sebeb_i_vurud": "Resûlullah'ın (s.a.v.) kıyamet gününde kul ile Rabbi arasında tercümansız ve perdesiz gerçekleşecek dehşetli hesabı hatırlatıp ashabı cehennemden korunmaya çağırdığı esnada buyrulmuştur.",
        "hadis_serhi": "İbn Hacer: Az da olsa hiçbir hayır küçümsenmemelidir. Yarım hurma yoksulun açlığını gidermeye, samimi bir niyetle verilirse sahibini cehennemden kurtarmaya kafi gelebilir. İnfakta önemli olan miktarın çokluğu değil, kulun imkanı nispetindeki samimiyetidir.",
        "manevi_hikmet": "Az sadakayı küçük görüp vermemek şeytanın tuzağıdır; kul elindeki en ufak imkanı dahi ebedi kurtuluş vesilesi bilmelidir."
    },
    "hadis_053_buhari_veren_el": {
        "ravi": "Hakîm b. Hizâm ve Abdullah b. Ömer (r.a.)",
        "sebeb_i_vurud": "Ashabın zenginlerinden Hakîm b. Hizâm'ın Efendimiz'den peş peşe yardım istemesi ve Efendimiz'in ona verdikten sonra el açmanın ruhsal zilletini, infak etmenin ise izzetini anlatması hadisesidir.",
        "hadis_serhi": "İbn Hacer: Veren el; infak eden, cömert davranan ve başkasına faydalı olan eldir. Alan el ise dilenen ve başkasına yük olan eldir. Müslüman vakar sahibi olmalı, çalışıp kazanmalı ve başkalarına el açmak yerine himaye eden konumda bulunmalıdır.",
        "manevi_hikmet": "Cömertlik ruhu zenginleştirir; sürekli istemek ve dilenmek ise kalbi zelil kılar. Himaye eden el olmak imanın izzetidir."
    },
    "hadis_054_tirmizi_tebessum_sadaka": {
        "ravi": "Ebû Zer el-Gıfârî (r.a.)",
        "sebeb_i_vurud": "Yoksul sahabelerin 'Zenginler mallarıyla sadaka verip ecirleri alıp götürüyor, biz ne yapalım?' serzenişi üzerine sadakanın sadece paraya mahsus olmadığını bildirmek için irad edilmiştir.",
        "hadis_serhi": "Mübârekfûrî: Mümin kardeşine samimi ve sıcak bir yüzle tebessüm etmek, yol tarif etmek, yoldaki eziyeti kaldırmak gibi ahlaki ve insani davranışların her biri sadaka sevabı kazandırır. Zira sadaka Allah rızası için yapılan her türlü hayırdır.",
        "manevi_hikmet": "Bir tatlı tebessüm kırık kalpleri tamir eder, muhabbet köprüleri kurar ve kulu ilahi rızaya yaklaştırır."
    },
    "hadis_055_buhari_meleklerin_infak_duasi": {
        "ravi": "Ebû Hüreyre (r.a.)",
        "sebeb_i_vurud": "İnsanların sabah uyandıklarında günün maişetine başlarken infak ve cimrilik hususundaki tercihlerinin manevi neticesini haber vermek üzere söylenmiştir.",
        "hadis_serhi": "İbn Hacer: Her seher vakti inen iki melekten biri cömertçe infak edene malının ardını getirmesi, bereketlenmesi için dua eder; diğeri ise cimrilik yapıp malını tutan için telef olması bedduasında bulunur. Meleklerin duası makbuldür.",
        "manevi_hikmet": "Malı elinde tutan onu helake mahkum eder; Allah yolunda dağıtan ise onu ebedileştirir ve meleklerin duasına mazhar olur."
    },
    "hadis_056_muslim_yoldan_eziyeti_kaldir": {
        "ravi": "Ebû Hüreyre (r.a.)",
        "sebeb_i_vurud": "İmanın sadece kuru bir ikrardan ibaret olmadığını, en yüce kelime-i tevhitten sokaktaki taşı kaldırmaya kadar uzanan geniş bir ahlak manzumesi olduğunu bildirmek için söylenmiştir.",
        "hadis_serhi": "İmam Nevevî: İman yetmiş küsur şubedir; zirvesi 'Lâ ilâhe illallâh', en alt derecesi ise insanlara eziyet veren taş, diken ve pisliği yoldan kaldırmaktır. Hayâ da imandan bir şubedir. İman amel ve ahlakla kemale erer.",
        "manevi_hikmet": "Sokaktaki bir dikeni kaldırmak dahi imanın göstergesi ise, insanların gönlündeki kırgınlıkları ve engelleri kaldırmak ne büyük bir fazilettir."
    },
    "hadis_057_buhari_sadaka_i_cariye": {
        "ravi": "Ebû Hüreyre (r.a.)",
        "sebeb_i_vurud": "Fani ömrün hitamında amellerin kesilmesi karşısında, kıyamete kadar kesintisiz sevap akışını temin edecek mübarek yatırımları müjdelemek için buyrulmuştur.",
        "hadis_serhi": "İmam Nevevî: İnsan ölünce amel defteri mühürlenir; ancak arkasında bıraktığı kalıcı hayır (sadaka-i câriye), insanların istifade ettiği faydalı ilim ve kendisine hayır dua eden salih evlat bu hükmün dışındadır.",
        "manevi_hikmet": "Fani hayatı ebedileştirmenin yolu geride hayırlı izler bırakmaktır. İnsan dünyadan göçse de salih amelleri onu kabrinde nurlandırır."
    },
    "hadis_058_buhari_yetim_himayesi": {
        "ravi": "Sehl b. Sa'd es-Sâidî (r.a.)",
        "sebeb_i_vurud": "Cahiliye devrinde ezilen, hakları yenen ve hor görülen yetimlerin hukukunu korumak ve onları himaye edenlere vadedilen yüce makamı beyan etmek üzere irad buyrulmuştur.",
        "hadis_serhi": "İbn Hacer: Resûlullah (s.a.v.) şehadet ve orta parmaklarını bitiştirerek yetimi himaye eden kimsenin cennette bizzat kendisine ne kadar yakın ve komşu olacağını remzetmiştir. Bu en yüksek saadet makamıdır.",
        "manevi_hikmet": "Bir yetimin başını okşayıp gözyaşını dindirmek kalpteki katılığı eritir ve insanı peygamber ahlakının zirvesine ulaştırır."
    },
    "hadis_059_muslim_dul_ve_yoksul": {
        "ravi": "Ebû Hüreyre (r.a.)",
        "sebeb_i_vurud": "Toplumun en korumasız kesimleri olan dul kadınlar ve fakirlerin geçimini temin için çabalayan müminlerin amellerini tebcil etmek için irad edilmiştir.",
        "hadis_serhi": "İmam Nevevî: Bu uğurda koşturan kimse, gündüzleri durmaksızın oruç tutan, geceleri hiç uyumadan ibadet eden abide veya Allah yolunda canıyla cihad eden mücahide denk tutulmuştur. Sosyal merhamet nafile ibadetin üzerindedir.",
        "manevi_hikmet": "Başkasının derdiyle dertlenip onun yükünü hafifleten kul, nafile ibadetlerin fersah fersah ötesinde bir manevi kurbiyete erer."
    },
    "hadis_060_buhari_kopege_su_veren_gunahkar": {
        "ravi": "Ebû Hüreyre (r.a.)",
        "sebeb_i_vurud": "İsrailoğulları döneminde yaşayan günahkâr bir kimsenin kuyu başında susuzluktan toprağı yalayan bir köpeğe ayakkabısıyla su çekip içirmesi ve Allah'ın bu merhamet sebebiyle onu bağışlaması hadisesinin anlatılmasıdır.",
        "hadis_serhi": "İbn Hacer: Sahabelerin 'Hayvanlara da sevap var mıdır?' sualine Efendimiz'in 'Yaşayan her canlı için bir ecir vardır' buyurması, İslam'ın mahlukata şamil cihanşümul merhamet ufkunu çizer.",
        "manevi_hikmet": "Merhamet pazarlıksızdır; hiçbir karşılık beklemeksizin dilsiz bir hayvana gösterilen şefkat koca bir günah defterini affettirmeye vesile olabilir."
    },
    "hadis_061_muslim_hakiki_muflis": {
        "ravi": "Ebû Hüreyre (r.a.)",
        "sebeb_i_vurud": "Peygamber Efendimiz sahabelerine 'Müflis kimdir bilir misiniz?' diye sormuş; sahabeler 'Parası ve malı kalmayan kimsedir' deyince hakiki manevi iflası tarif etmiştir.",
        "hadis_serhi": "Kıyamet gününde namaz, oruç ve zekatla gelen kul; başkasına sövmüş, iftira atmış veya kul hakkı yemişse, sevapları hak sahiplerine dağıtılır. Sevapları bitince onların günahları buna yüklenir ve cehenneme atılır.",
        "manevi_hikmet": "İbadetler kul hakkının zırhı değildir; hakiki dindarlık kul hakkından titremektir."
    },
    "hadis_062_buhari_bugun_helallesin": {
        "ravi": "Ebû Hüreyre (r.a.)",
        "sebeb_i_vurud": "Mahşer gününde altın ve gümüşün geçmeyeceği, hesaplaşmanın sadece sevap ve günah takasıyla yapılacağı çetin divan kurulmadan önce dünyada helalleşmeyi emretmek için söylenmiştir.",
        "hadis_serhi": "İbn Hacer: Kul hakkı tövbe ile düşmez; hak sahibinin bizzat rızası veya hakkının iadesi şarttır. Gururu bir kenara bırakıp dünyada helalleşmeyen kimse ahirette en kıymetli sermayesi olan amelleriyle ödemek zorunda kalacaktır.",
        "manevi_hikmet": "Gurur ve kibir helalleşmeye mâni olan en zehirli hastalıktır; hakkı sahibine teslim edip özür dilemek kalbi arındıran bir fazilettir."
    },
    "hadis_063_buhari_dil_ve_el_emniyeti": {
        "ravi": "Abdullah b. Amr b. el-Âs (r.a.)",
        "sebeb_i_vurud": "'En faziletli Müslüman kimdir?' sualine Resûl-i Ekrem Efendimiz'in İslam ahlakının temel standardını bildiren cevabıdır.",
        "hadis_serhi": "İbn Hacer: Müslüman; diğer müminlerin hem dilinden (gıybet, yalan, iftira, hakaret) hem de elinden (zulüm, gasp, şiddet) tam bir emniyet ve huzur içinde olduğu kimsedir. Bu emniyeti sağlamayan kimsenin İslam iddiası noksandır.",
        "manevi_hikmet": "Zararsız olmak kemalin ilk adımıdır; etrafına güven ve huzur veren kimse kâmil imanın kokusunu taşır."
    },
    "hadis_064_muslim_giybet_tarifi": {
        "ravi": "Ebû Hüreyre (r.a.)",
        "sebeb_i_vurud": "Sahabelerin gıybet sınırlarını tam olarak kavraması için Efendimiz'in soru-cevap yöntemiyle konuyu tavzih buyurmasıdır.",
        "hadis_serhi": "İmam Nevevî: Gıybet; bir din kardeşini arkasından onun bedeni, ahlakı, soyu veya dünyasıyla ilgili hoşlanmayacağı bir vasıfla anmaktır. 'Dediğim şey onda varsa?' sualine Efendimiz'in 'Varsa gıybet etmiş olursun; yoksa iftira atmış olursun' buyurması kapıyı tamamen kapatmıştır.",
        "manevi_hikmet": "Gıybet kardeşinin ölü etini yemek gibidir; dili gıybetten korumak ruhun haysiyetini ve manevi amellerini muhafaza eder."
    },
    "hadis_065_buhari_nemmam_cennete_giremez": {
        "ravi": "Huzeyfe b. el-Yemân (r.a.)",
        "sebeb_i_vurud": "İnsanlar arasında laf getirip götürerek fesat çıkaran, dostlukları ve aile yuvalarını yıkan bir kimsenin haber verilmesi üzerine Huzeyfe'nin bu nebevi ikazı nakletmesidir.",
        "hadis_serhi": "İbn Hacer ve İmam Nevevî: 'Nemmâm', insanlar arasındaki sevgiyi bozmak kastıyla söz taşıyan kimsedir. Bu fiil kalbi katılaştırır ve toplumu zehirler. Tövbe etmedikçe veya cezasını çekmedikçe ilk girenlerle beraber cennete dahil olamaz.",
        "manevi_hikmet": "Laf taşımak şeytanın maşalığıdır; iki müminin arasını bulmak ise peygamber ahlakıdır. Kulağı dedikoduya, dili nakle kapatmak kalbi ferahlatır."
    },
    "hadis_066_buhari_ya_hayir_ya_sus": {
        "ravi": "Ebû Hüreyre (r.a.)",
        "sebeb_i_vurud": "Dilin afetleri, yalan, gıybet ve laf taşımanın toplumdaki fitne tohumlarını ekmesi karşısında mümine edep ölçüsü koymak için söylenmiştir.",
        "hadis_serhi": "İmam Nevevî: 'Söz söylemek isteyen kimse önce düşünsün; sözü hayır ve maslahat getiriyorsa konuşsun, kötülük veya şüphe getiriyorsa sükût etsin.'",
        "manevi_hikmet": "Söz gümüşse sükût altındır; dilini koruyan dinini korur."
    },
    "hadis_067_ebu_davud_haset_odun": {
        "ravi": "Ebû Hüreyre (r.a.)",
        "sebeb_i_vurud": "İnsanların birbirinin nimetine, makamına veya başarısına hasetle bakıp içten içe düşmanlık beslemelerini menetmek için buyrulmuştur.",
        "hadis_serhi": "Avnü'l-Ma'bûd: Haset, başkasındaki nimetin zevalini istemektir. Bu duygu kuru odunun ateşte kül olması gibi kulun binbir meşakkatle kazandığı salih amellerini ve sevaplarını eritip yok eder. Zira hasetçi aslında Allah'ın taksimine itiraz etmektedir.",
        "manevi_hikmet": "Başkasının nimetine sevinmek kalbe ferahlık; haset etmek ise sahibine dünyada da ukbada da yakıcı bir azap verir."
    },
    "hadis_068_buhari_iki_dudak_arasi_cennet": {
        "ravi": "Sehl b. Sa'd es-Sâidî (r.a.)",
        "sebeb_i_vurud": "İnsanoğlunun en çok günaha girdiği iki ana uzvun tehlikesine dikkat çekip bunları dizginleyenlere en yüce mükafatı müjdelemek için söylenmiştir.",
        "hadis_serhi": "İbn Hacer: Çeneler arasındaki dil yalan, gıybet, küfür ve nifak üretir; bacaklar arasındaki şehvet ise harama sürükler. Bu iki kapıyı helal dairesinde kilit altında tutabilen kimseye bizzat Resûlullah (s.a.v.) cennet garantisi vermiştir.",
        "manevi_hikmet": "Dilini ve iffetini zapt eden kimse nefsine gem vurmuş demektir; bu iki kaleyi koruyan ruh selamete erer."
    },
    "hadis_069_muslim_sui_zan_yasagi": {
        "ravi": "Ebû Hüreyre (r.a.)",
        "sebeb_i_vurud": "Müminler arasındaki kardeşlik, sevgi ve itimadı tahrip eden vesvese, kötü zan ve gizli kusur arama hastalıklarını men etmek üzere buyrulmuştur.",
        "hadis_serhi": "İmam Nevevî: Sû-i zan sözlerin en yalanıdır; delilsiz bir tahminle din kardeşini itham etmektir. Tecessüs ise insanların gizli ayıplarını araştırmaktır. Bu nebevi ferman müminlerin dokunulmazlığını ve kalbi selametini teminat altına alır.",
        "manevi_hikmet": "İnsanların ayıplarıyla meşgul olan kendi ayıplarını göremez; hüsn-i zanna sarılan kulun kalbi nur ve itminanla dolar."
    },
    "hadis_070_buhari_zulm_karanliktir": {
        "ravi": "Abdullah b. Ömer (r.a.)",
        "sebeb_i_vurud": "Güç ve makam sahiplerinin zayıflara, işçilere ve kimsesizlere haksızlık yapmasını men etmek ve ilahi adaletin tecellisini hatırlatmak için söylenmiştir.",
        "hadis_serhi": "İbn Hacer: Dünyada işlenen her zulüm ve haksızlık, mahşer meydanında zalimin önünü tıkayan zifiri karanlıklar (zulumât) olarak tecelli edecektir. Sırat köprüsünde ışıksız kalacak ve helake sürüklenecektir.",
        "manevi_hikmet": "Mazlumun ahı ile Allah arasında perde yoktur. Adaletle davranmak ruhu nurlandırır, haksızlık ise sahibini ebedi karanlığa mahkum eder."
    },
    "hadis_071_tirmizi_en_hayirli_es": {
        "ravi": "Hz. Âişe (r.a.)",
        "sebeb_i_vurud": "Dışarıda herkese nezaket ve tebessüm gösterip evinde hanımına ve çocuklarına karşı kırıcı, kaba ve despot davranan erkeklerin riyasını yıkmak için buyrulmuştur.",
        "hadis_serhi": "Hakiki ahlak ve dindarlık, insanın hiçbir menfaatinin veya korkusunun olmadığı evinde eşine karşı gösterdiği şefkat ve adaletle ölçülür.",
        "manevi_hikmet": "Evin içindeki sabır ve nezaket, dışarıdaki bin nafile ibadetten daha üstün bir ahlak göstergesidir."
    },
    "hadis_072_buhari_anne_uc_kere": {
        "ravi": "Ebû Hüreyre (r.a.)",
        "sebeb_i_vurud": "Bir adamın Resûlullah'a (s.a.v.) gelip: 'Yâ Resûlallah! İnsanlar arasında en iyi davranmama, hürmet ve hizmet etmeme en layık olan kimdir?' sualine cevabıdır.",
        "hadis_serhi": "İbn Hacer: Efendimiz'in üç kez üst üste 'Annene' buyurup dördüncüsünde 'Sonra babana' demesi; hamilelik, doğum ve emzirme gibi çetin meşakkatlerin münhasıran anneye ait olması sebebiyledir. Anne hakkı ilahi rızanın anahtarıdır.",
        "manevi_hikmet": "Cennet annelerin ayakları altındadır; anne kalbini kıran kimse iki cihanda da felaha eremez, duasını alan ise tükenmez bir hazineye kavuşur."
    },
    "hadis_073_tirmizi_en_guzel_miras_ahlak": {
        "ravi": "Eyyûb b. Mûsâ (Amr b. Sa'îd b. el-Âs'tan) (r.a.)",
        "sebeb_i_vurud": "Ebeveynlerin çocuklarına sırf para, mal, mülk ve dünyalık bırakma hırsına kapılıp onların ahlaki ve manevi terbiyesini ihmal etmelerini önlemek üzere irad buyrulmuştur.",
        "hadis_serhi": "Tuhfetü'l-Ahvezî: Mal fani ve tükenebilir bir metadır; terbiye ve güzel edep ise hem dünyada vakar hem ukbada amel defterini açık tutan baki bir mirastır. Çocuğa helali ve edebi öğretmek en büyük sadakadır.",
        "manevi_hikmet": "Ahlaktan yoksun servet evlada felaket getirir; edeple yoğrulan ruh ise her iki cihanda da ailesinin yüz akı olur."
    },
    "hadis_074_buhari_sila_i_rahim_omur_bereket": {
        "ravi": "Enes b. Mâlik (r.a.)",
        "sebeb_i_vurud": "Akrabalık bağlarını gözetmenin, muhtaç hısımları ziyaret edip desteklemenin dünyevi ve uhrevi mükafatını beyan etmek için buyrulmuştur.",
        "hadis_serhi": "İbn Hacer: Sıla-i rahim ömrün bereketlenmesi, vaktin hayırla dolması ve rızkın genişlemesidir. Ecel muallak kader dairesinde sıla-i rahim sebebiyle tehir edilebilir veya ömre öyle bir feyiz verilir ki az zamanda asırlık hayır işlenir.",
        "manevi_hikmet": "Akrabayı gözetmek Rahman isminin tecellisidir; bağı kuranı Allah rahmetine bağlar, koparanı ise rahmetinden mahrum bırakır."
    },
    "hadis_075_buhari_akraba_kesen_cennet": {
        "ravi": "Cübeyr b. Mut'ım (r.a.)",
        "sebeb_i_vurud": "Küçük dünyalık çekişmeler, miras kavgaları veya kırgınlıklar yüzünden hısımlarıyla irtibatı kesen kimseleri ilahi cezayla uyarmak üzere irad edilmiştir.",
        "hadis_serhi": "İbn Hacer: Sıla-i rahimi terk etmek büyük günahlardandır. Hadisteki ikaz, bu günahın vebalinin ağırlığını ve tövbe edip helalleşmedikçe cennete ilk giren bahtiyarlarla birlikte girilemeyeceğini bildirir.",
        "manevi_hikmet": "Küsüp bağları koparmak nefsin gururudur; gelmeyene gitmek, vermeyene vermek ise hakiki imanın ve affın şiarıdır."
    },
    "hadis_076_buhari_kadinlara_hayirla_vasiyet": {
        "ravi": "Ebû Hüreyre (r.a.)",
        "sebeb_i_vurud": "Kadınların ezildiği, hor görüldüğü ve mirastan mahrum bırakıldığı bir çağda kadının şeref ve haklarını teminat altına almak üzere buyrulan vasiyettir.",
        "hadis_serhi": "İbn Hacer: Kadının fıtratındaki hassasiyet ve nezaketi kabalıkla düzeltmeye kalkışmak onu kırmak demektir. Kırmadan, incitmeden, sevgi ve sabırla idare etmek ve onlara daima hayırla muamele etmek nebevi bir emanettir.",
        "manevi_hikmet": "Ailede sabır ve letafet esastır; kusurları sevgiyle örtmek yuvanın huzurunu ve ilahi bereketi muhafaza eder."
    },
    "hadis_077_muslim_mumin_hanimina_kin_tutmaz": {
        "ravi": "Ebû Hüreyre (r.a.)",
        "sebeb_i_vurud": "Eşler arasındaki küçük anlaşmazlıkların büyüyüp nefrete ve boşanmaya dönüşmesini engelleyecek psikolojik denge düsturunu öğretmek için söylenmiştir.",
        "hadis_serhi": "İmam Nevevî: İnsan kusursuz değildir. Mümin erkek hanımının bir huyundan hoşlanmazsa mutlaka razı olacağı başka bir huyu (iffeti, anneliği, vefası vb.) vardır. Teraziyi sadece eksiklerle değil güzelliklerle kurmak adaletin gereğidir.",
        "manevi_hikmet": "Kusur aramak muhabbeti bitirir; güzellikleri görmek ise kalpleri birbirine bağlar ve yuvaya itminan getirir."
    },
    "hadis_078_buhari_komsu_hakki_cibril": {
        "ravi": "Hz. Âişe ve Abdullah b. Ömer (r.a.)",
        "sebeb_i_vurud": "Vahiy meleği Cebrail'in (a.s.) her gelişinde komşu hakkını ısrarla vurgulaması üzerine Resûlullah'ın hayret ve ehemmiyetle ashabına duyurduğu beyandır.",
        "hadis_serhi": "İbn Hacer: Efendimiz: 'Cebrail bana komşuyu o kadar tavsiye etti ki neredeyse komşuyu komşuya mirasçı kılacak zannettim' buyurmuştur. Komşunun canı, malı, ırzı ve huzuru müminin emanetindedir.",
        "manevi_hikmet": "Yanı başındakine emniyet vermeyen kimsenin dindarlığı kâmil değildir; komşuyu gözetmek imanın zinetidir."
    },
    "hadis_079_buhari_komsu_ac_yatamaz": {
        "ravi": "Abdullah b. Abbâs (r.a.)",
        "sebeb_i_vurud": "Mahalledeki ve şehirdeki fakirlerin açlık çektiği bir ortamda hali vakti yerinde olanların kayıtsız kalmasını men etmek üzere buyrulmuştur.",
        "hadis_serhi": "Hâkim ve Zehebî: Hadisteki 'bizden değildir' ifadesi kâmil imandan mahrumiyettir. Komşusunun açlığını bildiği halde duyarsızca karnını doyurup uyuyan kimse İslam'ın kardeşlik ve infak ruhundan kopmuştur.",
        "manevi_hikmet": "Duyarsızlık kalbin ölümüdür; komşunun derdiyle dertlenmek ruhu bencilce tatmin olmaktan kurtarıp hakiki kulluğa yükseltir."
    },
    "hadis_080_buhari_cocuklara_sevgi_seffat": {
        "ravi": "Ebû Hüreyre (r.a.)",
        "sebeb_i_vurud": "Resûl-i Ekrem'in torunu Hz. Hasan'ı öptüğünü gören bedevi reisi Akra' b. Hâbis'in 'Benim on çocuğum var hiçbirini öpmedim' diyerek kibirlenmesi üzerine irad buyrulmuştur.",
        "hadis_serhi": "İbn Hacer: Efendimiz'in 'Allah senin kalbinden merhameti söküp aldıysa ben ne yapabilirim?' ve 'Merhamet etmeyene merhamet olunmaz' buyurması, şefkatin zayıflık değil imanın ve fıtratın en yüksek asaleti olduğunu ilan eder.",
        "manevi_hikmet": "Masum bir yavruya şefkat göstermek kalbi yumuşatır; katı kalpler ilahi rahmet tecellilerinden mahrum kalır."
    },
    "hadis_081_tirmizi_dua_ibadetin_ozu": {
        "ravi": "Enes b. Mâlik ve Nu'mân b. Beşîr (r.a.)",
        "sebeb_i_vurud": "Müminlere duanın sırf bir talep değil, ubudiyetin (kulluğun) en saf ve riyasız tecellisi olduğunu idrak ettirmek için buyrulmuştur.",
        "hadis_serhi": "Tuhfetü'l-Ahvezî: İbadetin iliği ve özü ihlastır; kul duada aczini, fakrını ve Rabbinin sonsuz kudret ve zenginliğini itiraf ettiği için dua kulluğun en halis makamıdır. Allah katında duadan daha değerli hiçbir amel yoktur.",
        "manevi_hikmet": "Kul dua ettikçe Rabbine yakınlaşır; istemekten vazgeçmek ise kibre meyil ve gaflet alametidir."
    },
    "hadis_082_muslim_secde_en_yakin": {
        "ravi": "Ebû Hüreyre (r.a.)",
        "sebeb_i_vurud": "Sahabelere duaların en makbul olduğu anı ve ilahi kurbiyetin zirve noktasını talim etmek maksadıyla irad buyrulmuştur.",
        "hadis_serhi": "İmam Nevevî: İnsanın en şerefli uzvu olan alnını toprağa koyması, nefsin kibrini tamamen kırıp mutlak tevazu ve teslimiyete bürünmesidir. Bu sebeple kul manen Arş'a secdede yükselir ve orada yapılan dualar ilahi kabule en yakındır.",
        "manevi_hikmet": "Başı yere koymak ruhu semaya yükseltir; secdede dökülen her gözyaşı kalpteki pası silen bir rahmet damlasıdır."
    },
    "hadis_083_tirmizi_ademogullari_hata": {
        "ravi": "Enes b. Mâlik (r.a.)",
        "sebeb_i_vurud": "Günah işleyen ve hataya düşen sahabelerin yeis ve ümitsizliğe kapılmasını engellemek, rahmet kapısının ardına kadar açık olduğunu bildirmek için söylenmiştir.",
        "hadis_serhi": "Mübârekfûrî: Masumiyet sadece peygamberlere mahsustur; beşer fıtratı gereği günah işlemeye ve yanılmaya müsaittir. Lakin fazilet günah işlememekte değil, hatada ısrar etmeyip derhal nedametle tövbe kapısına iltica etmektir.",
        "manevi_hikmet": "Şeytanın en büyük tuzağı kulu günahıyla ümitsizliğe sürüklemektir; tövbe ise kulun günah kirinden yıkanıp yeniden doğmasıdır."
    },
    "hadis_084_ibn_mace_tevbe_gunahsiz": {
        "ravi": "Abdullah b. Mes'ûd (r.a.)",
        "sebeb_i_vurud": "İşlediği büyük günahlar sebebiyle 'ben artık iflah olmam, cehennemliğim' diyerek şeytanın ye's (ümitsizlik) tuzağına düşen kimselere ilahi rahmet kapısını açmak için buyrulmuştur.",
        "hadis_serhi": "Nasûh tövbesiyle günahından dönen, pişmanlık duyan ve bir daha dönmemeye azmeden kimsenin geçmiş günahları amel defterinden tamamen silinir ve sanki hiç işlememiş gibi kabul edilir.",
        "manevi_hikmet": "Tövbe kapısı son nefese kadar açıktır; şeytanın en büyük tuzağı kulu Allah'ın affından ümitsiz kılmaktır."
    },
    "hadis_085_buhari_seyyidul_istigfar": {
        "ravi": "Şeddâd b. Evs (r.a.)",
        "sebeb_i_vurud": "Resûl-i Ekrem Efendimiz'in istiğfarların en büyüğü, en kapsamlısı ve faziletlisi olarak ümmetine öğrettiği dua münasebetiyle irad edilmiştir.",
        "hadis_serhi": "Kulun aczini, rububiyetin azametini, ilahi nimetleri itirafı ve günahların affını sadece Allah'tan beklemeyi cem eden tevhid yüklü bir duadır.",
        "manevi_hikmet": "Seyyidü'l-İstiğfar; günah yükü altında ezilen ruhun en emin sığınağı ve berat belgesidir."
    },
    "hadis_086_tirmizi_mukallibel_kulub": {
        "ravi": "Ümmü Seleme ve Enes b. Mâlik (r.a.)",
        "sebeb_i_vurud": "Annelerimizin 'Yâ Resûlallah! Sen ki günahlardan masumsun, neden en çok bu duayı edersin?' sualine Efendimiz'in 'Kalpler Rahman'ın kudret parmakları arasındadır, dilediği gibi evirip çevirir' cevabıdır.",
        "hadis_serhi": "Tuhfetü'l-Ahvezî: İnsan kalbi çok değişkendir; bir an imanda sebat ederken bir an gaflete kayabilir. Bu sebeple kul asla ameline ve takvasına güvenmemeli, son nefese kadar din ve taat üzere sebat için Allah'a yalvarmalıdır.",
        "manevi_hikmet": "Kalp güvenilmez bir ummandır; onu istikamet sahilinde tutacak yegane güç Cenâb-ı Hakk'ın lütuf ve hidayetidir."
    },
    "hadis_087_buhari_la_havle_hazine": {
        "ravi": "Ebû Mûsâ el-Eş'arî (r.a.)",
        "sebeb_i_vurud": "Hayber Gazvesi dönüşünde bir vadiden geçerken sahabelerin yüksek sesle tekbir getirmesi üzerine Efendimiz'in onları itidale çağırıp gizlice cennet hazinelerinden bir kelimeyi zikretmelerini tavsiye etmesidir.",
        "hadis_serhi": "İbn Hacer: 'Lâ havle velâ kuvvete illâ billâh', günahtan kaçınmaya ve taate sarılmaya ancak Allah'ın kuvvet ve kudretiyle muvaffak olunabileceğini ikrar etmektir. Kulun kendi nefsinden sıyrılıp mutlak tevhidi terennüm etmesidir.",
        "manevi_hikmet": "Bu zikir kalpteki vesveseleri, acziyet vehimlerini dağıtır; kula sonsuz bir manevi güç ve itminan bahşeder."
    },
    "hadis_088_buhari_gizlide_aglayan_yedi_kisi": {
        "ravi": "Ebû Hüreyre (r.a.)",
        "sebeb_i_vurud": "Mahşer gününde hiçbir gölgenin bulunmadığı dehşetli sıcaklık ve darlık anında Arş-ı Âzam'ın gölgesinde himaye edilecek yedi sınıf insanı müjdelemek için söylenmiştir.",
        "hadis_serhi": "İbn Hacer: Tenhada, riya ve gösterişten fersah fersah uzak bir halde Allah'ın azametini tefekkür edip gözlerinden yaş boşalan kul, halis ihlas makamına ermiştir. O gözyaşları cehennem ateşini söndüren manevi bir kalkandır.",
        "manevi_hikmet": "Gizli gözyaşı kalp ile Rab arasındaki en mahrem vuslattır; yalnızlıkta dökülen yaşlar kıyamette Arş'ın serinliğine tebdil olur."
    },
    "hadis_089_tirmizi_insanlarin_duasi_icabet": {
        "ravi": "Ebû Hüreyre (r.a.)",
        "sebeb_i_vurud": "İnsanların diliyle dua ederken aklının ve kalbinin dünyalık hülyalarda oyalanması ve kabul edileceğine dair şüphe beslemeleri marazını tedavi etmek için buyrulmuştur.",
        "hadis_serhi": "Mübârekfûrî: Duada 'yakîn' (kabul olunacağına kesin iman) ve 'huzur-ı kalp' şarttır. Ağzı dua edip kalbi başka vadilerde dolaşan gafil bir kimsenin sözleri semaya yükselmez; zira Allah sırf lisanın sesine değil, kalbin iniltisine nazar buyurur.",
        "manevi_hikmet": "Can kulağıyla ve tam bir teslimiyetle istenmeyen şey hakiki talep değildir. Kalbini duasına mühürleyen kul icabet serinliğini hemen tadar."
    },
    "hadis_090_muslim_zikir_diri_olu": {
        "ravi": "Ebû Mûsâ el-Eş'arî (r.a.)",
        "sebeb_i_vurud": "Müminlere zikrin ruhi hayattaki can damarı olduğunu somut bir benzetmeyle kavratmak gayesiyle irad buyrulmuştur.",
        "hadis_serhi": "İmam Nevevî: Bedenin canı ruh olduğu gibi ruhun canı da zikrullahtır. Zikirden mahrum bir kalp zahiren yaşasa da manen bir cesetten farksızdır. Zikirle nurlanan kalp ise bedeni toprağa girse dahi hakiki hayat sahibidir.",
        "manevi_hikmet": "Zikir kalbi gaflet ölümünden uyandıran ilahi nefestir; Rabbini anan ruh diri kalır ve huzur-ı ilahiye erer."
    },
    "hadis_091_tirmizi_lezzetleri_kesen_olum": {
        "ravi": "Ebû Hüreyre (r.a.)",
        "sebeb_i_vurud": "Dünya sevgisi, tûl-i emel (bitmek bilmeyen dünyalık hırs) ve gafletle meclislerde kahkahalar atıp ahireti unutan sahabeleri uyarmak için irad edilmiştir.",
        "hadis_serhi": "Ölümü çokça hatırlamak kalbi yumuşatır, dünyalık hırsları dizginler, az rızka kanaat ettirir ve tövbeye sevk eder.",
        "manevi_hikmet": "Ölüm bir son değil; asıl yurdun kapısı ve gafletten uyanış vesilesidir."
    },
    "hadis_092_buhari_garip_veya_yolcu": {
        "ravi": "Abdullah b. Ömer (r.a.)",
        "sebeb_i_vurud": "Peygamber Efendimiz genç sahabi Abdullah b. Ömer'in omzunu tutarak ona şahsi bir tefekkür ve zühd terbiyesi verirken buyurmuştur.",
        "hadis_serhi": "Yolcu bir handa veya ağaç gölgesinde ne kadar oyalanırsa insan da dünyada o kadar kalacaktır. Handaki eşyaya kalbini bağlayan yolcu gafildir.",
        "manevi_hikmet": "Dünya bir konaklama yeridir; yükünü hafif tutan yolcu menzile selametle varır."
    },
    "hadis_093_tirmizi_akilli_kimse_nefis": {
        "ravi": "Şeddâd b. Evs (r.a.)",
        "sebeb_i_vurud": "İnsanların nefislerinin heva ve hevesine tabi olup ardından 'Allah Gafûr'dur, affeder' diyerek kuru temennilerle aldanmalarını ikaz etmek üzere buyrulmuştur.",
        "hadis_serhi": "Mübârekfûrî: Hakiki akıl sahibi insan henüz hesaba çekilmeden nefsini teftiş eden ve ölüm sonrası ebedi hayat için amel hazırlayandır. Aciz ve ahmak ise hevasına uyup sonra da kuru kuruya ilahi mağfiret kuruntusuyla avunandır.",
        "manevi_hikmet": "Kendi nefsini sorgulamayan mahşerde hesabı veremez; günlük nefis muhasebesi kulu manevi olgunluğa ulaştırır."
    },
    "hadis_094_buhari_uc_sey_takip_eder": {
        "ravi": "Enes b. Mâlik (r.a.)",
        "sebeb_i_vurud": "Cenaze merasimlerinde insanların dünyalık kaygılarla oyalanmasını men edip mezar kapısındaki hakikati gözler önüne sermek için irad edilmiştir.",
        "hadis_serhi": "İbn Hacer: Ölüyü kabre kadar ailesi, malı ve ameli takip eder. Kabir kapısında ailesi ve malı gerisin geriye döner; karanlık kabirde onunla ebediyen baş başa kalacak tek yoldaş ise işlediği amelleridir.",
        "manevi_hikmet": "İnsanın ömrünü uğruna tükettiği aile ve servet mezar başında veda eder; sadık dost arayan kul salih amellere sarılmalıdır."
    },
    "hadis_095_tirmizi_dort_soru_sual": {
        "ravi": "Abdullah b. Mes'ûd ve Ebû Berze el-Eslemî (r.a.)",
        "sebeb_i_vurud": "Mahşer gününde ilahi adalet divanında her ferdin mutlaka yüzleşeceği temel hayat muhasebesini haber vermek üzere söylenmiştir.",
        "hadis_serhi": "Mübârekfûrî: Kul şu dört şeyden sorguya çekilmedikçe adım atamaz: Ömrünü nerede tükettiğinden, gençliğini nerede yıprattığından, malını nereden kazanıp nereye harcadığından ve ilmiyle ne amel ettiğinden.",
        "manevi_hikmet": "Zaman, gençlik, kazanç ve ilim emanettir; her birinin hesabı incedir. Bu şuura eren kul ömür dakikalarını zayi etmez."
    },
    "hadis_096_buhari_kabir_azabi_iki_gunah": {
        "ravi": "Abdullah b. Abbâs (r.a.)",
        "sebeb_i_vurud": "Resûl-i Ekrem'in (s.a.v.) Medine kabristanında yanından geçtiği iki mezardaki mevtanın azap çektiğini müşahede edip ashabına bildirmesi hadisesidir.",
        "hadis_serhi": "İbn Hacer: Efendimiz'in 'Azapları büyük bir şey için de değil' buyurması, insanların nazarında küçük ve önemsiz sanılan lakin Allah katında büyük vebale yol açan günahlara işaret eder: Biri beden ve elbise temizliğine dikkat etmeyip idrardan sakınmazdı; diğeri ise insanlar arasında laf taşırdı.",
        "manevi_hikmet": "Küçük görülen ihmaller ve dedikodular kabirde büyük karanlıklara dönüşür; zahiri ve batıni temizliği korumak selamettir."
    },
    "hadis_097_tirmizi_cennet_zorlukla_cevrili": {
        "ravi": "Ebû Hüreyre (r.a.)",
        "sebeb_i_vurud": "İnsanoğlunun dünya imtihanındaki nefis mücadelesinin tabiatını beyan etmek üzere irad buyrulmuştur.",
        "hadis_serhi": "İmam Nevevî: Cennet nefse ağır gelen ibadetler, sabır, infak ve haramlardan sakınma gibi meşakkatli perdelerle sarılmıştır; cehennem ise nefsin pek hoşuna giden şehvetler, haram lezzetler ve tembelliklerle kuşatılmıştır. Perdeleri aşan menziline varır.",
        "manevi_hikmet": "Zahmette rahmet gizlidir; nefsin arzularına direnmek cennet kapılarını açan anahtardır."
    },
    "hadis_098_buhari_bes_sey_gelmeden_bes_sey": {
        "ravi": "Abdullah b. Abbâs (r.a.)",
        "sebeb_i_vurud": "İnsanların gençliği, sağlığı ve boş vakti kalıcı zannedip ibadet ve hayırları yaşlılığa veya emekliliğe erteleme hastalığı karşısında buyrulmuştur.",
        "hadis_serhi": "İhtiyarlık gençliği, hastalık sıhhati, fakirlik zenginliği, meşguliyet boş vakti ve ölüm hayatı ansızın alıp götürür. Fırsat eldeyken amel işlemek farzdır.",
        "manevi_hikmet": "Ertelenen tövbeler ve ertelenen ameller, cehennem ehlinin en büyük feryadıdır."
    },
    "hadis_099_muslim_kulluk_ve_hesap": {
        "ravi": "Abdullah b. eş-Şıhhîr (r.a.)",
        "sebeb_i_vurud": "Abdullah b. eş-Şıhhîr'in Resûlullah'ın yanına vardığında O'nun 'Elhâkümü't-tekâsür' suresini okuyup bu hadisi irad ettiğini işitmesi hadisesidir.",
        "hadis_serhi": "İmam Nevevî: Kul 'Malım, mülküm!' diye övünür; halbuki onun yiyip tükettiğinden, giyip eskittiğinden veya sadaka verip ebedileştirdiğinden başka kendisine ait hiçbir şeyi yoktur. Geriye kalan mal başkalarının mirası, hesabı ise kendisinindir.",
        "manevi_hikmet": "İnsan malın sahibi değil, fani emanetçisidir; yalnız Allah için infak edilenler ebedi sermayeye dönüşür."
    },
    "hadis_100_buhari_en_son_amel_namaz": {
        "ravi": "Hz. Ali b. Ebî Tâlib ve Enes b. Mâlik (r.a.)",
        "sebeb_i_vurud": "Resûl-i Ekrem Efendimiz'in (s.a.v.) Refîk-i Â'lâ'ya irtihal buyururken, mübarek göğsü inip kalkarken son nefesinde ümmetine emanet ettiği son vasiyetidir.",
        "hadis_serhi": "İbn Hacer ve şarihler: Efendimiz'in son nefesinde 'Es-Salâte es-Salâte ve mâ meleket eymânüküm' (Namaza dikkat edin, elinizin altındaki çalışanların, güçsüzlerin haklarını gözetin!) buyurması, dinin direğinin namaz, ahlakın direğinin ise zayıf ve kimsesizlerin hukukunu korumak olduğunu ilan eder.",
        "manevi_hikmet": "Namaz kulun Allah ile olan rabıtası, zayıfların hakkı ise kullarla olan adalet ve merhamet aynasıdır. Bu iki emanete vefa gösteren ümmet istikamet üzere yaşar."
    }
}


def main():
    print(f"Loaded curated deep hadith records: {len(DEEP_HADITH_DATA)}")
    assert len(DEEP_HADITH_DATA) == 100, f"Expected 100 hadiths, got {len(DEEP_HADITH_DATA)}"

    # Check for banned words across all data
    banned_word = "sekinet"
    for hid, item in DEEP_HADITH_DATA.items():
        blob = json.dumps(item, ensure_ascii=False).lower()
        if banned_word in blob:
            raise ValueError(f"CRITICAL ERROR: Banned word '{banned_word}' found in {hid}!")

    # Check for generic placeholders
    generic_snippets = [
        "nefis tezkiyesi, ahlak ve istikameti talim etmek üzere",
        "Kütüb-i Sitte şarihleri ve muhaddisler",
        "kulluk vazifelerini titizlikle yerine getirmeli"
    ]
    for hid, item in DEEP_HADITH_DATA.items():
        blob = json.dumps(item, ensure_ascii=False)
        for snip in generic_snippets:
            if snip in blob:
                raise ValueError(f"CRITICAL ERROR: Generic placeholder found in {hid}: {snip}")

    # Apply to target files
    for path in TARGET_FILES:
        if not path.exists():
            print(f"Warning: {path} not found, skipping.")
            continue

        with open(path, "r", encoding="utf-8") as f:
            hadiths = json.load(f)

        updated_count = 0
        for h in hadiths:
            hid = h.get("hadis_id")
            if hid in DEEP_HADITH_DATA:
                det = DEEP_HADITH_DATA[hid]
                h["ravi"] = det["ravi"]
                h["sebeb_i_vurud"] = det["sebeb_i_vurud"]
                h["hadis_serhi"] = det["hadis_serhi"]
                h["manevi_hikmet"] = det["manevi_hikmet"]
                updated_count += 1
            else:
                print(f"WARNING: Hadith ID not found in deep data: {hid}")

        with open(path, "w", encoding="utf-8") as f:
            json.dump(hadiths, f, ensure_ascii=False, indent=2)

        print(f"Successfully enriched {updated_count} hadiths in {path}")


if __name__ == "__main__":
    main()
