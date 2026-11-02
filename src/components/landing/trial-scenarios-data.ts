export interface Scenario {
  num: string;
  title: string;
  shortLabel: string;
  time: string;
  userText: string;
  userTime: string;
  ayah: string;
  reply: string;
  focusNote: string;
  botTime: string;
}

export const SCENARIOS_DATA: Scenario[] = [
  {
    num: "01",
    title: "Gece Seherinde Kaygı ve Uykusuzluk",
    shortLabel: "Seher Kaygısı",
    time: "03:18 Gece",
    userText:
      "Gece yarısı oldu, uyuyamıyorum. İçimde geleceğe dair tarifsiz bir kaygı ve ağırlık var, göğsüm daralıyor...",
    userTime: "03:18",
    ayah: "“Rabbin seni terk etmedi, sana darılmadı da...” (Duhâ Suresi, 3)",
    reply:
      "Gecenin sükûtu feryadını dinleyecek tek makamın huzurudur. Şu an hissettiğin o sıkışma, dünyanın fani yüklerini tek başına taşıyamayacağının işaretidir. Abdest alıp iki rekat hacet namazı kılmayı, sonra başını secdeye koyup tüm yükü O’na havale etmeyi dener misin?",
    focusNote: "Ruhsal sakinleşme ve gönül ferahlığı",
    botTime: "03:20",
  },
  {
    num: "02",
    title: "Haksızlık & İftira Acısı",
    shortLabel: "Haksızlık & İftira",
    time: "14:12 Öğle",
    userText:
      "İş yerinde hiç yapmadığım bir hatayla suçlandım, iftira atıldı. Kalbim kin ve intikam ateşiyle yanıyor, haksızlığa tahammül edemiyorum...",
    userTime: "14:12",
    ayah: "“Sabret; senin sabrın ancak Allah’ın yardımı iledir. Onlar için üzülme, kurdukları tuzaklardan ötürü de sıkıntıya düşme.” (Nahl Suresi, 127)",
    reply:
      "Haklıyken zulme uğramak nefsi en çok inciten imtihandır. Fakat intikam ateşi en çok sahibinin sinesini yakar. El-Adl olan Allah zerre kadar kul hakkını zayi etmez. Davanı O’na havale et; mazlumun duası ile Rabbin arasında perde yoktur.",
    focusNote: "Adalet teslimiyeti ve kalbi mizan",
    botTime: "14:14",
  },
  {
    num: "03",
    title: "Rızık Darlığı & Borç Bunalımı",
    shortLabel: "Rızık & Borç",
    time: "19:40 Akşam",
    userText:
      "Ay sonunu getiremiyorum, borçlar birikti. Aileme mahcup olmaktan ve yarından çok korkuyorum... Ne yapacağımı şaşırdım.",
    userTime: "19:40",
    ayah: "“Yeryüzünde yürüyen hiçbir canlı yoktur ki, rızkı Allah’a ait olmasın...” (Hûd Suresi, 6)",
    reply:
      "Rızık kaygısı imanın en nazik imtihanlarından biridir. Sen sebeplere gayretle sarıl, israf ve haramdan sakın; fakat kalbini rızkın yaratıcısına teslim et. Bir kapıyı kapatan Allah, akla hayale gelmeyecek kapıları açmaya kâdirdir.",
    focusNote: "Tevekkül ve Rezzâk-ı Mutlak bilinci",
    botTime: "19:42",
  },
  {
    num: "04",
    title: "Kayıp & Hüzün İmtihanı",
    shortLabel: "Kayıp & Hüzün",
    time: "22:15 Yatsı",
    userText:
      "Çok sevdiğim bir yakınımı kaybettim. Evdeki her şey onu hatırlatıyor, içimdeki boşluk hiç dolmayacak gibi geliyor...",
    userTime: "22:15",
    ayah: "“Biz şüphesiz Allah’a aidiz ve şüphesiz O’na döneceğiz.” (Bakara Suresi, 156)",
    reply:
      "Acın çok taze ve kalbinin kanaması fıtridir; hüznü bastırmak değil, Rahman’a emanet etmek vaktidir. Ayrılık ebedi değil, dünya hanındaki kısa bir vedadır. Sabr-ı cemil ile dua ve istiğfara sarıl; sevdiklerine yapacağın en güzel hediye arkalarından göndereceğin salih amellerdir.",
    focusNote: "Sabr-ı Cemil ve Vuslat ümidi",
    botTime: "22:17",
  },
  {
    num: "05",
    title: "Tükenmişlik & Yalnızlık",
    shortLabel: "Tükenmişlik & Yalnızlık",
    time: "16:45 İkindi",
    userText:
      "Her şey üstüme geliyor, kimseden fayda yok. İçimde derin bir yalnızlık ve tükenmişlik hissediyorum...",
    userTime: "16:45",
    ayah: "“Elbette zorlukla beraber bir kolaylık vardır. Gerçekten zorlukla beraber bir kolaylık vardır.” (İnşirah Suresi, 5-6)",
    reply:
      "Tükenmişlik hissettiğin an, kendi aczini fark edip sonsuz kudret sahibine iltica etme vaktidir. Yalnız değilsin; şah damarından daha yakın olan Rabbin seninledir. Göğsünü daraltan yükleri tek tek bırak, niyetini tazele ve bir hayırla meşgul olarak kalbine nefes aldır.",
    focusNote: "İnşirah ve içsel ferahlık",
    botTime: "16:47",
  },
];

export const EXAMPLE_TOPICS = [
  {
    label: "Rızık ve borç darlığı",
    text: "Borçlarım birikti, çıkış yolu bulamıyorum. Aileme mahcup olmaktan çok korkuyorum, kalbim daralıyor...",
  },
  {
    label: "Gece seherinde kaygı",
    text: "Gece yarısı oldu uyuyamıyorum. İçimde geleceğe dair tarifsiz bir ağırlık var, gönlüm huzur bulmuyor...",
  },
  {
    label: "Haksızlık ve kırgınlık",
    text: "En güvendiğim insanlar tarafından haksızlığa uğradım. İçimdeki öfke ve kırgınlığı bir türlü dindiremiyorum...",
  },
];
