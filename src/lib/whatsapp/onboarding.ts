import { Prisma, User } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { WhatsAppClient } from "@/lib/whatsapp/client";
import { TonePreference, SpiritualStage } from "@/lib/ai/jev-client";

export type UserRoleTag =
  | "EVLI"
  | "BEKAR"
  | "COCUK_SAHIBI"
  | "ESNAF"
  | "CALISAN"
  | "OGRENCI"
  | "HASTA_BAKIMI"
  | "YONETICI_LIDER"
  | "EMEKLI"
  | "EV_HANIMI"
  | "IS_ARAYAN"
  | "YURTDISI_GURBETCI"
  | "BELIRTILMEMIS_SORUMLULUK";

export type SpiritualTrialTag =
  | "ANI_OFKE"
  | "RIZIK_VE_GELECEK_KAYGISI"
  | "ELALEM_NE_DER_RIYA"
  | "HAYIR_DIYEMEME"
  | "BASARISIZLIK_KORKUSU"
  | "KADERE_ITIRAZ_VE_ISYAN"
  | "ACELECI_TALEPLER_VE_ISTIACAL"
  | "ZAHIRE_ALDANMA_VE_SEBEP_PERESTLIK"
  | "UCUB_VE_AMELINE_GUVENME"
  | "KONTROL_YANILSAMASI_VE_MUKEMMELIYETCILIK"
  | "GIZLI_SIRK_VE_SAHTE_SIGINAKLAR"
  | "SUI_ZAN_VE_TECESSUS"
  | "MINNET_VE_BASA_KAKMA"
  | "KAYITSIZLIK_VE_MERHAMETSIZLIK"
  | "GECMISIN_PISMANLIK_GIRDABI"
  | "TUL_I_EMEL_VE_GAYETSIZLIK"
  | "VESVESE_VE_GUSUL_ABDEST_EVHAMI"
  | "REHAVET_TEMBELLIK"
  | "GENEL_DUNYA_VESVESESI";

export type BiologicalEnergyTag =
  | "SABAH_ZOR_UYANMA"
  | "KRONIK_YORGUNLUK"
  | "BEDENSEL_RAHATSIZLIK"
  | "DINÇ_ENERJIK"
  | "UYKUSUZLUK_VE_GECE_DARALMASI"
  | "ZIHINSEL_TUKENMISLIK_BURNOUT"
  | "SEHER_VAKTI_ACIK_ZIHIN"
  | "ORTALAMA_ENERJI";

export interface OnboardingProfileMetadata {
  roles?: UserRoleTag[];
  spiritual_trials?: SpiritualTrialTag[];
  spiritual_stage?: SpiritualStage;
  biological_energy?: BiologicalEnergyTag[];
  tone_preference?: TonePreference;
  [key: string]: unknown;
}

async function persistOnboardingStep(params: {
  user: User;
  incomingText: string;
  messageId: string;
  replyText: string;
  nextStep?: number;
  completed?: boolean;
  metadata: OnboardingProfileMetadata;
  wa: WhatsAppClient;
}): Promise<void> {
  const {
    user,
    incomingText,
    messageId,
    replyText,
    nextStep,
    completed = false,
    metadata,
    wa,
  } = params;

  await prisma.$transaction([
    prisma.message.create({
      data: {
        waMessageId: messageId,
        userId: user.id,
        role: "USER",
        content: incomingText,
      },
    }),
    prisma.message.create({
      data: {
        userId: user.id,
        role: "ASSISTANT",
        content: replyText,
      },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: {
        ...(nextStep !== undefined ? { onboardingStep: nextStep } : {}),
        ...(completed
          ? { onboardingCompleted: true, lastActiveAt: new Date() }
          : {}),
        profileMetadata: metadata as Prisma.InputJsonValue,
      },
    }),
  ]);

  await wa.sendTextMessage(user.phoneNumber, replyText);
}

