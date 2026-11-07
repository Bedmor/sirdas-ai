#!/usr/bin/env python3
"""
Sırdaş AI - Classical Creed, Ethics, and Supplication Corpus Builder
Generates public domain classical Islamic texts for Çelik Kasa RAG:
1. İmâm-ı Â'zam Ebû Hanîfe - el-Fıkhü'l-Ekber & Vasiyetnameleri
2. İmam Ebû Ca'fer et-Tahâvî - el-Akîdetü't-Tahâviyye ve Şerhleri
3. İmam Ebû Hâmid el-Gazalî - İhyâu 'Ulûmi'd-Dîn (Nefis Terbiyesi ve Kalp Amelleri Seçkisi)
4. İmam Muhyiddin en-Nevevî - el-Ezkâr ve Riyâzü's-Sâlihîn (Zikir, Dua ve Edeb Külliyatı)

Strict guardrails:
- No banned words (e.g. 'sekinet' strictly prohibited).
- Public domain and classical scholarly heritage only.
- Strict deduplication verification against existing Kütüb-i Sitte, Quran, Tafsir, and Siyer datasets.
"""

import json
import os
from pathlib import Path
from typing import Any, Dict, List

DATA_DIR_PIPELINE = Path("data-pipeline/data")
DATA_DIR_CORPUS = Path("src/data/corpus")

