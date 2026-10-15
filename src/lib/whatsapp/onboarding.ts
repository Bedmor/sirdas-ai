import { User } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { WhatsAppClient } from "@/lib/whatsapp/client";

export async function handleOnboardingMessage(
  user: User,
  incomingText: string,
  messageId: string,
  wa: WhatsAppClient
): Promise<void> {
  const step = user.onboardingStep;
  const metadata = (user.profileMetadata as any) || {};

  switch (step) {
    case 1: {
      const lower = incomingText.trim().toLowerCase();
      const isGreeting = [
        "merhaba",
        "selam",
        "selamun aleykum",
        "selamün aleyküm",
        "merhaba",
        "sa",
        "s.a",
        "s.a.",
        "iyi günler",
        "başla",
        "sohbet"
      ].some(g => lower === g || lower.startsWith(g));

      if (isGreeting && !lower.includes("evli") && !lower.includes("bekar") && !lower.includes("çalış")) {
        await wa.sendTextMessage(
          user.phoneNumber,
          "Ve Aleykum Selam aziz kardeşim. Sırdaş AI dijital odana hoş geldin.\n\n" +
            "Seninle dertleşmeye geçmeden önce, nefsine ve haline en doğru aynayı tutabilmemiz için 4 kısa sorumuz olacak.\n\n" +
            "1. Adım — Sosyal sorumlulukların nelerdir?\n" +
            "(Örneğin: Evli misin, çocuğun var mı, esnaf veya çalışan mısın, bakmakla yükümlü olduğun yaşlı/hasta bir büyüğün var mı?)"
        );
        return;
      }

      // 1. Blok: Sosyal Sorumluluk Rolleri
      metadata.roles = parseRolesFromText(incomingText);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          onboardingStep: 2,
          profileMetadata: metadata
        }
      });
      await wa.sendTextMessage(
        user.phoneNumber,
        "Allah yükünü hafifletsin, mesuliyetlerini bereketlendirsin aziz sırdaşım.\n\n" +
          "2. Adım — Seni dünyada en çok yoklayan nefis zaafın veya zihnini meşgul eden imtihan nedir?\n" +
          "(Örneğin: Ani öfke ve parlama, rızık ve gelecek kaygısı, başarısızlık korkusu veya 'elalem ne der' endişesi)"
      );
      break;
    }
    case 2: {
      // 2. Blok: Ruhsal İmtihan Etiketleri
      metadata.spiritual_trials = parseTrialsFromText(incomingText);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          onboardingStep: 3,
          profileMetadata: metadata
        }
      });
      await wa.sendTextMessage(
        user.phoneNumber,
        "Rabbim kalbini ferahlatsın, vesveseleri senden uzaklaştırsın.\n\n" +
          "3. Adım — Sabahları dinç uyanabiliyor musun? Gün içinde kronik bir yorgunluğun, uykusuzluğun veya bedenini zorlayan bir rahatsızlığın var mı?\n" +
          "(Bunu sana ileride vereceğimiz fiili dua ve tefekkür ödevlerinde takatini gözetmek için soruyorum)"
      );
      break;
    }
    case 3: {
      // 3. Blok: Biyolojik Enerji Durumu
      metadata.biological_energy = parseEnergyFromText(incomingText);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          onboardingStep: 4,
          profileMetadata: metadata
        }
      });
      await wa.sendTextMessage(
        user.phoneNumber,
        "Şâfî olan Rabbim bedenine afiyet, ruhuna sekinet versin.\n\n" +
          "Son Adım — Sana nasıl ayna tutayım?\n\n" +
          "A) 'Şefkatli ve teskin edici bir dost diliyle' (Hüsn-ü zan, sükunet ve yumuşak üslup)\n" +
          "B) 'Nefsle doğrudan yüzleştiren tavizsiz bir muallim diliyle' (Net, mert ve hakikati doğrudan hatırlatan üslup)\n\n" +
          "Lütfen A veya B yazarak tercihini belirt."
      );
      break;
    }
    case 4: {
      // 4. Blok: Hitabet / Üslup Tercihi ve Tamamlanma
      const lower = incomingText.toLowerCase();
      const isMuallim = lower.includes("b") || lower.includes("muallim") || lower.includes("tavizsiz");
      metadata.tone_preference = isMuallim ? "TAVIZSIZ_MUALLIM" : "SEFKATLI_TESKIN";

      await prisma.user.update({
        where: { id: user.id },
        data: {
          onboardingCompleted: true,
          profileMetadata: metadata,
          lastActiveAt: new Date()
        }
      });

      await wa.sendTextMessage(
        user.phoneNumber,
        "Hoş safa geldin aziz kardeşim. Dijital sır odan hazır.\n\n" +
          "Ben senin nefsine ayna tutan, seni Kur'an, Sünnet ve Halis Aydemir hocamızın tefekkürleriyle İlahi rızaya çağıran sırdaşınım.\n\n" +
          "Gönlünü daraltan, uykunu kaçıran, ailende veya işinde seni zorlayan ne varsa dilediğin gibi yazabilirsin. Seni dinliyorum..."
      );
      break;
    }
    default: {
      await prisma.user.update({
        where: { id: user.id },
        data: { onboardingCompleted: true }
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

export function parseRolesFromText(text: string): string[] {
  const roles: string[] = [];
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
  if (l.includes("öğrenci") || l.includes("ogrenci") || l.includes("üniversite")) roles.push("OGRENCI");
  if (
    l.includes("anne") ||
    l.includes("baba") ||
    l.includes("hasta") ||
    l.includes("bakım") ||
    l.includes("bakim")
  )
    roles.push("HASTA_BAKIMI");
  if (roles.length === 0) roles.push("BELIRTILMEMIS_SORUMLULUK");
  return roles;
}

export function parseTrialsFromText(text: string): string[] {
  const trials: string[] = [];
  const l = normalizeTurkish(text);
  if (l.includes("öfke") || l.includes("ofke") || l.includes("sinir") || l.includes("parlama"))
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
    l.includes("insanlar")
  )
    trials.push("ELALEM_NE_DER_RIYA");
  if (
    l.includes("hayır diyeme") ||
    l.includes("hayir diyeme") ||
    l.includes("hayır") ||
    l.includes("çekin") ||
    l.includes("cekin")
  )
    trials.push("HAYIR_DIYEMEME");
  if (l.includes("korku") || l.includes("başarısız") || l.includes("basarisiz"))
    trials.push("BASARISIZLIK_KORKUSU");
  if (trials.length === 0) trials.push("GENEL_DUNYA_VESVESESI");
  return trials;
}

export function parseEnergyFromText(text: string): string[] {
  const energy: string[] = [];
  const l = normalizeTurkish(text);
  if (l.includes("uyan") || l.includes("sabah kalk") || l.includes("kalkamı"))
    energy.push("SABAH_ZOR_UYANMA");
  if (l.includes("yorgun") || l.includes("halsiz") || l.includes("tüken") || l.includes("tuken"))
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
  if (l.includes("dinç") || l.includes("dinc") || l.includes("iyiyim") || l.includes("şükür"))
    energy.push("DINÇ_ENERJIK");
  if (energy.length === 0) energy.push("ORTALAMA_ENERJI");
  return energy;
}