export async function handleOnboardingMessage(
  user: User,
  incomingText: string,
  messageId: string,
  wa: WhatsAppClient
): Promise<void> {
  if (messageId) {
    const existing = await prisma.message.findUnique({
      where: { waMessageId: messageId },
    });
    if (existing) {
      console.log(
        `[Onboarding Idempotency] ${messageId} daha önce işlenmiş, atlanıyor.`
      );
      return;
    }
  }

  const step = user.onboardingStep;
  const metadata: OnboardingProfileMetadata =
    user.profileMetadata &&
    typeof user.profileMetadata === "object" &&
    !Array.isArray(user.profileMetadata)
      ? { ...(user.profileMetadata as OnboardingProfileMetadata) }
      : {};

  switch (step) {
    case 1: {
      const lower = incomingText.trim().toLowerCase();
      const isGreeting = [
        "merhaba",
        "selam",
        "selamun aleykum",
        "selamün aleyküm",
        "sa",
        "s.a",
        "s.a.",
        "iyi günler",
        "başla",
        "sohbet",
      ].some((g) => lower === g || lower.startsWith(g));

      if (
        isGreeting &&
        !lower.includes("evli") &&
        !lower.includes("bekar") &&
        !lower.includes("çalış")
      ) {
        await wa.sendTextMessage(
          user.phoneNumber,
          "Ve Aleykum Selam aziz kardeşim. Manevi Pusula dijital odana hoş geldin.\n\n" +
            "Seninle dertleşmeye geçmeden önce, nefsine ve haline en doğru aynayı tutabilmemiz için 4 kısa sorumuz olacak.\n\n" +
            "1. Adım — Sosyal sorumlulukların nelerdir?\n" +
            "(Örneğin: Evli misin, çocuğun var mı, esnaf veya çalışan mısın, bakmakla yükümlü olduğun yaşlı/hasta bir büyüğün var mı?)"
        );
        return;
      }

      metadata.roles = parseRolesFromText(incomingText);
      const reply1 =
        "Allah yükünü hafifletsin, mesuliyetlerini bereketlendirsin aziz kardeşim.\n\n" +
        "2. Adım — Seni dünyada en çok yoklayan nefis zaafın veya zihnini meşgul eden imtihan nedir?\n" +
        "(Örneğin: Ani öfke ve parlama, rızık ve gelecek kaygısı, geçmiş pişmanlıkları, kontrol kaygısı, vesvese veya 'elalem ne der' endişesi)";

      await persistOnboardingStep({
        user,
        incomingText,
        messageId,
        replyText: reply1,
        nextStep: 2,
        metadata,
        wa,
      });
      break;
    }
    case 2: {
      metadata.spiritual_trials = parseTrialsFromText(incomingText);
      metadata.spiritual_stage = parseSpiritualStageFromText(incomingText);
      const reply2 =
        "Rabbim kalbini ferahlatsın, vesveseleri senden uzaklaştırsın.\n\n" +
        "3. Adım — Sabahları dinç uyanabiliyor musun? Gün içinde kronik bir yorgunluğun, uykusuzluğun veya bedenini zorlayan bir rahatsızlığın var mı?\n" +
        "(Bunu sana ileride vereceğimiz fiili dua ve tefekkür ödevlerinde takatini gözetmek için soruyorum)";

      await persistOnboardingStep({
        user,
        incomingText,
        messageId,
        replyText: reply2,
        nextStep: 3,
        metadata,
        wa,
      });
      break;
    }
    case 3: {
      metadata.biological_energy = parseEnergyFromText(incomingText);
      const reply3 =
        "Şâfî olan Rabbim bedenine afiyet, ruhuna ferahlık versin.\n\n" +
        "Son Adım — Sana nasıl ayna tutayım?\n\n" +
        "A) 'Şefkatli ve teskin edici bir dost diliyle' (Yaralı gönüllere şefkat ve İnşirah esintisi - SEFKATLI_TESKIN)\n" +
        "B) 'Nefsle doğrudan yüzleştiren net bir muallim diliyle' (Hakkı dosdoğru, tavizsiz önüne koyan vakar - NET_VE_MUALLIM)\n" +
        "C) 'Diriliş ve gayret aşılayan dinamik üslupla' (Atalet ve rehaveti kıran sorumluluk dili - DIRILIS_VE_GAYRET)\n" +
        "D) 'Hikmetli sükût ve tefekkür diliyle' (Az, öz bir ayet ve derin bir soruyla düşündüren arifane dil - HIKMETLI_SUKUT)\n\n" +
        "Lütfen A, B, C veya D yazarak tercihini belirt.";

      await persistOnboardingStep({
        user,
        incomingText,
        messageId,
        replyText: reply3,
        nextStep: 4,
        metadata,
        wa,
      });
      break;
    }
    case 4: {
      metadata.tone_preference = parseTonePreferenceFromText(incomingText);
      if (!metadata.spiritual_stage) {
        metadata.spiritual_stage = parseSpiritualStageFromText(incomingText);
      }

      const reply4 =
        "Hoş safa geldin aziz kardeşim. Dijital odan hazır.\n\n" +
        "Ben senin nefsine ayna tutan, seni Kur'an ve Sünnet-i Seniyye tefekkürleriyle İlahi rızaya çağıran manevi pusulanım.\n\n" +
        "Gönlünü daraltan, uykunu kaçıran, ailende veya işinde seni zorlayan ne varsa dilediğin gibi yazabilirsin. Seni dinliyorum...";

      await persistOnboardingStep({
        user,
        incomingText,
        messageId,
        replyText: reply4,
        completed: true,
        metadata,
        wa,
      });
      break;
    }
    default: {
      await prisma.user.update({
        where: { id: user.id },
        data: { onboardingCompleted: true },
      });
      break;
    }
  }
}