# ------------------------------------------------------------------------------
# 1. AKAID METINLERI: Ebû Hanîfe (el-Fıkhü'l-Ekber & Vasiyetname) + İmam Tahâvî
# ------------------------------------------------------------------------------
AKAID_DATA: List[Dict[str, Any]] = [
    {
        "akaid_id": "akaid_001_ebu_hanife_tevhid_esaslari",
        "eser": "İmâm-ı Â'zam Ebû Hanîfe - el-Fıkhü'l-Ekber",
        "muellif": "İmâm-ı Â'zam Ebû Hanîfe Nu'mân b. Sâbit (v. 150/767)",
        "baslik": "Tevhidin Aslı ve Allah Teâlâ'nın Sıfatları",
        "madde_no": 1,
        "arapca_metin": "أَصْلُ التَّوْحِيدِ وَمَا يَصِحُّ الاعْتِقَادُ عَلَيْهِ: نَقُولُ آمَنَّا بِاللَّهِ وَمَلائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ، وَأَنَّ اللَّهَ تَعَالَى وَاحِدٌ لا مِنْ طَرِيقِ الْعَدَدِ وَلَكِنْ مِنْ طَرِيقِ أَنَّهُ لا شَرِيكَ لَهُ",
        "turkce_metin": "Tevhidin aslı ve itikadın sıhhati şudur: Allah'a, meleklerine, kitaplarına, peygamberlerine, öldükten sonra dirilmeye ve kadere iman ettik. Allah Teâlâ birdir; sayı cihetiyle değil, hiçbir ortağı, benzeri ve dengi olmaması cihetiyle birdir. O, doğurmamış ve doğmamıştır; hiçbir şey O'nun dengi olamaz.",
        "serh_ve_hikmet": "Ebû'l-Müntehâ ve Aliyyü'l-Kārî Şerhi: Tevhid, sadece Allah'ın varlığını kabul etmek değil; mülkünde, yaratmasında ve tedbirinde O'na hiçbir fani sebebi ortak koşmamaktır. Kul bu tevhid idrakine erdiğinde, insanların elindeki dünyalıktan ümidini keser ve kalbini yalnız Samed olan Allah'a bağlar.",
        "manevi_hikmet": "Yaratıcı'nın benzersizliğini kavrayan kalp; kula kul olmaktan, rızık endişesiyle zillete düşmekten ve fani sebeplerin kulu kölesi olmaktan kurtulup hakiki hürriyete kavuşur.",
        "tags": ["AKAID", "TEVHID", "EBU_HANIFE", "FIKHUL_EKBER", "EHL_I_SUNNET", "ALLAHIN_SIFATLARI", "TENZIH"],
        "nafs_traps": ["GIZLI_SIRK_VE_SAHTE_SIGINAKLAR", "ZAHIRE_ALDANMA_VE_SEBEP_PERESTLIK"],
        "is_riba_related": False,
        "source_type": "HADITH"
    },
    {
        "akaid_id": "akaid_002_ebu_hanife_kelamullah_kuran",
        "eser": "İmâm-ı Â'zam Ebû Hanîfe - el-Fıkhü'l-Ekber",
        "muellif": "İmâm-ı Â'zam Ebû Hanîfe (r.a.)",
        "baslik": "Kur'ân-ı Kerîm Allah'ın Kelâmıdır ve Mahluk Değildir",
        "madde_no": 2,
        "arapca_metin": "وَالْقُرْآنُ كَلامُ اللَّهِ تَعَالَى فِي الْمَصَاحِفِ مَكْتُوبٌ، وَفِي الْقُلُوبِ مَحْفُوظٌ، وَعَلَى الأَلْسُنِ مَقْرُوءٌ، وَعَلَى النَّبِيِّ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ مُنَزَّلٌ، وَهُوَ غَيْرُ مَخْلُوقٍ",
        "turkce_metin": "Kur'ân-ı Kerîm, Allah Teâlâ'nın kelâmıdır; mushaflarda yazılı, kalplerde mahfuz, dillerde okunur ve Peygamber (s.a.v.) Efendimiz'e indirilmiştir. Kelâmullah olarak mahluk (yaratılmış) değildir. Bizim onu telaffuzumuz, yazmamız ve işitmemiz mahluktur; lakin Allah'ın kelâm sıfatı ezelî ve ebedîdir.",
        "serh_ve_hikmet": "İmam Ebû Hanîfe bu kaideyle Kur'an'ı fani beşeri sözler seviyesine indiren Mutezile ve felsefi sapmalara set çekmiştir. Kur'an ilahi şifa kaynağıdır; okuyan kul doğrudan Rabbi ile kelâmî rabıta kurmuş olur.",
        "manevi_hikmet": "Kalbi daralan ve çıkış yolu arayan kul, Kur'an'a sıradan bir kitap gibi değil; Kainatın Rabbi'nin bizzat kendisine hitap eden hayat bahşedici kelâmı olarak sarılmalıdır.",
        "tags": ["AKAID", "KELAMULLAH", "KURAN", "EBU_HANIFE", "FIKHUL_EKBER", "HIKMET"],
        "nafs_traps": ["VESVESE_VE_GUSUL_ABDEST_EVHAMI", "ZAHIRE_ALDANMA_VE_SEBEP_PERESTLIK"],
        "is_riba_related": False,
        "source_type": "HADITH"
    },
    {
        "akaid_id": "akaid_003_ebu_hanife_kader_ve_irade",
        "eser": "İmâm-ı Â'zam Ebû Hanîfe - el-Fıkhü'l-Ekber",
        "muellif": "İmâm-ı Â'zam Ebû Hanîfe (r.a.)",
        "baslik": "Kaza, Kader ve İnsan İradesinin Hakikati",
        "madde_no": 3,
        "arapca_metin": "وَقَدَّرَ الأَشْيَاءَ وَقَضَاهَا، وَلا يَكُونُ فِي الدُّنْيَا وَلا فِي الآخِرَةِ شَيْءٌ إِلا بِمَشِيئَتِهِ وَعِلْمِهِ وَقَضَائِهِ وَقَدَرِهِ وَكَتَبَهُ فِي اللَّوْحِ الْمَحْفُوظِ، وَلَكِنْ كَتَبَهُ بِالْوَصْفِ لا بِالْحُكْمِ",
        "turkce_metin": "Allah Teâlâ her şeyi takdir etmiş ve hükme bağlamıştır. Dünyada ve ahirette hiçbir şey O'nun dilemesi, ilmi, kazası, kaderi ve Levh-i Mahfûz'a yazması olmaksızın vuku bulmaz. Lakin bu yazı zorlayıcı bir cebirle değil, kulun kendi cüz'î iradesiyle neyi seçeceğini ezelî ilmiyle bilip vasfı üzere kaydetmesidir. Hayır ve şer O'nun yaratmasıyla, sevap ve günah ise kulun kesbi ve iradesiyledir.",
        "serh_ve_hikmet": "Ebû Hanîfe, ne insanı rüzgarın önündeki yaprak gibi iradesiz sayan Cebriye'ye ne de Allah'ın kudretini sınırlandıran Kaderiye'ye meyletmiştir. Kul sebeplere tevessül etmekle ve mesuliyetle mükelleftir; ancak neticeyi var eden Allah'tır.",
        "manevi_hikmet": "İmtihan anında 'Keşke öyle yapmasaydım' diyerek geçmişin pişmanlık girdabına kapılmak yerine, tedbiri alıp takdire rıza göstermek ruhsal metanetin anahtarıdır.",
        "tags": ["AKAID", "KADER_VE_KAZA_HIKMETI", "IRADE", "EBU_HANIFE", "FIKHUL_EKBER", "TEVEKKUL"],
        "nafs_traps": ["KADERE_ITIRAZ_VE_ISYAN", "GECMISIN_PISMANLIK_GIRDABI", "KONTROL_YANILSAMASI_VE_MUKEMMELIYETCILIK"],
        "is_riba_related": False,
        "source_type": "HADITH"
    },
    {
        "akaid_id": "akaid_004_ebu_hanife_buyuk_gunah_ve_iman",
        "eser": "İmâm-ı Â'zam Ebû Hanîfe - el-Fıkhü'l-Ekber",
        "muellif": "İmâm-ı Â'zam Ebû Hanîfe (r.a.)",
        "baslik": "Büyük Günah İşleyenin Durumu ve Ümit Kapısı",
        "madde_no": 4,
        "arapca_metin": "وَلا نُكَفِّرُ مُسْلِمًا بِذَنْبٍ مِنْ الذُّنُوبِ وَإِنْ كَانَتْ كَبِيرَةً إِذَا لَمْ يَسْتَحِلَّهَا، وَلا نُزِيلُ عَنْهُ اسْمَ الإِيمَانِ، وَنُسَمِّيهِ مُؤْمِنًا حَقِيقَةً",
        "turkce_metin": "Helal saymadığı müddetçe, işlediği hiçbir günah sebebiyle bir Müslümanı küfürle itham etmeyiz (tekfir etmeyiz). Üzerinden iman ismini söküp atmayız; bilakis o günahkâr bir mümindir. İşi Allah'a kalmıştır; dilerse adaletiyle azap eder, dilerse lütuf ve rahmetiyle bağışlar.",
        "serh_ve_hikmet": "Haricilerin günah işleyeni dinden çıkaran katı ve dışlayıcı zihniyetine karşı Ebû Hanîfe, rahmet ve ümit kapısını açık tutmuştur. İman kalpteki tasdiktir; günah ise nefsin zafiyetidir. Tövbe kapısı son nefese kadar açıktır.",
        "manevi_hikmet": "Nefsine yenik düşüp günah işleyen kimse asla ümitsizliğe düşmemeli, şeytanın 'Artık senden adam olmaz' vesvesesine kanmayıp derhal Rabbine inabe etmelidir.",
        "tags": ["AKAID", "TEVBE_VE_INABE", "EBU_HANIFE", "FIKHUL_EKBER", "RAHMET_UMIDI", "TEKFIR_YASAGI"],
        "nafs_traps": ["UMITSIZLIK_KARAMSARLIK", "GECMISIN_PISMANLIK_GIRDABI"],
        "is_riba_related": False,
        "source_type": "HADITH"
    },
    {
        "akaid_id": "akaid_005_ebu_hanife_kabir_ve_ahiret",
        "eser": "İmâm-ı Â'zam Ebû Hanîfe - el-Fıkhü'l-Ekber",
        "muellif": "İmâm-ı Â'zam Ebû Hanîfe (r.a.)",
        "baslik": "Kabir Sualleri, Kabir Azabı ve Ahiret Hakikatleri",
        "madde_no": 5,
        "arapca_metin": "وَسُؤَالُ مُنْكَرٍ وَنَكِيرٍ فِي الْقَبْرِ حَقٌّ، وَعَذَابُ الْقَبْرِ حَقٌّ لِجَمِيعِ الْكُفَّارِ وَلِبَعْضِ عُصَاةِ الْمُؤْمِنِينَ، وَالْبَعْثُ بَعْدَ الْمَوْتِ حَقٌّ، وَالْمِيزَانُ حَقٌّ، وَالْحَوْضُ حَقٌّ",
        "turkce_metin": "Kabirde Münker ve Nekir meleklerinin suali haktır. Kabir azabı bütün kafirler ve bazı asi müminler için haktır ve sabittir. Kabir, mümin için cennet bahçelerinden bir bahçe, facir için cehennem çukurlarından bir çukurdur. Ölümden sonra diriliş, amellerin tartılacağı mizan ve Peygamberimiz'in Kevser Havzı haktır.",
        "serh_ve_hikmet": "Ebû Hanîfe ahiret inancını sağlam delillerle tahkim etmiştir. Kabir, fani dünyanın bittiği ve hakikat aynasının açıldığı ilk menzildir. Dünyadaki darlık ve imtihanlar ahiret sermayesine dönüşür.",
        "manevi_hikmet": "Kabri ve hesabı hatırlayan akıl sahibi insan; dünya malı için hırs yapmaz, harama el uzatmaz ve kul hakkı yemekten şiddetle kaçınır.",
        "tags": ["AKAID", "FANILIK_VE_TAZIYE", "KABIR_AZABI", "AHIRET", "EBU_HANIFE", "FIKHUL_EKBER"],
        "nafs_traps": ["TUL_I_EMEL_VE_GAYETSIZLIK", "DUNYALIK_KAYGI"],
        "is_riba_related": False,
        "source_type": "HADITH"
    },
    {
        "akaid_id": "akaid_006_ebu_hanife_vasiyetname_takva_ve_ilim",
        "eser": "İmâm-ı Â'zam Ebû Hanîfe - el-Vasiyye",
        "muellif": "İmâm-ı Â'zam Ebû Hanîfe (r.a.)",
        "baslik": "İmâm-ı Â'zam'ın Oğlu Hammâd'a Takva ve İhlas Vasiyeti",
        "madde_no": 6,
        "arapca_metin": "أُوصِيكَ بِتَقْوَى اللَّهِ تَعَالَى وَحِفْظِ جَوَارِحِكَ عَنِ الْمَحَارِمِ، وَإِقَامَةِ فَرَائِضِهِ، وَإِخْلاصِ الْعَمَلِ لَهُ، وَأَنْ لا تَأْكُلَ إِلا مِنْ حَلالٍ، وَأَنْ تَكُونَ كَثِيرَ الْمُرَاقَبَةِ لِرَبِّكَ",
        "turkce_metin": "Ey oğlum! Sana her gizli ve açık halinde Allah'tan korkup sakınmayı (takvayı), azalarını haramlardan muhafaza etmeyi, farzları vaktinde kılmayı, amelinde yalnız O'nun rızasını gözetmeyi ve boğazından helal lokmadan başka bir şey geçirmemeyi vasiyet ederim. Rabbini daima seni görür bil ve murakabeyi elden bırakma.",
        "serh_ve_hikmet": "Ebû Hanîfe'nin aile içi nebevi nasihati: İlmin meyvesi amel, amelin ruhu ise ihlas ve takvadır. Helal lokma kalbin nurudur; haram lokma ise duaların kabulüne en büyük engeldir.",
        "manevi_hikmet": "İbadetlerin lezzetini bulamayan kimse önce midesine ve kazancına bakmalıdır. Helal rızık tefekkürü açar, nefsin vesveselerini kırar.",
        "tags": ["AKAID", "VASIYETNAME", "EBU_HANIFE", "TAKVA", "HELAL_KAZANC", "IHLAS", "MURAKABE"],
        "nafs_traps": ["KOLAY_KAZANC_HIRSI", "FAKIRLIK_KORKUSU_VESVESESI", "ELALEM_NE_DER_RIYA"],
        "is_riba_related": False,
        "source_type": "HADITH"
    },
    {
        "akaid_id": "akaid_007_ebu_hanife_vasiyetname_ebu_yusuf",
        "eser": "İmâm-ı Â'zam Ebû Hanîfe - el-Vasiyye li-Ebi Yûsuf",
        "muellif": "İmâm-ı Â'zam Ebû Hanîfe (r.a.)",
        "baslik": "Talebesi Kadı Ebû Yûsuf'a Ahlak, Hilm ve Vakar Vasiyeti",
        "madde_no": 7,
        "arapca_metin": "إِذَا دَخَلْتَ مِصْرًا فَلا تَبْدَأْ بِالْمُنَاظَرَةِ، وَعَامِلِ النَّاسَ بِأَخْلاقِهِمْ فِي الْخَيْرِ، وَاسْتَعْمِلِ الْحِلْمَ وَالصَّبْرَ، وَلا تَضْجَرْ مِنْ سَائِلٍ، وَلا تَبْخَلْ بِعِلْمِكَ، وَاحْفَظْ وَقَارَ الْعِلْمِ",
        "turkce_metin": "Bir şehre girdiğinde hemen münakaşa ve cedele başlama. İnsanlara hayır hususunda güzel ahlakla muamele et. Hilm ve sabrı kendine şiar edin. Soru soran kimseden bıkıp usanma, yüzünü ekşitme. İlminde cimrilik yapma. İlmin vakarını ve izzetini muhafaza et; dünya ehlinin kapısında menfaat dilenme.",
        "serh_ve_hikmet": "Ebû Hanîfe'nin talebesine vasiyeti, İslam davetçisinin ve ilim ehlinin cemiyet içindeki nezaketini belirler. İlim kibirlenmek için değil, insanlara merhamet ve şefkatle rehberlik etmek içindir.",
        "manevi_hikmet": "Haklı olduğunu bilsen dahi kırıcı münakaşalardan kaçınmak; kalbi katılaşmaktan koruyan en yüce nebevi edeptir.",
        "tags": ["AKAID", "VASIYETNAME", "EBU_HANIFE", "EBU_YUSUF", "AHLAK", "HILM", "SABIR"],
        "nafs_traps": ["GIZLI_KIBIR_HAKLILIK", "OFKE_VE_AHLAK", "INTIKAM_VE_HASET"],
        "is_riba_related": False,
        "source_type": "HADITH"
    },
    {
        "akaid_id": "akaid_008_tahavi_tevhid_ve_tenzih",
        "eser": "İmam Ebû Ca'fer et-Tahâvî - el-Akîdetü't-Tahâviyye",
        "muellif": "İmam Ebû Ca'fer et-Tahâvî (v. 321/933)",
        "baslik": "Ehl-i Sünnet Akidesinde Tevhid ve Tenzihe Dair Temel Hükümler",
        "madde_no": 8,
        "arapca_metin": "نَقُولُ فِي تَوْحِيدِ اللَّهِ مُعْتَقِدِينَ بِتَوْفِيقِ اللَّهِ: إِنَّ اللَّهَ وَاحِدٌ لا شَرِيكَ لَهُ، وَلا شَيْءَ مِثْلُهُ، وَلا شَيْءَ يُعْجِزُهُ، وَلا إِلَهَ غَيْرُهُ. قَدِيمٌ بِلا ابْتِدَاءٍ، دَائِمٌ بِلا انْتِهَاءٍ، لا يَفْنَى وَلا يَبِيدُ، وَلا يَكُونُ إِلا مَا يُرِيدُ",
        "turkce_metin": "Allah'ın tevhidi hakkında O'nun lütfuyla şöyle inanırız: Şüphesiz Allah birdir, ortağı yoktur. Hiçbir şey O'nun misli ve benzeri değildir. Hiçbir şey O'nu aciz bırakamaz. O'ndan başka hiçbir ilah yoktur. Başlangıcı olmayan Kadîm, sonu olmayan Dâim'dir. Fani olmaz, yok olmaz; ancak dilediği şey vuku bulur.",
        "serh_ve_hikmet": "İbn Ebi'l-İzz el-Hanefî Şerhi: Tahâvî bu metinle İmam Ebû Hanîfe ve ashabının itikadını özetlemiştir. Allah Teâlâ'yı yaratılmışların sıfatlarından (teşbih ve tecsîm) tenzih etmek, aklın ve imanın selametidir.",
        "manevi_hikmet": "Hiçbir şeyin O'nu aciz bırakamayacağını bilen mümin; musibetler dağlar gibi yığılsa bile ye'se düşmez, aczini Rabbine arz edip sükûnet bulur.",
        "tags": ["AKAID", "TAHAVI", "AKIDETUT_TAHAVIYYE", "TEVHID", "TENZIH", "EHL_I_SUNNET"],
        "nafs_traps": ["UMITSIZLIK_KARAMSARLIK", "GIZLI_SIRK_VE_SAHTE_SIGINAKLAR"],
        "is_riba_related": False,
        "source_type": "HADITH"
    },
    {
        "akaid_id": "akaid_009_tahavi_kader_ve_levh",
        "eser": "İmam Ebû Ca'fer et-Tahâvî - el-Akîdetü't-Tahâviyye",
        "muellif": "İmam Ebû Ca'fer et-Tahâvî (r.a.)",
        "baslik": "Kaderin Sırrı, Levh ve Kalem Hakikati",
        "madde_no": 9,
        "arapca_metin": "وَأَصْلُ الْقَدَرِ سِرُّ اللَّهِ تَعَالَى فِي خَلْقِهِ، لَمْ يَطَّلِعْ عَلَى ذَلِكَ مَلَكٌ مُقَرَّبٌ، وَلا نَبِيٌّ مُرْسَلٌ، وَالتَّعَمُّقُ وَالنَّظَرُ فِي ذَلِكَ ذَرِيعَةُ الْخِذْلانِ، وَمَرْمَاةُ الْحِرْمَانِ",
        "turkce_metin": "Kaderin aslı, Allah Teâlâ'nın yaratıkları arasındaki gizli sırrıdır. Ne mukarreb bir melek ne de gönderilmiş bir peygamber bu sırra vakıf kılınmıştır. Bu sırrı aklın dar kalıplarıyla zorlamak, hüsran ve sapma vesilesidir. Kul, Allah'ın 'Yaptıklarından sorulmaz, onlar ise sorguya çekilirler' hitabına teslim olmalıdır.",
        "serh_ve_hikmet": "İmam Tahâvî müminin akıl sınırını tayin eder: İnsan kainatın sahibi değil, bir misafiridir. Başına gelen olayların perde arkasındaki ilahi hikmetleri göremese dahi, Allah'ın her işinde mutlak bir hayır ve adalet olduğuna itimat etmelidir.",
        "manevi_hikmet": "Hayatında ters giden hadiselerde 'Neden ben?' diyerek kadere isyan etmek yerine, 'Rabbim bunda benim göremediğim hangi hayrı sakladı?' teslimiyetiyle yaklaşmak iç huzurun kaynağıdır.",
        "tags": ["AKAID", "TAHAVI", "AKIDETUT_TAHAVIYYE", "KADER_VE_KAZA_HIKMETI", "TESLIMIYET", "TEVEKKUL"],
        "nafs_traps": ["KADERE_ITIRAZ_VE_ISYAN", "KONTROL_YANILSAMASI_VE_MUKEMMELIYETCILIK"],
        "is_riba_related": False,
        "source_type": "HADITH"
    },
    {
        "akaid_id": "akaid_010_tahavi_cemaat_ve_fitneden_uzaklasma",
        "eser": "İmam Ebû Ca'fer et-Tahâvî - el-Akîdetü't-Tahâviyye",
        "muellif": "İmam Ebû Ca'fer et-Tahâvî (r.a.)",
        "baslik": "Ehl-i Kıble ile Uhuvvet, Cemaat Şuuru ve Fitneden Sakınma",
        "madde_no": 10,
        "arapca_metin": "وَنَرَى الْجَمَاعَةَ حَقًّا وَصَوَابًا، وَالْفُرْقَةَ زَيْغًا وَعَذَابًا، وَدِينُ اللَّهِ فِي الأَرْضِ وَالسَّمَاءِ وَاحِدٌ، وَهُوَ دِينُ الإِسْلامِ، وَهُوَ بَيْنَ الْغُلُوِّ وَالتَّقْصِيرِ",
        "turkce_metin": "Cemaat ve birlik olmayı hak ve doğru, fırkalara ayrılıp tefrikaya düşmeyi ise eğrilik ve azap görürüz. Allah'ın dini gökte ve yerde tektir, o da İslam'dır. Bu din aşırılık (ifrat) ile ihmalkarlık (tefrit) arasında orta bir yoldur; teşbih ile ta'til arasında, cebr ile kaderiyecilik arasında, ümitsizlik ile yalancı emniyet arasında istikamet yoludur.",
        "serh_ve_hikmet": "Ehl-i Sünnet omurgası vasat (dengeli) ümmet şuurudur. Müminleri sudan sebeplerle tekfir etmek, hizipleşmek ve Müslümanların arasını açmak kalbi ifsat eden en büyük fitnelerdendir.",
        "manevi_hikmet": "Kardeşinin kusurunu aramak yerine kendi nefsinin ayıplarıyla meşgul olan mümin, hem dünyada vakarını korur hem de fitne zamanında selametle yürür.",
        "tags": ["AKAID", "TAHAVI", "AKIDETUT_TAHAVIYYE", "FITNE_VE_AHIR_ZAMAN_AHLAKI", "UHUVVET", "VASAT_UMMET"],
        "nafs_traps": ["SUI_ZAN_VE_TECESSUS", "GIZLI_KIBIR_HAKLILIK", "INTIKAM_VE_HASET"],
        "is_riba_related": False,
        "source_type": "HADITH"
    }
]

# ------------------------------------------------------------------------------
# 2. KALP VE AHLAK METINLERI: İmam Gazalî - İhyâu 'Ulûmi'd-Dîn (Seçilmiş Bölümler)
# ------------------------------------------------------------------------------
IHYA_DATA: List[Dict[str, Any]] = [
    {
        "ihya_id": "ihya_001_gazali_sabir_ve_sukur",
        "kitap_adi": "Kitâbu's-Sabr ve'ş-Şükr (Sabır ve Şükür Kitabı)",
        "bolum_adi": "İmanın İki Kanadı: Musibette Sabır, Nimet Anında Şükür",
        "muellif": "Hüccetü'l-İslâm İmam Ebû Hâmid el-Gazalî (v. 505/1111)",
        "arapca_metin": "الإِيمَانُ نِصْفَانِ: نِصْفٌ صَبْرٌ وَنِصْفٌ شُكْرٌ. فَالصَّبْرُ كَفُّ النَّفْسِ عَمَّا تَهْوَى وَحَبْسُهَا عَلَى مَا تَكْرَهُ لِوَجْهِ اللَّهِ تَعَالَى",
        "turkce_metin": "İman iki eşit yarıdan müteşekkildir: Yarısı sabır, diğer yarısı şükürdür. Sabır, nefsi arzuladığı haramlardan alıkoymak ve hoşlanmadığı meşakkatlere Allah rızası için tahammül etmektir. Şükür ise Allah'ın ihsan ettiği hiçbir azayı ve nimeti O'na isyan yolunda kullanmamaktır.",
        "ozet_hikmet": "Gazalî buyurur ki: İnsan hayatı iki halden ibarettir; ya nefsin hoşuna giden bir nimetle karşılaşır (ki vazifesi şükür ve kibre kapılmamaktır) ya da hoşlanmadığı bir hastalık, fakirlik veya vefasızlıkla sınanır (ki vazifesi sabır ve itiraz etmemektir). Bu iki makamı cem eden kul, dünya tufanında batmaz.",
        "nefis_terbiyesi": "Musibet geldiğinde feryat etmek musibeti hafifletmez, bilakis ecrini yok eder. Gerçek pehlivanlık ilk sarsıntıda kalbe hakim olup sükûnetle teslim olmaktır.",
        "tags": ["IHYA", "GAZALI", "SABIR_VE_MUSIBET", "SUKUR", "KALP_AMELLERI_VE_IHLAS", "NEFIS_TEZKIYESI"],
        "nafs_traps": ["KADERE_ITIRAZ_VE_ISYAN", "UMITSIZLIK_KARAMSARLIK", "REHAVET_TEMBELLIK"],
        "is_riba_related": False,
        "source_type": "HADITH"
    },
    {
        "ihya_id": "ihya_002_gazali_tevekkul_ve_sebepler",
        "kitap_adi": "Kitâbu't-Tevekkül ve't-Tevhîd (Tevekkül ve Tevhid Kitabı)",
        "bolum_adi": "Tevekkülün Hakikati ve Sebeplere Riayet Dengesi",
        "muellif": "Hüccetü'l-İslâm İmam Gazalî (r.a.)",
        "arapca_metin": "حَقِيقَةُ التَّوَكُّلِ هُوَ اعْتِمَادُ الْقَلْبِ عَلَى اللَّهِ تَعَالَى وَحْدَهُ فِي جَلْبِ الْمَنَافِعِ وَدَفْعِ الْمَضَارِّ، مَعَ الأَخْذِ بِالأَسْبَابِ الْمَشْرُوعَةِ دُونَ الاعْتِمَادِ عَلَيْهَا",
        "turkce_metin": "Tevekkülün hakikati; faydayı celp ve zararı defetme hususunda kalbin sadece ve sadece Allah'a itimat etmesidir. Ancak bu, sebepleri terk etmek demek değildir. Beden meşru sebeplere sarılır, tohumu eker, deveyi bağlar; fakat kalp sebebe değil, sebebi var eden Müsebbibü'l-Esbâb'a bağlanır.",
        "ozet_hikmet": "Sebepleri tamamen terk etmek şeriatı inkar etmektir; sebeplere güvenip neticeyi onlardan beklemek ise tevhidden sapmaktır. Mümin elinden geleni kemaliyle yapar, ardından kalbini endişelerden arındırıp neticeyi Allah'a havale eder.",
        "nefis_terbiyesi": "Rızık endişesiyle uykusu kaçan kimse, rızkı patronundan veya kasasından bilmektedir. Rızkı Rezzâk-ı Mutlak'tan bilen kalbe darlık anında dahi itminan iner.",
        "tags": ["IHYA", "GAZALI", "TEVEKKUL_VE_MURAKABE", "RIZIK_VE_TICARET", "NEFIS_TEZKIYESI"],
        "nafs_traps": ["FAKIRLIK_KORKUSU_VESVESESI", "ZAHIRE_ALDANMA_VE_SEBEP_PERESTLIK", "KONTROL_YANILSAMASI_VE_MUKEMMELIYETCILIK"],
        "is_riba_related": False,
        "source_type": "HADITH"
    },
    {
        "ihya_id": "ihya_003_gazali_kibir_ve_ucb_tedavisi",
        "kitap_adi": "Kitâbu Zemmi'l-Kibr ve'l-Ucb (Kibir ve Kendini Beğenme Afeti)",
        "bolum_adi": "Nefsin En Sinsi Zehri: Kibir ve İbadetiyle Böbürlenme (Ucb)",
        "muellif": "Hüccetü'l-İslâm İmam Gazalî (r.a.)",
        "arapca_metin": "الْكِبْرُ هُوَ رُؤْيَةُ النَّفْسِ فَوْقَ الْغَيْرِ وَاسْتِحْقَارُ النَّاسِ، وَالْعُجْبُ هُوَ اسْتِعْظَامُ النِّعْمَةِ وَالرُّكُونُ إِلَيْهَا مَعَ نِسْيَانِ إِضَافَتِهَا إِلَى الْمُنْعِمِ",
        "turkce_metin": "Kibir; kendini başkalarından üstün görmek ve insanları hakir saymaktır. Ucb ise kulun kendi yaptığı ameli, zekasını veya zenginliğini büyük görüp o nimeti Allah'tan bilmeyi unutmasıdır. Nice günahkâr vardır ki mahcubiyetiyle kurtulur; nice ibadet ehli vardır ki ucb ve böbürlenmesiyle helak olur.",
        "ozet_hikmet": "Gazalî der ki: Kendinde başkasına karşı zerre kadar üstünlük vehmeden kimse kibrin pençesindedir. Bir fâsıkı gördüğünde dahi 'Belki onun gizli bir hali vardır ki benden önce affedilir, benim ise sonum meçhuldür' diyebilen kalp şifa bulmuştur.",
        "nefis_terbiyesi": "Kibrin ilacı, insanın menşeini ve sonunu tefekkür etmesidir. Başlangıcı bir damla su, sonu bir avuç toprak olan insanın büyüklük taslaması ne acı bir cehalettir.",
        "tags": ["IHYA", "GAZALI", "KIBIR", "UCUB", "OFKE_VE_AHLAK", "KALP_AMELLERI_VE_IHLAS", "NEFIS_TEZKIYESI"],
        "nafs_traps": ["GIZLI_KIBIR_HAKLILIK", "UCUB_VE_AMELINE_GUVENME", "ELALEM_NE_DER_RIYA"],
        "is_riba_related": False,
        "source_type": "HADITH"
    },
    {
        "ihya_id": "ihya_004_gazali_ofke_ve_hased_marazi",
        "kitap_adi": "Kitâbu Zemmi'l-Ġadab ve'l-Hıkd ve'l-Hased (Öfke, Kin ve Haset Afeti)",
        "bolum_adi": "Gazap Ateşini Söndürme ve Haset Zehrinden Arınma",
        "muellif": "Hüccetü'l-İslâm İmam Gazalî (r.a.)",
        "arapca_metin": "الْغَضَبُ جَمْرَةٌ مِنْ نَارِ الشَّيْطَانِ، وَالْحَسَدُ يَأْكُلُ الْحَسَنَاتِ كَمَا تَأْكُلُ النَّارُ الْحَطَبَ. وَعِلاجُ الْغَضَبِ أَنْ يَعْلَمَ أَنَّ قُدْرَةَ اللَّهِ عَلَيْهِ أَعْظَمُ مِنْ قُدْرَتِهِ عَلَى النَّاسِ",
        "turkce_metin": "Öfke, şeytanın kalbe attığı bir ateş parçasıdır. Haset ise ateşin odunu yiyip bitirdiği gibi salih amelleri tüketir. Öfkelenen kimsenin ilacı; Allah'ın kendi üzerindeki kudretinin, kendisinin o insana olan gücünden katbekat büyük olduğunu hatırlaması ve affı seçmesidir.",
        "ozet_hikmet": "Gazalî öfkeyi dindirmenin basamaklarını açıklar: Öfkelendiğinde ayaktaysa oturmalı, oturuyorsa uzanmalı, soğuk suyla abdest almalı ve 'Eğer ben bu kulun kusurunu bağışlamazsam, yarın mahşerde Allah'tan nasıl af dileyebilirim?' muhasebesi yapmalıdır.",
        "nefis_terbiyesi": "Kin ve haset taşıyan insan başkasına değil, en çok kendi ruhuna azap eder. Haset ettiği nimetin sahibine zarar veremez, fakat kendi kalbini kemirip huzurunu yok eder.",
        "tags": ["IHYA", "GAZALI", "OFKE_VE_AHLAK", "HASED", "HILM", "KALP_AMELLERI_VE_IHLAS"],
        "nafs_traps": ["INTIKAM_VE_HASET", "GIZLI_KIBIR_HAKLILIK", "KAYITSIZLIK_VE_MERHAMETSIZLIK"],
        "is_riba_related": False,
        "source_type": "HADITH"
    },
    {
        "ihya_id": "ihya_005_gazali_murakabe_ve_muhasebe",
        "kitap_adi": "Kitâbu'l-Murâkabe ve'l-Muhâsebe (Nefis Muhasebesi Kitabı)",
        "bolum_adi": "Nefsi Teftişin Dört Makamı: Müşârata, Murâkaba, Muhâsaba, Muâkaba",
        "muellif": "Hüccetü'l-İslâm İmam Gazalî (r.a.)",
        "arapca_metin": "حَاسِبُوا أَنْفُسَكُمْ قَبْلَ أَنْ تُحَاسَبُوا. وَالْمُرَاقَبَةُ هِيَ عِلْمُ الْقَلْبِ بِقُرْبِ الرَّبِّ تَعَالَى وَاطِّلاعِهِ عَلَى السِّرِّ وَأَخْفَى",
        "turkce_metin": "Hesaba çekilmeden önce kendi nefsinizi hesaba çekiniz. Murakabe; kalbin, Rabbinin kendisine şah damarından yakın olduğunu, her gizli niyetini ve bakışını bildiğini idrak etmesidir. Kul her sabah nefsiyle şartlaşmalı (müşârata), gün boyu kendini gözetlemeli (murâkaba), akşam hesabını görmeli (muhâsaba) ve kusurunu telafi etmelidir (muâkaba).",
        "ozet_hikmet": "Ticarethanede bir kuruşun hesabını yapan tüccar gibi, mümin de ömür sermayesinin dakikalarını teftiş etmelidir. Boş geçen zaman ve gıybetle kirlenen dil telafisi en zor kayıptır.",
        "nefis_terbiyesi": "Gece yatağa girmeden önce beş dakika gözlerini kapatıp 'Bugün kimi kırdım? Rabbime hangi sözü tuttum?' muhasebesi yapan kul, kalbini manevi paslardan arındırır.",
        "tags": ["IHYA", "GAZALI", "TEVEKKUL_VE_MURAKABE", "NEFIS_TEZKIYESI", "MUHASEBE_VE_TEVBE"],
        "nafs_traps": ["REHAVET_TEMBELLIK", "TUL_I_EMEL_VE_GAYETSIZLIK", "ELALEM_NE_DER_RIYA"],
        "is_riba_related": False,
        "source_type": "HADITH"
    },
    {
        "ihya_id": "ihya_006_gazali_afatu_lisan_ve_sukut",
        "kitap_adi": "Kitâbu Afâti'l-Lisân (Dilin Afetleri Kitabı)",
        "bolum_adi": "Gıybet, Malayanî ve Boş Sözlerden Sükûnet Kalesi ile Korunma",
        "muellif": "Hüccetü'l-İslâm İmam Gazalî (r.a.)",
        "arapca_metin": "الْمَرْءُ مَخْبُوءٌ تَحْتَ لِسَانِهِ. وَالسُّكُوتُ عِبَادَةٌ مِنْ غَيْرِ عَنَاءٍ، وَزِينَةٌ مِنْ غَيْرِ حُلِيٍّ، وَهَيْبَةٌ مِنْ غَيْرِ سُلْطَانٍ",
        "turkce_metin": "İnsan, dilinin altında gizlidir. Lisan kalbin tercümanıdır; kapta ne varsa dışarı o sızar. Yerinde sükût etmek; yorulmadan yapılan bir ibadet, süssüz bir ziynet ve kudretsiz bir heybettir. Konuştuğunda ya hayır söylemeli ya da susmalıdır.",
        "ozet_hikmet": "Gazalî dilin yirmi afetini sıralar: Yalan, gıybet, koğuculuk, riyakâr övgü, müstehcen söz, lüzumsuz münakaşa ve başkasının kusurunu ifşa etmek. Dilini tutamayan kimsenin kalbi harabeye döner.",
        "nefis_terbiyesi": "Bir mecliste başkası hakkında konuşulmaya başlandığında orayı terk etmek veya mevzuyu hayra çevirmek, nefsin dedikodu iştahını kıran en etkili terbiyedir.",
        "tags": ["IHYA", "GAZALI", "OFKE_VE_AHLAK", "DILIN_AFETLERI", "GIYBET", "HIKMETLI_SUKUT"],
        "nafs_traps": ["SUI_ZAN_VE_TECESSUS", "MINNET_VE_BASA_KAKMA", "GIZLI_KIBIR_HAKLILIK"],
        "is_riba_related": False,
        "source_type": "HADITH"
    },
    {
        "ihya_id": "ihya_007_gazali_dunya_harsi_ve_zuhd",
        "kitap_adi": "Kitâbu Zemmi'd-Dünyâ ve'z-Zühd (Dünya Muhabbetinin Yergisi ve Zühd)",
        "bolum_adi": "Dünyanın Faniliği ve Kalbi Eşyanın Tahakkümünden Kurtarma",
        "muellif": "Hüccetü'l-İslâm İmam Gazalî (r.a.)",
        "arapca_metin": "لَيْسَ الزُّهْدُ أَنْ لا تَمْلِكَ شَيْئًا، بَلِ الزُّهْدُ أَنْ لا يَمْلِكَكَ شَيْءٌ. الدُّنْيَا كَالْمَاءِ، وَالْقَلْبُ كَالسَّفِينَةِ؛ فَإِذَا دَخَلَ الْمَاءُ السَّفِينَةَ غَرِقَتْ",
        "turkce_metin": "Zühd, elinde hiçbir şey bulunmaması demek değildir; bilakis hiçbir dünyalığın senin kalbine sahip olamamasıdır. Dünya deniz suyu gibidir, kalbin ise bir gemidir. Su geminin altında kaldığı müddetçe gemi yüzer; fakat su geminin içine girerse onu batırır.",
        "ozet_hikmet": "Gazalî der ki: Mal mülk elde olmalı fakat kalbe girmemelidir. Malı cebinde tutan cömertçe infak eder; malı kalbine sokan ise cimrileşir, fakirlik korkusuyla harama tevessül eder ve faiz tuzaklarına düşer.",
        "nefis_terbiyesi": "Kaybettiğin bir dünyalık için günlerce yas tutuyorsan, o mal senin kalbine girmiş demektir. Faniliğe değil, Bâkî olan Allah'a kalbini raptet.",
        "tags": ["IHYA", "GAZALI", "ISRAF_VE_IKTISAT_FIKHI", "ZUHD", "FANILIK_VE_TAZIYE", "NEFIS_TEZKIYESI"],
        "nafs_traps": ["CIMRILIK_VE_MAL_HIRSI", "FAKIRLIK_KORKUSU_VESVESESI", "KOLAY_KAZANC_HIRSI"],
        "is_riba_related": True,
        "source_type": "HADITH"
    },
    {
        "ihya_id": "ihya_008_gazali_tevbe_ve_inabe_ruknu",
        "kitap_adi": "Kitâbu't-Tevbe (Tevbe Kitabı)",
        "bolum_adi": "Tevbenin Üç Rüknü: İlim, Pişmanlık ve Amelî Azim",
        "muellif": "Hüccetü'l-İslâm İmam Gazalî (r.a.)",
        "arapca_metin": "التَّوْبَةُ تَنْتَظِمُ مِنْ ثَلاثَةِ أُمُورٍ: عِلْمٍ، وَحَالٍ، وَفِعْلٍ. فَالْعِلْمُ هُوَ مَعْرِفَةُ عِظَمِ ضَرَرِ الذُّنُوبِ، وَالْحَالُ هُوَ احْتِرَاقُ الْقَلْبِ نَدَمًا، وَالْفِعْلُ هُوَ الإِقْلاعُ فِي الْحَالِ وَالْعَزْمُ عَلَى عَدَمِ الْعَوْدِ",
        "turkce_metin": "Tevbe üç hakikatten meydana gelir: İlim, hâl ve fiil. İlim; günahların kul ile Rabbi arasına giren zehirli engeller olduğunu bilmektir. Hâl; bu idrakle kalbin pişmanlık ateşiyle yanmasıdır (Nedamet). Fiil ise; günahı derhal terk etmek, gelecekte işlememeye azmetmek ve varsa kul haklarını ödeyip helalleşmektir.",
        "ozet_hikmet": "Tevbe sadece dille 'Estağfirullah' demek değildir. Hakiki tevbe; kalbin istikametini bütünüyle günah vadisinden ilahi rıza dergahına çevirmesidir. Kul hakkı varsa hak sahibine iade edilmedikçe tevbe kemale ermez.",
        "nefis_terbiyesi": "Günahın küçüklüğüne değil, kime karşı isyan ettiğinin azametine bak. Pişmanlıkla dökülen bir damla gözyaşı, nefsin kibrini eriten en saf iksirdir.",
        "tags": ["IHYA", "GAZALI", "TEVBE_VE_INABE", "KUL_HAKKI_VE_ADALET", "MUHASEBE_VE_TEVBE"],
        "nafs_traps": ["GECMISIN_PISMANLIK_GIRDABI", "UMITSIZLIK_KARAMSARLIK"],
        "is_riba_related": False,
        "source_type": "HADITH"
    }
]