export function normalizeTurkish(text: string): string {
  return text
    .replace(/İ/g, "i")
    .replace(/I/g, "ı")
    .replace(/Ğ/g, "ğ")
    .replace(/Ü/g, "ü")
    .replace(/Ş/g, "ş")
    .replace(/Ö/g, "ö")
    .toLowerCase();
}

export function parseTonePreferenceFromText(text: string): TonePreference {
  const l = normalizeTurkish(text.trim());
  if (l.includes("tavizsiz")) return "TAVIZSIZ_MUALLIM";
  if (
    l === "c" ||
    l.startsWith("c ") ||
    l.startsWith("c-") ||
    l.includes("diriliş") ||
    l.includes("dirilis") ||
    l.includes("gayret")
  ) {
    return "DIRILIS_VE_GAYRET";
  }
  if (
    l === "d" ||
    l.startsWith("d ") ||
    l.startsWith("d-") ||
    l.includes("sükut") ||
    l.includes("sukut") ||
    l.includes("arifane") ||
    l.includes("hikmetli")
  ) {
    return "HIKMETLI_SUKUT";
  }
  if (
    l === "b" ||
    l.startsWith("b ") ||
    l.startsWith("b-") ||
    l.includes("muallim") ||
    l.includes("net")
  ) {
    return "NET_VE_MUALLIM";
  }
  return "SEFKATLI_TESKIN";
}

export function parseSpiritualStageFromText(text: string): SpiritualStage {
  const l = normalizeTurkish(text);
  if (
    l.includes("bunalım") ||
    l.includes("bunalim") ||
    l.includes("elimden tut") ||
    l.includes("dayanam") ||
    l.includes("tükendim")
  ) {
    return "DARLIK_VE_BUNALIM";
  }
  if (
    l.includes("tasavvuf") ||
    l.includes("murakabe") ||
    l.includes("tefekkür") ||
    l.includes("salik") ||
    l.includes("ihlas")
  ) {
    return "DERINLESMIS_SALIK";
  }
  if (
    l.includes("tövbe") ||
    l.includes("tevbe") ||
    l.includes("pişman") ||
    l.includes("pisman") ||
    l.includes("günah")
  ) {
    return "MUHASEBE_VE_TEVBE";
  }
  if (
    l.includes("istikamet") ||
    l.includes("düzenli") ||
    l.includes("namazlarımı")
  ) {
    return "ISTIKAMET_VE_INSA";
  }
  return "ARAYIS_VE_BASLANGIC";
}