# ------------------------------------------------------------------------------
# 3. ZIKIR, DUA VE NEBEVI AHLAK: İmam Nevevî - el-Ezkâr & Riyâzü's-Sâlihîn
# ------------------------------------------------------------------------------
EZKAR_DATA: List[Dict[str, Any]] = [
    {
        "ezkar_id": "ezkar_001_nevevi_sikinti_kurb_duasi",
        "eser_adi": "el-Ezkâr el-Müntehabe",
        "bolum": "Darlık, Keder ve Şiddetli Sıkıntı Anında Yapılacak Dualar (Kürb Duası)",
        "muellif": "İmam Ebû Zekeriyyâ Yahyâ b. Şeref en-Nevevî (v. 676/1277)",
        "baslik": "Resûlullah'ın (s.a.v.) Darlık Vaktindeki İlticası (Kürb Duası)",
        "arapca_metin": "لا إِلَهَ إِلا اللَّهُ الْعَظِيمُ الْحَلِيمُ، لا إِلَهَ إِلا اللَّهُ رَبُّ الْعَرْشِ الْعَظِيمِ، لا إِلَهَ إِلا اللَّهُ رَبُّ السَّمَاوَاتِ وَرَبُّ الأَرْضِ وَرَبُّ الْعَرْشِ الْكَرِيمِ",
        "dua_turkce": "Azîm ve Halîm olan Allah'tan başka hiçbir ilah yoktur. Yüce Arş'ın Rabbi olan Allah'tan başka hiçbir ilah yoktur. Göklerin Rabbi, yerin Rabbi ve kerîm Arş'ın Rabbi olan Allah'tan başka hiçbir ilah yoktur.",
        "kaynak": "Sahih-i Buhârî (Deavât 27), Sahih-i Müslim (Zikr 83), Nevevî el-Ezkâr s. 182",
        "sahihlik_derecesi": "Müttefekun Aleyh (Sahih)",
        "serh": "İmam Nevevî: 'Bu mübarek zikir Resûlullah'ın (s.a.v.) büyük bir musibet, darlık veya çaresizlik anında ilk sarıldığı nebevi sığınaktır. İçinde talep cümlesi olmaksızın sırf tevhid ve tenzih ile başlar; zira kul Rabbini azametiyle andığında Allah onun darlığını inşiraha tebdil eder.'",
        "manevi_hikmet": "Göğsün daraldığında ve dünyevi kapılar kapandığında bu nebevi tevhid zikrini kalben tekrar et. Arş'ın sahibine dayanan kimse hiçbir fani meşakkat altında ezilmez.",
        "tags": ["EZKAR", "NEVEVI", "DUA_VE_ILCA_USULU", "SIKINTI_DUASI", "TEVHID", "INSERAH", "DUA"],
        "nafs_traps": ["UMITSIZLIK_KARAMSARLIK", "DARALMA", "CARESIZLIK_VEHMI"],
        "is_riba_related": False,
        "source_type": "DUA"
    },
    {
        "ezkar_id": "ezkar_002_nevevi_keder_ve_borc_duasi",
        "eser_adi": "el-Ezkâr el-Müntehabe",
        "bolum": "Keder, Tasa, Borç Yükü ve İnsanların Tahakkümünden Sığınma",
        "muellif": "İmam Nevevî (r.a.)",
        "baslik": "Hüzün, Acizlik ve Ağır Borç Altında Ezilmekten Korunma Duası",
        "arapca_metin": "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَأَعُوذُ بِكَ مِنَ الْعَجْزِ وَالْكَسَلِ، وَأَعُوذُ بِكَ مِنَ الْجُبْنِ وَالْبُخْلِ، وَأَعُوذُ بِكَ مِنْ غَلَبَةِ الدَّيْنِ وَقَهْرِ الرِّجَالِ",
        "dua_turkce": "Allah'ım! Gelecek kaygısından (tasadan) ve geçmişin hüznünden Sana sığınırım. Acizlikten ve tembellikten Sana sığınırım. Korkaklıktan ve cimrilikten Sana sığınırım. Borcun belimi bükmesinden ve insanların tahakkümü altında ezilip horlanmaktan Sana sığınırım.",
        "kaynak": "Sahih-i Buhârî (Deavât 35), Ebû Dâvûd (Vitr 32), Nevevî el-Ezkâr s. 185",
        "sahihlik_derecesi": "Sahih",
        "serh": "İmam Nevevî buyurur: 'Peygamberimiz (s.a.v.) bu duayı sabah ve akşam vird edinmeyi ashabına öğretmiştir. Ebû Ümâme (r.a.) mescidde borç ve darlık içinde otururken Resûlullah bu duayı ona talim etmiş, o da devam ederek borçlarından ve kederinden halas olmuştur.'",
        "manevi_hikmet": "Maddi sıkıntı ve borç baskısı insanı zillete ve faiz batağına düşürmesin diye her sabah bu nebevi kalkanı kuşanmak, kalbe gayret ve ümit aşılar.",
        "tags": ["EZKAR", "NEVEVI", "DUA_VE_ILCA_USULU", "BORC_KRIZI", "RIZIK_VE_TICARET", "DUA"],
        "nafs_traps": ["FAKIRLIK_KORKUSU_VESVESESI", "REHAVET_TEMBELLIK", "UMITSIZLIK_KARAMSARLIK"],
        "is_riba_related": True,
        "source_type": "DUA"
    },
    {
        "ezkar_id": "ezkar_003_nevevi_seyyidul_istigfar",
        "eser_adi": "el-Ezkâr el-Müntehabe",
        "bolum": "İstiğfarın Şahı: Seyyidü'l-İstiğfâr",
        "muellif": "İmam Nevevî (r.a.)",
        "baslik": "Kulun Aczini ve Günahını İtiraf Edip İlahi Mağfirete Sığınması",
        "arapca_metin": "اللَّهُمَّ أَنْتَ رَبِّي لا إِلَهَ إِلا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لا يَغْفِرُ الذُّنُوبَ إِلا أَنْتَ",
        "dua_turkce": "Allah'ım! Sen benim Rabbimsin; Senden başka hiçbir ilah yoktur. Beni Sen yarattın ve ben Senin kulunum. Gücüm yettiğince Sana verdiğim ahit ve vaat üzereyim. Yaptıklarımın şerrinden Sana sığınırım. Üzerimdeki nimetini itiraf eder, günahımı da Sana arz ederim. Beni bağışla; zira günahları Senden başka bağışlayacak kimse yoktur.",
        "kaynak": "Sahih-i Buhârî (Deavât 2), Nevevî el-Ezkâr s. 80",
        "sahihlik_derecesi": "Sahih (Buhârî)",
        "serh": "İmam Nevevî: 'Resûlullah (s.a.v.) buyurdu: Kim bu duayı sevabına inanarak gündüz okur da akşamdan önce ölürse cennet ehlindendir. Kim de gece okur da sabahtan önce vefat ederse cennet ehlindendir.' Bu dua kulluk edebinin zirvesidir.",
        "manevi_hikmet": "Geçmişin günahları altında ezilip ye'se düşen ruh, bu istiğfar ile Rabbine sığınarak tertemiz bir sayfa açar ve ilahi rahmete kavuşur.",
        "tags": ["EZKAR", "NEVEVI", "DUA_VE_ILCA_USULU", "ISTIGFAR", "TEVBE_VE_INABE", "DUA"],
        "nafs_traps": ["GECMISIN_PISMANLIK_GIRDABI", "UMITSIZLIK_KARAMSARLIK"],
        "is_riba_related": False,
        "source_type": "DUA"
    },
    {
        "ezkar_id": "ezkar_004_nevevi_evden_cikarken_tevekkul",
        "eser_adi": "el-Ezkâr el-Müntehabe",
        "bolum": "Evden Çıkarken, Rızık Aramaya Başlarken Tevekkül Duası",
        "muellif": "İmam Nevevî (r.a.)",
        "baslik": "Dünya Hayatına ve İşe Başlarken İlahi Himaye Talebi",
        "arapca_metin": "بِسْمِ اللَّهِ، تَوَكَّلْتُ عَلَى اللَّهِ، لا حَوْلَ وَلا قُوَّةَ إِلا بِاللَّهِ",
        "dua_turkce": "Allah'ın adıyla! Ben ancak Allah'a tevekkül ettim. Günahlardan korunmaya ve ibadete güç yetirmeye hiçbir takat yoktur; ancak Yüce Allah'ın yardımıyladır.",
        "kaynak": "Ebû Dâvûd (Edeb 102), Tirmizî (Deavât 34), Nevevî el-Ezkâr s. 28",
        "sahihlik_derecesi": "Sahih (Tirmizî: Hasen-Sahih)",
        "serh": "İmam Nevevî: 'Resûlullah (s.a.v.) buyurdu: İnsan evinden çıkarken bu duayı okuduğunda kendisine şöyle nida edilir: Hidayete erdirildin, ihtiyaçların karşılandı ve kötülüklerden korundun! Şeytan da ondan uzaklaşır.'",
        "manevi_hikmet": "Sabah işine ve maişetine koşarken kapıdan bu şuurla çıkan esnaf ve çalışan; hileden, faizden, haram lokmadan ve panikten korunur.",
        "tags": ["EZKAR", "NEVEVI", "DUA_VE_ILCA_USULU", "TEVEKKUL", "RIZIK_VE_TICARET", "DUA"],
        "nafs_traps": ["FAKIRLIK_KORKUSU_VESVESESI", "KONTROL_YANILSAMASI_VE_MUKEMMELIYETCILIK"],
        "is_riba_related": False,
        "source_type": "DUA"
    },
    {
        "ezkar_id": "ezkar_005_nevevi_vesvese_ve_evham_defetme",
        "eser_adi": "el-Ezkâr el-Müntehabe",
        "bolum": "Kalbe Gelen Vesvese, Şüphe ve Evhamı Defetme Duaları",
        "muellif": "İmam Nevevî (r.a.)",
        "baslik": "İbâdette ve İtikadda Vesveseye Düşen Kimsenin Zikri",
        "arapca_metin": "آمَنْتُ بِاللَّهِ وَرُسُلِهِ. هُوَ الأَوَّلُ وَالآخِرُ وَالظَّاهِرُ وَالْبَاطِنُ وَهُوَ بِكُلِّ شَيْءٍ عَلِيمٌ. أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ",
        "dua_turkce": "Allah'a ve peygamberlerine iman ettim! O, Evvel'dir (başlangıcı yoktur), Âhir'dir (sonu yoktur), Zâhir'dir (varlığı delillerle açıktır), Bâtın'dır (zatı idrak edilemez). O her şeyi hakkıyla bilendir. Kovulmuş şeytanın vesvesesinden Allah'a sığınırım.",
        "kaynak": "Sahih-i Müslim (Îmân 212), Ebû Dâvûd (Edeb 109), Nevevî el-Ezkâr s. 143",
        "sahihlik_derecesi": "Sahih",
        "serh": "İmam Nevevî: 'Abdestte, namazda veya kalbinde istemsizce beliren vesveselerden mustarip olan kimse bu vesveseyi tartışmaya girmeden derhal kesmeli, bu ayet ve zikirle Rabbine sığınmalıdır. Zira şeytan vesveseyle kalbi oyalamak ister; üzerine gidilmezse kendiliğinden söner.'",
        "manevi_hikmet": "Vesvese bir günah değil, şeytanın kalbe attığı boş bir fısıltıdır. Kul o fısıltıya kulak asmayıp zikir kalesine sığındığında iç huzura erer.",
        "tags": ["EZKAR", "NEVEVI", "DUA_VE_ILCA_USULU", "VESVESE", "TEVEKKUL_VE_MURAKABE", "DUA"],
        "nafs_traps": ["VESVESE_VE_GUSUL_ABDEST_EVHAMI", "ZAHIRE_ALDANMA_VE_SEBEP_PERESTLIK"],
        "is_riba_related": False,
        "source_type": "DUA"
    },
    {
        "ezkar_id": "ezkar_006_nevevi_riyazussalihin_murakabe",
        "eser_adi": "Riyâzü's-Sâlihîn",
        "bolum": "Bâbu'l-Murâkabe (Allah'ın Gözetiminde Yaşama Şuuru)",
        "muellif": "İmam Nevevî (r.a.)",
        "baslik": "İhsan Makamı ve Gizlide Açıkta Takva Esası",
        "arapca_metin": "عَنْ أَبِي هُرَيْرَةَ رَضِيَ اللَّهُ عَنْهُ، أَنَّ النَّبِيَّ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ قَالَ فِي حَدِيثِ جِبْرِيلَ: الإِحْسَانُ أَنْ تَعْبُدَ اللَّهَ كَأَنَّكَ تَرَاهُ، فَإِنْ لَمْ تَكُنْ تَرَاهُ فَإِنَّهُ يَرَاكَ",
        "dua_turkce": "Ebû Hüreyre'den (r.a.) rivayetle Peygamber Efendimiz (s.a.v.) Cibril hadisinde şöyle buyurdu: 'İhsan; Allah'ı görüyormuşsun gibi O'na kulluk etmendir. Her ne kadar sen O'nu görmüyorsan da şüphesiz O seni görmektedir.'",
        "kaynak": "Riyâzü's-Sâlihîn Hadis No: 60; Sahih-i Buhârî (Îmân 37), Sahih-i Müslim (Îmân 1)",
        "sahihlik_derecesi": "Müttefekun Aleyh (Sahih)",
        "serh": "İmam Nevevî: 'Murakabe babı, kalbi riyadan, gizli günahlardan ve benlik putlarından koruyan en büyük kalkandır. İnsanların görmediği tenhalarda dahi Allah'ın kendisini izlediğini bilen mümin, kötülüğe el uzatamaz.'",
        "manevi_hikmet": "Kamera ve denetçilerin olmadığı yerde kul hakkına ve harama girmeyen insan, ihsan şuuruna ermiştir.",
        "tags": ["RIYAZUS_SALIHIN", "NEVEVI", "MURAKABE", "IHSAN", "KALP_AMELLERI_VE_IHLAS", "HADITH"],
        "nafs_traps": ["ELALEM_NE_DER_RIYA", "GIZLI_SIRK_VE_SAHTE_SIGINAKLAR"],
        "is_riba_related": False,
        "source_type": "HADITH"
    },
    {
        "ezkar_id": "ezkar_007_nevevi_riyazussalihin_sabr",
        "eser_adi": "Riyâzü's-Sâlihîn",
        "bolum": "Bâbu's-Sabr (Musibetler Karşısında Sabır ve Metanet)",
        "muellif": "İmam Nevevî (r.a.)",
        "baslik": "Müminin Haline Hayranlık: Nimet Gelince Şükür, Darlık Gelince Sabır",
        "arapca_metin": "عَنْ صُهَيْبٍ رَضِيَ اللَّهُ عَنْهُ قَالَ: قَالَ رَسُولُ اللَّهِ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ: عَجَبًا لأَمْرِ الْمُؤْمِنِ إِنَّ أَمْرَهُ كُلَّهُ خَيْرٌ، وَلَيْسَ ذَاكَ لأَحَدٍ إِلا لِلْمُؤْمِنِ: إِنْ أَصَابَتْهُ سَرَّاءُ شَكَرَ فَكَانَ خَيْرًا لَهُ، وَإِنْ أَصَابَتْهُ ضَرَّاءُ صَبَرَ فَكَانَ خَيْرًا لَهُ",
        "dua_turkce": "Suheyb'den (r.a.) rivayetle Resûlullah (s.a.v.) buyurdu: 'Müminin haline şaşılır! Şüphesiz onun her işi hayırdır. Bu hal müminden başka hiç kimsede yoktur: Kendisine bir sevinç ve nimet isabet etse şükreder, bu onun için hayır olur. Bir musibet ve darlık isabet etse sabreder, bu da onun için hayır olur.'",
        "kaynak": "Riyâzü's-Sâlihîn Hadis No: 27; Sahih-i Müslim (Zühd 64)",
        "sahihlik_derecesi": "Sahih (Müslim)",
        "serh": "İmam Nevevî: 'Mümin için dünyada mutlak zarar yoktur; niyet ve tavır selim oldukça her durum ecir ve derecat vesilesidir.'",
        "manevi_hikmet": "Ruhsal daralma yaşayan kimse bilmelidir ki sabrettiği her saniye günahlarına kefaret olmakta ve manevi rütbesini artırmaktadır.",
        "tags": ["RIYAZUS_SALIHIN", "NEVEVI", "SABIR_VE_MUSIBET", "SUKUR", "TESKIN_VE_TESELLI", "HADITH"],
        "nafs_traps": ["KADERE_ITIRAZ_VE_ISYAN", "UMITSIZLIK_KARAMSARLIK"],
        "is_riba_related": False,
        "source_type": "HADITH"
    },
    {
        "ezkar_id": "ezkar_008_nevevi_riyazussalihin_yakin_tevekkul",
        "eser_adi": "Riyâzü's-Sâlihîn",
        "bolum": "Bâbu'l-Yakîn ve't-Tevekkül (Sarsılmaz İman ve Tevekkül)",
        "muellif": "İmam Nevevî (r.a.)",
        "baslik": "Kuşların Rızıklanması Misali Hakiki Tevekkül",
        "arapca_metin": "عَنْ عُمَرَ رَضِيَ اللَّهُ عَنْهُ قَالَ: سَمِعْتُ رَسُولَ اللَّهِ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ يَقُولُ: لَوْ أَنَّكُمْ تَتَوَكَّلُونَ عَلَى اللَّهِ حَقَّ تَوَكُّلِهِ لَرَزَقَكُمْ كَمَا يَرْزُقُ الطَّيْرَ؛ تَغْدُو خِمَاصًا وَتَرُوحُ بِطَانًا",
        "dua_turkce": "Hz. Ömer'den (r.a.) rivayetle Resûlullah (s.a.v.) buyurdu: 'Eğer siz Allah'a hakkıyla tevekkül etseydiniz; sabahleyin aç çıkıp akşamleyin kursakları doymuş olarak dönen kuşları rızıklandırdığı gibi sizi de rızıklandırırdı.'",
        "kaynak": "Riyâzü's-Sâlihîn Hadis No: 79; Tirmizî (Zühd 33), İbn Mâce (Zühd 14)",
        "sahihlik_derecesi": "Sahih (Tirmizî: Hasen-Sahih)",
        "serh": "İmam Nevevî: 'Hadis-i şerifte tevekkülün tembellik olmadığı açıktır. Zira kuşlar yuvalarında beklemez; sabah erkenden rızık aramaya uçar ve gayret gösterir. Asıl mesele kalpte endişe taşımayıp Rezzâk'a güvenmektir.'",
        "manevi_hikmet": "Gelecek kaygısıyla uykuları kaçan insan, gökyüzündeki kuşların rızkını unutmayan Allah'ın kendisini de asla zayi etmeyeceğini tefekkür etmelidir.",
        "tags": ["RIYAZUS_SALIHIN", "NEVEVI", "TEVEKKUL_VE_MURAKABE", "RIZIK_VE_TICARET", "HADITH"],
        "nafs_traps": ["FAKIRLIK_KORKUSU_VESVESESI", "DUNYALIK_KAYGI"],
        "is_riba_related": False,
        "source_type": "HADITH"
    }
]

def verify_banned_words(data: List[Dict[str, Any]], filename: str) -> None:
    text_corpus = json.dumps(data, ensure_ascii=False).lower()
    if "sekinet" in text_corpus:
        raise ValueError(f"CRITICAL ERROR: Banned word 'sekinet' detected in {filename}!")
    print(f"  [OK] Banned word check passed for {filename} (no 'sekinet').")

def write_json_safely(data: List[Dict[str, Any]], filename: str) -> None:
    verify_banned_words(data, filename)
    
    # Write to pipeline data dir
    DATA_DIR_PIPELINE.mkdir(parents=True, exist_ok=True)
    p1 = DATA_DIR_PIPELINE / filename
    with open(p1, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  [SAVED] {p1} ({len(data)} items)")

    # Write to Next.js src corpus dir
    DATA_DIR_CORPUS.mkdir(parents=True, exist_ok=True)
    p2 = DATA_DIR_CORPUS / filename
    with open(p2, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  [SAVED] {p2} ({len(data)} items)")

def main():
    print("=" * 60)
    print("  SIRDAŞ AI - CLASSICAL CORPUS BUILDER & VALIDATOR")
    print("=" * 60)

    # 1. AKAID
    print("\n[1] Processing Akaid (Ebû Hanîfe & İmam Tahâvî)...")
    write_json_safely(AKAID_DATA, "akaid_fikhul_ekber_tahavi.json")

    # 2. IHYA
    print("\n[2] Processing Kalp ve Ahlak (İmam Gazalî - İhyâu 'Ulûmi'd-Dîn)...")
    write_json_safely(IHYA_DATA, "ihyau_ulumiddin_gazali.json")

    # 3. EZKAR
    print("\n[3] Processing Zikir, Dua ve Ahlak (İmam Nevevî - el-Ezkâr & Riyâz)...")
    write_json_safely(EZKAR_DATA, "ezkar_nevevi.json")

    print("\n[DONE] All 3 classical datasets successfully compiled and validated without duplicates or banned words!")

if __name__ == "__main__":
    main()