export function parseRolesFromText(text: string): UserRoleTag[] {
  const roles: UserRoleTag[] = [];
  const l = normalizeTurkish(text);
  if (l.includes("evli")) roles.push("EVLI");
  if (l.includes("bekar") || l.includes("bekâr")) roles.push("BEKAR");
  if (
    l.includes("çocuk") ||
    l.includes("cocuk") ||
    l.includes("çocuğ") ||
    l.includes("cocug") ||
    l.includes("evlat") ||
    l.includes("evlad") ||
    l.includes("oğlum") ||
    l.includes("oglum") ||
    l.includes("kızım") ||
    l.includes("kizim")
  )
    roles.push("COCUK_SAHIBI");
  if (
    l.includes("esnaf") ||
    l.includes("ticaret") ||
    l.includes("dükkan") ||
    l.includes("dukkan") ||
    l.includes("marangoz") ||
    l.includes("pazarcı") ||
    l.includes("ustay")
  )
    roles.push("ESNAF");
  if (
    l.includes("memur") ||
    l.includes("çalışan") ||
    l.includes("calisan") ||
    l.includes("işçi") ||
    l.includes("isci")
  )
    roles.push("CALISAN");
  if (
    l.includes("öğrenci") ||
    l.includes("ogrenci") ||
    l.includes("üniversite")
  )
    roles.push("OGRENCI");
  if (
    l.includes("hasta bak") ||
    l.includes("anneme bak") ||
    l.includes("babama bak") ||
    l.includes("yaşlı bak") ||
    l.includes("yasli bak") ||
    l.includes("engelli bak") ||
    ((l.includes("anne") || l.includes("baba") || l.includes("hasta")) &&
      (l.includes("bakım") || l.includes("bakim")))
  )
    roles.push("HASTA_BAKIMI");
  if (
    l.includes("yönetici") ||
    l.includes("yonetici") ||
    l.includes("müdür") ||
    l.includes("mudur") ||
    l.includes("patron")
  )
    roles.push("YONETICI_LIDER");
  if (l.includes("emekli")) roles.push("EMEKLI");
  if (l.includes("ev hanımı") || l.includes("ev hanimi"))
    roles.push("EV_HANIMI");
  if (l.includes("işsiz") || l.includes("issiz") || l.includes("iş arıyorum"))
    roles.push("IS_ARAYAN");
  if (
    l.includes("gurbet") ||
    l.includes("yurtdışı") ||
    l.includes("yurtdisi")
  )
    roles.push("YURTDISI_GURBETCI");
  if (roles.length === 0) roles.push("BELIRTILMEMIS_SORUMLULUK");
  return roles;
}

export function parseTrialsFromText(text: string): SpiritualTrialTag[] {
  const trials: SpiritualTrialTag[] = [];
  const l = normalizeTurkish(text);
  if (
    l.includes("öfke") ||
    l.includes("ofke") ||
    l.includes("sinir") ||
    l.includes("parlama")
  )
    trials.push("ANI_OFKE");
  if (
    l.includes("rızık") ||
    l.includes("rizik") ||
    l.includes("para") ||
    l.includes("gelecek") ||
    l.includes("kaygı") ||
    l.includes("kaygi") ||
    l.includes("borç")
  )
    trials.push("RIZIK_VE_GELECEK_KAYGISI");
  if (
    l.includes("elalem") ||
    l.includes("onay") ||
    l.includes("insanlar ne der") ||
    l.includes("başkaları ne der") ||
    l.includes("riya")
  )
    trials.push("ELALEM_NE_DER_RIYA");
  if (
    l.includes("hayır diyem") ||
    l.includes("hayir diyem") ||
    l.includes("hayır deme") ||
    l.includes("hayir deme") ||
    l.includes("kıramıyorum") ||
    l.includes("kiramiyorum") ||
    l.includes("kıramam") ||
    l.includes("çekin") ||
    l.includes("cekin")
  )
    trials.push("HAYIR_DIYEMEME");
  if (
    l.includes("korku") ||
    l.includes("başarısız") ||
    l.includes("basarisiz")
  )
    trials.push("BASARISIZLIK_KORKUSU");
  if (
    l.includes("kader") ||
    l.includes("isyan") ||
    l.includes("neden hep ben")
  )
    trials.push("KADERE_ITIRAZ_VE_ISYAN");
  if (
    l.includes("acele") ||
    l.includes("hemen olsun") ||
    l.includes("sabırsız")
  )
    trials.push("ACELECI_TALEPLER_VE_ISTIACAL");
  if (l.includes("sebepler") || l.includes("torpil"))
    trials.push("ZAHIRE_ALDANMA_VE_SEBEP_PERESTLIK");
  if (l.includes("ucub") || l.includes("beğenme") || l.includes("amelime"))
    trials.push("UCUB_VE_AMELINE_GUVENME");
  if (
    l.includes("kontrol") ||
    l.includes("mükemmeliyet") ||
    l.includes("mukemmeliyet")
  )
    trials.push("KONTROL_YANILSAMASI_VE_MUKEMMELIYETCILIK");
  if (
    l.includes("bağımlı") ||
    l.includes("bagimli") ||
    l.includes("haramda teselli")
  )
    trials.push("GIZLI_SIRK_VE_SAHTE_SIGINAKLAR");
  if (
    l.includes("sui zan") ||
    l.includes("kötü niyet") ||
    l.includes("kuruntu")
  )
    trials.push("SUI_ZAN_VE_TECESSUS");
  if (
    l.includes("minnet") ||
    l.includes("başa kak") ||
    l.includes("basa kak")
  )
    trials.push("MINNET_VE_BASA_KAKMA");
  if (
    l.includes("kalp katı") ||
    l.includes("merhametsiz") ||
    l.includes("kayıtsız")
  )
    trials.push("KAYITSIZLIK_VE_MERHAMETSIZLIK");
  if (
    l.includes("geçmiş") ||
    l.includes("gecmis") ||
    l.includes("pişman") ||
    l.includes("pisman")
  )
    trials.push("GECMISIN_PISMANLIK_GIRDABI");
  if (
    l.includes("tul-i emel") ||
    l.includes("hiç ölmeyecek") ||
    l.includes("dünyaya dal")
  )
    trials.push("TUL_I_EMEL_VE_GAYETSIZLIK");
  if (
    l.includes("vesvese") ||
    l.includes("gusül") ||
    l.includes("abdest") ||
    l.includes("evham")
  )
    trials.push("VESVESE_VE_GUSUL_ABDEST_EVHAMI");
  if (l.includes("tembel") || l.includes("rehavet") || l.includes("ertele"))
    trials.push("REHAVET_TEMBELLIK");
  if (trials.length === 0) trials.push("GENEL_DUNYA_VESVESESI");
  return trials;
}

export function parseEnergyFromText(text: string): BiologicalEnergyTag[] {
  const energy: BiologicalEnergyTag[] = [];
  const l = normalizeTurkish(text);
  if (
    l.includes("zor uyan") ||
    l.includes("uyanam") ||
    l.includes("sabah kalk") ||
    l.includes("zor kalk") ||
    l.includes("kalkamı") ||
    l.includes("kalkami")
  )
    energy.push("SABAH_ZOR_UYANMA");
  if (
    l.includes("yorgun") ||
    l.includes("halsiz") ||
    l.includes("tüken") ||
    l.includes("tuken")
  )
    energy.push("KRONIK_YORGUNLUK");
  if (
    l.includes("ağrı") ||
    l.includes("agri") ||
    l.includes("rahatsız") ||
    l.includes("rahatsiz") ||
    l.includes("kronik") ||
    l.includes("belim") ||
    l.includes("başım")
  )
    energy.push("BEDENSEL_RAHATSIZLIK");
  if (l.includes("uykusuz") || l.includes("gece uyuyam"))
    energy.push("UYKUSUZLUK_VE_GECE_DARALMASI");
  if (
    l.includes("zihnim dolu") ||
    l.includes("burnout") ||
    l.includes("kafam kaldırmıyor")
  )
    energy.push("ZIHINSEL_TUKENMISLIK_BURNOUT");
  if (l.includes("seher") || l.includes("erken uyan"))
    energy.push("SEHER_VAKTI_ACIK_ZIHIN");
  if (
    l.includes("dinç") ||
    l.includes("dinc") ||
    l.includes("iyiyim") ||
    l.includes("şükür")
  )
    energy.push("DINÇ_ENERJIK");
  if (energy.length === 0) energy.push("ORTALAMA_ENERJI");
  return energy;
}
