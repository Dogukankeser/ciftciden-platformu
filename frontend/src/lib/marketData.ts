"use client"

export type ListingQuality = "Premium" | "1. Kalite" | "2. Kalite" | "Sanayi"

export type ProductListing = {
  id: string
  title: string
  category: string
  variety: string
  city: string
  district: string
  quantityKg: number
  pricePerKg: number
  priceType: "fixed" | "offer"
  description: string
  ownerId?: string
  ownerEmail?: string
  ownerPhoto?: string
  ownerName: string
  ownerRole: string
  ownerPhone: string
  createdAt: string
  harvestDate: string
  stockLocation: string
  grade: ListingQuality | string
  moisture?: string
  brix?: string
  size: string
  packaging: string
  delivery: string
  payment: string
  certificates: string[]
  imageUrls: string[]
  dynamic: Record<string, string>
  ai: {
    fairMin: number
    fairMax: number
    confidence: number
    qualityScore: number
    analysis: string
    risk: "Düşük" | "Orta" | "Yüksek"
    trustScore?: number
    listingComment?: string
    trustSource?: "gemini" | "local"
  }
  seller: {
    trustScore: number
    verified: boolean
    completedTrades: number
    responseTime: string
  }
  metrics: {
    views: number
    offers: number
    favorites: number
  }
}

export const LISTINGS_STORAGE_KEY = "ciftciden_listings"

export const PROVINCES = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin", "Aydın", "Balıkesir",
  "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli",
  "Diyarbakır", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane",
  "Hakkari", "Hatay", "Isparta", "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli",
  "Kırşehir", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla", "Muş",
  "Nevşehir", "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Tekirdağ", "Tokat",
  "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman",
  "Kırıkkale", "Batman", "Şırnak", "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce"
].sort((a, b) => a.localeCompare(b, "tr"))

export const CATEGORY_OPTIONS = [
  {
    slug: "kayısı",
    name: "Kayısı",
    unit: "kg",
    varieties: ["Hacıhaliloğlu", "Kabaaşı", "Hasanbey", "Çataloğlu", "Yaş Kayısı"],
    qualities: ["Premium", "1. Kalite", "2. Kalite", "Sanayi"],
  },
  {
    slug: "domates",
    name: "Domates",
    unit: "kg",
    varieties: ["Salkım", "Sırık", "Cherry", "Tarla", "Sofralık"],
    qualities: ["Premium", "1. Kalite", "2. Kalite", "Sanayi"],
  },
  {
    slug: "elma",
    name: "Elma",
    unit: "kg",
    varieties: ["Starking", "Golden", "Granny Smith", "Fuji", "Amasya"],
    qualities: ["Premium", "1. Kalite", "2. Kalite", "Sanayi"],
  },
  {
    slug: "buğday",
    name: "Buğday",
    unit: "kg",
    varieties: ["Ekmeklik", "Makarnalık", "Sert Anadolu"],
    qualities: ["Protein 13+", "Protein 12", "Yemlik"],
  },
  {
    slug: "üzüm",
    name: "Üzüm",
    unit: "kg",
    varieties: ["Sultani", "Çekirdeksiz", "Sofralık", "Şaraplık"],
    qualities: ["Premium", "1. Kalite", "2. Kalite"],
  },
  {
    slug: "antepfıstığı",
    name: "Antep Fıstığı",
    unit: "kg",
    varieties: ["Kırmızı Kabuk", "Boz İç", "Siirt", "Kavrulmalık"],
    qualities: ["Premium", "1. Kalite", "2. Kalite"],
  },
  {
    slug: "zeytin",
    name: "Zeytin",
    unit: "kg",
    varieties: ["Gemlik", "Domat", "Ayvalık", "Memecik"],
    qualities: ["Premium", "1. Kalite", "2. Kalite"],
  },
  {
    slug: "fındık",
    name: "Fındık",
    unit: "kg",
    varieties: ["Tombul", "Levant", "Sivri", "Palaz"],
    qualities: ["Premium", "1. Kalite", "2. Kalite"],
  },
]

export const MARKET_PRICE_TICKER = [
  { product: "Kayısı", variety: "Günkurusu", city: "Malatya", price: 198, change: 6.4, trend: "up" },
  { product: "Domates", variety: "Salkım", city: "Antalya", price: 24.5, change: -2.1, trend: "down" },
  { product: "Elma", variety: "Starking", city: "Isparta", price: 19.5, change: 3.8, trend: "up" },
  { product: "Buğday", variety: "Ekmeklik", city: "Konya", price: 11.4, change: 1.7, trend: "up" },
  { product: "Üzüm", variety: "Sultani", city: "Manisa", price: 34.8, change: 8.2, trend: "up" },
  { product: "Fındık", variety: "Tombul", city: "Ordu", price: 116, change: 4.9, trend: "up" },
  { product: "Zeytin", variety: "Gemlik", city: "Bursa", price: 48, change: 2.6, trend: "up" },
] as const

const commonPayment = "Kapora + teslim onayı sonrası ödeme"

const DEMO_IMAGES = {
  apricotDried: [
    "/images/apricot-dried-premium.jpg",
  ],
  apricotYellow: [
    "/images/apricot-yellow-premium.jpg",
  ],
  apricotFresh: [
    "/images/apricot-fresh-premium.jpg",
  ],
  tomatoVine: [
    "/images/tomato-vine-premium.jpg",
  ],
  tomatoField: [
    "/images/tomato-field-premium.jpg",
  ],
  appleRed: [
    "/images/apple-red-premium.jpg",
  ],
  appleGreen: [
    "/images/apple-green-premium.jpg",
  ],
  wheat: [
    "/images/wheat-grain-premium.jpg",
  ],
  grapes: [
    "/images/grapes-basket-premium.jpg",
  ],
  pistachio: [
    "/images/pistachio-kernel-premium.jpg",
  ],
  olive: [
    "/images/olive-black-premium.jpg",
  ],
  hazelnut: [
    "/images/hazelnut-shelled-premium.jpg",
  ],
}

export const SEED_LISTINGS: ProductListing[] = [
  {
    id: "seed-1",
    title: "Malatya Battalgazi 1. kalite Hacıhaliloğlu günkurusu kayısı",
    category: "kayısı",
    variety: "Hacıhaliloğlu",
    city: "Malatya",
    district: "Battalgazi",
    quantityKg: 8400,
    pricePerKg: 196,
    priceType: "fixed",
    description: "2026 sezonu, dalında tam olgunlukta toplanmış Hacıhaliloğlu günkurusu kayısı. Parti homojen, kükürt kullanılmadı, nem oranı depoda düzenli ölçülüyor. Tüccar için numune gönderimi ve kantar yüklemesi hazır.",
    ownerName: "Mehmet Yılmaz",
    ownerRole: "Üretici",
    ownerPhone: "0532 410 44 23",
    createdAt: "2026-05-16T08:30:00Z",
    harvestDate: "2026-07-18",
    stockLocation: "Battalgazi / Hanımınçiftliği soğuk depo",
    grade: "1. Kalite",
    moisture: "%17",
    size: "Jumbo / elek üstü",
    packaging: "25 kg kraft çuval, paletli yüklemeye uygun",
    delivery: "Alıcı nakliyesi veya Malatya içi kooperatif teslim",
    payment: commonPayment,
    certificates: ["İyi Tarım kaydı", "ÇKS uyumlu", "Kükürtsüz üretim beyanı"],
    imageUrls: DEMO_IMAGES.apricotDried,
    dynamic: { işlem: "Günkurusu", kalibre: "Jumbo", kurutma: "Doğal güneş" },
    ai: {
      fairMin: 188,
      fairMax: 207,
      confidence: 93,
      qualityScore: 91,
      analysis: "Hal fiyatı, önceki satışlar ve Malatya arz yoğunluğu ile fiyat adil aralıkta.",
      risk: "Düşük",
    },
    seller: { trustScore: 9.4, verified: true, completedTrades: 38, responseTime: "18 dk" },
    metrics: { views: 412, offers: 9, favorites: 31 },
  },
  {
    id: "seed-2",
    title: "Darende Kabaaşı sarı kayısı, ihracata uygun jumbo parti",
    category: "kayısı",
    variety: "Kabaaşı",
    city: "Malatya",
    district: "Darende",
    quantityKg: 3200,
    pricePerKg: 172,
    priceType: "fixed",
    description: "Kabaaşı çeşidi, iri kalibre ve açık renk parti. Seleksiyon sonrası taş, yaprak ve kırık oranı düşük. Özellikle ihracat ve paketleme hattı olan alıcılar için uygundur.",
    ownerName: "Hasan Demir",
    ownerRole: "Üretici",
    ownerPhone: "0544 221 10 88",
    createdAt: "2026-05-15T13:20:00Z",
    harvestDate: "2026-07-12",
    stockLocation: "Darende merkez depo",
    grade: "Premium",
    moisture: "%16",
    size: "Jumbo",
    packaging: "10 kg karton veya 25 kg çuval",
    delivery: "Kamyon yükleme rampası mevcut",
    payment: commonPayment,
    certificates: ["Analiz raporu hazırlanabilir", "ÇKS kaydı"],
    imageUrls: DEMO_IMAGES.apricotYellow,
    dynamic: { işlem: "Sarı Kayısı", kalibre: "Jumbo", renk: "Açık sarı" },
    ai: { fairMin: 164, fairMax: 181, confidence: 91, qualityScore: 94, analysis: "Premium kalibre fiyatı yukarı taşıyor; miktar orta ölçekli alım için ideal.", risk: "Düşük" },
    seller: { trustScore: 9.1, verified: true, completedTrades: 21, responseTime: "25 dk" },
    metrics: { views: 286, offers: 6, favorites: 18 },
  },
  {
    id: "seed-3",
    title: "Elazığ Baskil organik yaş kayısı, hasada hazır bahçe",
    category: "kayısı",
    variety: "Yaş Kayısı",
    city: "Elazığ",
    district: "Baskil",
    quantityKg: 6500,
    pricePerKg: 47,
    priceType: "offer",
    description: "Baskil bölgesinde organik geçiş sürecindeki bahçeden yaş kayısı. Alıcı isterse hasat günü bahçede eksper kontrolü yapılabilir. Meyve diri, çatlama oranı düşük, kasa ile sevkiyata uygun.",
    ownerName: "Emine Arslan",
    ownerRole: "Üretici",
    ownerPhone: "0538 120 77 91",
    createdAt: "2026-05-15T09:05:00Z",
    harvestDate: "2026-06-26",
    stockLocation: "Baskil / Kadıköy bahçe teslim",
    grade: "1. Kalite",
    brix: "16-18",
    size: "Orta-iri",
    packaging: "Alıcı kasası veya 8 kg plastik kasa",
    delivery: "Bahçe teslim, soğuk zincir aracı önerilir",
    payment: commonPayment,
    certificates: ["Organik geçiş beyanı", "ÇKS kaydı"],
    imageUrls: DEMO_IMAGES.apricotFresh,
    dynamic: { işlem: "Yaş Kayısı", kalibre: "Orta-iri", teslim: "Bahçe teslim" },
    ai: { fairMin: 42, fairMax: 51, confidence: 88, qualityScore: 87, analysis: "Yaş ürün olduğu için nakliye hızı fiyatı doğrudan etkiler.", risk: "Orta" },
    seller: { trustScore: 8.9, verified: true, completedTrades: 14, responseTime: "32 dk" },
    metrics: { views: 196, offers: 5, favorites: 14 },
  },
  {
    id: "seed-4",
    title: "Antalya Serik salkım domates, günlük kesim A kalite",
    category: "domates",
    variety: "Salkım",
    city: "Antalya",
    district: "Serik",
    quantityKg: 12500,
    pricePerKg: 24.5,
    priceType: "fixed",
    description: "Serik serasında günlük kesim salkım domates. Ürün sabah kesilip aynı gün sevkiyata hazırlanır. Zincir market ve hal alıcısı için düzenli haftalık tedarik yapılabilir.",
    ownerName: "Fatma Çelik",
    ownerRole: "Üretici",
    ownerPhone: "0535 640 18 36",
    createdAt: "2026-05-16T06:50:00Z",
    harvestDate: "2026-05-18",
    stockLocation: "Serik / Kadriye sera paketleme",
    grade: "1. Kalite",
    brix: "4.8",
    size: "M-L",
    packaging: "6 kg kasa, paletli",
    delivery: "Soğuk hava araçlarına uygun yükleme",
    payment: commonPayment,
    certificates: ["İyi Tarım", "Zirai ilaç kayıt defteri"],
    imageUrls: DEMO_IMAGES.tomatoVine,
    dynamic: { tür: "Sera", çeşit: "Salkım", kesim: "Günlük" },
    ai: { fairMin: 22, fairMax: 26, confidence: 90, qualityScore: 89, analysis: "Antalya hal bandı ve günlük kesim avantajı fiyatı destekliyor.", risk: "Düşük" },
    seller: { trustScore: 9.3, verified: true, completedTrades: 44, responseTime: "12 dk" },
    metrics: { views: 521, offers: 12, favorites: 27 },
  },
  {
    id: "seed-5",
    title: "Mersin Tarsus tarla domatesi, salçalık ve yemeklik karışık parti",
    category: "domates",
    variety: "Tarla",
    city: "Mersin",
    district: "Tarsus",
    quantityKg: 18000,
    pricePerKg: 18.7,
    priceType: "fixed",
    description: "Tarsus ovasından tarla domatesi. Ürün salçalık işleme ve yemeklik toptan satış için uygundur. Parti karışık olduğu için fiyat rekabetçi tutulmuştur.",
    ownerName: "Ali Kara",
    ownerRole: "Üretici",
    ownerPhone: "0541 998 02 14",
    createdAt: "2026-05-14T07:45:00Z",
    harvestDate: "2026-05-20",
    stockLocation: "Tarsus / Yenice tarla teslim",
    grade: "2. Kalite",
    brix: "5.1",
    size: "Karışık",
    packaging: "Dökme veya 12 kg kasa",
    delivery: "Tarla teslim, yükleme ekibi mevcut",
    payment: commonPayment,
    certificates: ["ÇKS kaydı"],
    imageUrls: DEMO_IMAGES.tomatoField,
    dynamic: { tür: "Tarla", çeşit: "Sofralık", kullanım: "Salçalık + yemeklik" },
    ai: { fairMin: 17, fairMax: 20, confidence: 86, qualityScore: 78, analysis: "Karışık kalite nedeniyle sabit fiyat makul; hızlı sevkiyat önemli.", risk: "Orta" },
    seller: { trustScore: 8.4, verified: true, completedTrades: 18, responseTime: "41 dk" },
    metrics: { views: 332, offers: 7, favorites: 12 },
  },
  {
    id: "seed-6",
    title: "Isparta Eğirdir Starking elma, soğuk hava deposunda seçilmiş parti",
    category: "elma",
    variety: "Starking",
    city: "Isparta",
    district: "Eğirdir",
    quantityKg: 22000,
    pricePerKg: 19.5,
    priceType: "fixed",
    description: "Eğirdir hattından Starking elma. Ürün soğuk hava deposunda, renk ve çap seçimi yapılmış. Market, manav zinciri ve ihracatçı alıcılar için düzenli parti çıkışı sağlanır.",
    ownerName: "Ahmet Özkan",
    ownerRole: "Üretici",
    ownerPhone: "0530 717 64 80",
    createdAt: "2026-05-13T16:10:00Z",
    harvestDate: "2025-10-04",
    stockLocation: "Eğirdir soğuk hava deposu",
    grade: "1. Kalite",
    size: "70-80 mm",
    packaging: "13 kg karton veya plastik kasa",
    delivery: "Depo teslim, frigorifik araç önerilir",
    payment: commonPayment,
    certificates: ["Depo sıcaklık kaydı", "ÇKS kaydı"],
    imageUrls: DEMO_IMAGES.appleRed,
    dynamic: { çeşit: "Starking", çap: "70-80 mm", depo: "Soğuk hava" },
    ai: { fairMin: 18, fairMax: 21, confidence: 89, qualityScore: 90, analysis: "Depo koşulları ve seçilmiş çap fiyatı stabil tutuyor.", risk: "Düşük" },
    seller: { trustScore: 9.0, verified: true, completedTrades: 27, responseTime: "36 dk" },
    metrics: { views: 244, offers: 4, favorites: 16 },
  },
  {
    id: "seed-7",
    title: "Niğde Granny Smith elma, ihracat kalibresi sert ve yeşil parti",
    category: "elma",
    variety: "Granny Smith",
    city: "Niğde",
    district: "Bor",
    quantityKg: 14000,
    pricePerKg: 23,
    priceType: "fixed",
    description: "Bor bölgesinden canlı yeşil renkli Granny Smith. Sertlik korunmuş, depoda çürüme oranı çok düşük. İhracatçı ve seçili market alıcısı için uygun kalite.",
    ownerName: "Zeynep Yıldız",
    ownerRole: "Üretici",
    ownerPhone: "0533 305 88 22",
    createdAt: "2026-05-12T11:40:00Z",
    harvestDate: "2025-10-11",
    stockLocation: "Bor / Organize depo",
    grade: "Premium",
    size: "75-85 mm",
    packaging: "Tek sıra karton, talebe göre viyol",
    delivery: "Depo teslim",
    payment: commonPayment,
    certificates: ["Analiz raporu", "Depo sıcaklık kaydı"],
    imageUrls: DEMO_IMAGES.appleGreen,
    dynamic: { çeşit: "Granny Smith", çap: "75-85 mm", renk: "Canlı yeşil" },
    ai: { fairMin: 21, fairMax: 25, confidence: 88, qualityScore: 92, analysis: "Premium kalibre ve düşük fire oranı fiyatı destekliyor.", risk: "Düşük" },
    seller: { trustScore: 8.8, verified: true, completedTrades: 16, responseTime: "52 dk" },
    metrics: { views: 191, offers: 3, favorites: 11 },
  },
  {
    id: "seed-8",
    title: "Konya Cihanbeyli ekmeklik buğday, protein 13.2, kantar hazır",
    category: "buğday",
    variety: "Ekmeklik",
    city: "Konya",
    district: "Cihanbeyli",
    quantityKg: 80000,
    pricePerKg: 11.4,
    priceType: "fixed",
    description: "2026 hasadı ekmeklik buğday. Protein ve hektolitre ölçümleri alıcıyla paylaşılabilir. Dökme yükleme ve kantar fişi hazır, büyük tonajlı alıcılar için tek parti avantajı var.",
    ownerName: "Recep Aslan",
    ownerRole: "Üretici",
    ownerPhone: "0552 832 30 01",
    createdAt: "2026-05-14T12:10:00Z",
    harvestDate: "2026-07-05",
    stockLocation: "Cihanbeyli lisanslı depo yakınında",
    grade: "Protein 13+",
    moisture: "%11.8",
    size: "Hektolitre 79",
    packaging: "Dökme",
    delivery: "Kamyon üstü yükleme",
    payment: commonPayment,
    certificates: ["Protein analizi", "Kantar fişi", "ÇKS kaydı"],
    imageUrls: DEMO_IMAGES.wheat,
    dynamic: { protein: "13.2", hektolitre: "79", teslim: "Dökme" },
    ai: { fairMin: 10.9, fairMax: 11.9, confidence: 92, qualityScore: 88, analysis: "Protein değeri ve tek parti tonaj fiyatı güçlendiriyor.", risk: "Düşük" },
    seller: { trustScore: 9.2, verified: true, completedTrades: 31, responseTime: "28 dk" },
    metrics: { views: 478, offers: 11, favorites: 22 },
  },
  {
    id: "seed-9",
    title: "Manisa Alaşehir Sultani üzüm, ihracatlık sofralık kalite",
    category: "üzüm",
    variety: "Sultani",
    city: "Manisa",
    district: "Alaşehir",
    quantityKg: 9500,
    pricePerKg: 34.8,
    priceType: "fixed",
    description: "Alaşehir bağlarından sofralık Sultani üzüm. Taneler iri, salkım formu düzgün. Ön soğutma ve kasa düzeni alıcının ihracat standardına göre hazırlanabilir.",
    ownerName: "Süleyman Tan",
    ownerRole: "Üretici",
    ownerPhone: "0539 610 25 44",
    createdAt: "2026-05-13T13:35:00Z",
    harvestDate: "2026-08-22",
    stockLocation: "Alaşehir bağ teslim",
    grade: "Premium",
    brix: "20+",
    size: "İri salkım",
    packaging: "5 kg ihracat kasası",
    delivery: "Ön soğutma sonrası sevkiyat",
    payment: commonPayment,
    certificates: ["GlobalGAP hazırlığı", "Zirai ilaç kayıt defteri"],
    imageUrls: DEMO_IMAGES.grapes,
    dynamic: { çeşit: "Sultani", kullanım: "Sofralık", brix: "20+" },
    ai: { fairMin: 32, fairMax: 38, confidence: 87, qualityScore: 91, analysis: "Sofralık kalite ve ihracat hazırlığı fiyatı artırıyor.", risk: "Düşük" },
    seller: { trustScore: 8.7, verified: true, completedTrades: 19, responseTime: "44 dk" },
    metrics: { views: 309, offers: 5, favorites: 19 },
  },
  {
    id: "seed-10",
    title: "Gaziantep Nizip kırmızı kabuk Antep fıstığı, seçilmiş kuru parti",
    category: "antepfıstığı",
    variety: "Kırmızı Kabuk",
    city: "Gaziantep",
    district: "Nizip",
    quantityKg: 1400,
    pricePerKg: 430,
    priceType: "offer",
    description: "Nizip bölgesinden kırmızı kabuk Antep fıstığı. Parti kuru, iri ve seçilmiş. Numune ile ön kontrol yapılabilir; yüksek değerli ürün olduğu için ödeme koşulları yazılı netleştirilir.",
    ownerName: "Hüseyin Kılıç",
    ownerRole: "Üretici",
    ownerPhone: "0546 707 19 63",
    createdAt: "2026-05-12T10:00:00Z",
    harvestDate: "2025-09-09",
    stockLocation: "Nizip güvenli depo",
    grade: "Premium",
    moisture: "%5.8",
    size: "İri",
    packaging: "50 kg jüt çuval",
    delivery: "Depo teslim, sigortalı nakliye önerilir",
    payment: commonPayment,
    certificates: ["Aflatoksin analizi talep üzerine", "ÇKS kaydı"],
    imageUrls: DEMO_IMAGES.pistachio,
    dynamic: { tür: "Kırmızı Kabuk", nem: "%5.8", analiz: "Talep üzerine" },
    ai: { fairMin: 405, fairMax: 455, confidence: 84, qualityScore: 90, analysis: "Yüksek değerli ürün; numune ve analiz fiyat pazarlığında belirleyici.", risk: "Orta" },
    seller: { trustScore: 8.6, verified: true, completedTrades: 11, responseTime: "1 sa" },
    metrics: { views: 536, offers: 14, favorites: 42 },
  },
  {
    id: "seed-11",
    title: "Bursa Gemlik sofralık zeytin, iri kalibre salamuralık",
    category: "zeytin",
    variety: "Gemlik",
    city: "Bursa",
    district: "Gemlik",
    quantityKg: 6100,
    pricePerKg: 48,
    priceType: "fixed",
    description: "Gemlik hattından salamuralık sofralık zeytin. İri kalibre oranı yüksek, hasat ve çizme süreci alıcı standardına göre organize edilebilir.",
    ownerName: "Murat Aksoy",
    ownerRole: "Üretici",
    ownerPhone: "0537 441 72 11",
    createdAt: "2026-05-11T15:45:00Z",
    harvestDate: "2026-10-18",
    stockLocation: "Gemlik / Kurşunlu bahçe teslim",
    grade: "1. Kalite",
    size: "201-230 kalibre",
    packaging: "Plastik kasa",
    delivery: "Bahçe teslim veya Bursa depo",
    payment: commonPayment,
    certificates: ["ÇKS kaydı", "Kooperatif üyeliği"],
    imageUrls: DEMO_IMAGES.olive,
    dynamic: { çeşit: "Gemlik", kullanım: "Sofralık", kalibre: "201-230" },
    ai: { fairMin: 45, fairMax: 52, confidence: 85, qualityScore: 86, analysis: "Sezon öncesi bağlantı için makul ön fiyat aralığı.", risk: "Orta" },
    seller: { trustScore: 8.5, verified: true, completedTrades: 10, responseTime: "55 dk" },
    metrics: { views: 156, offers: 2, favorites: 8 },
  },
  {
    id: "seed-12",
    title: "Ordu Fatsa tombul fındık, randıman 52, kuru ve seçilmiş",
    category: "fındık",
    variety: "Tombul",
    city: "Ordu",
    district: "Fatsa",
    quantityKg: 3000,
    pricePerKg: 116,
    priceType: "fixed",
    description: "Fatsa bölgesinden tombul fındık. Randıman 52, nem dengesi iyi, çuvallı depoda muhafaza ediliyor. Numune gönderimi yapılabilir.",
    ownerName: "Selma Aydın",
    ownerRole: "Üretici",
    ownerPhone: "0536 774 33 29",
    createdAt: "2026-05-10T09:30:00Z",
    harvestDate: "2025-08-24",
    stockLocation: "Fatsa merkez depo",
    grade: "1. Kalite",
    moisture: "%6.2",
    size: "Randıman 52",
    packaging: "80 kg jüt çuval",
    delivery: "Depo teslim",
    payment: commonPayment,
    certificates: ["Randıman raporu", "ÇKS kaydı"],
    imageUrls: DEMO_IMAGES.hazelnut,
    dynamic: { çeşit: "Tombul", randıman: "52", nem: "%6.2" },
    ai: { fairMin: 110, fairMax: 121, confidence: 90, qualityScore: 89, analysis: "Randıman ve düşük nem fiyat aralığını güçlü kılıyor.", risk: "Düşük" },
    seller: { trustScore: 8.9, verified: true, completedTrades: 17, responseTime: "38 dk" },
    metrics: { views: 267, offers: 6, favorites: 15 },
  },
]

const basePriceByCategory: Record<string, number> = {
  kayısı: 170,
  domates: 23,
  elma: 20,
  buğday: 11.2,
  üzüm: 34,
  antepfıstığı: 430,
  zeytin: 48,
  fındık: 114,
}

const cityPremium: Record<string, number> = {
  Malatya: 1.08,
  Elazığ: 1.02,
  Antalya: 1.05,
  Mersin: 0.98,
  Isparta: 1.04,
  Niğde: 1.03,
  Konya: 1.01,
  Manisa: 1.05,
  Gaziantep: 1.06,
  Bursa: 1.03,
  Ordu: 1.04,
}

const qualityPremium: Record<string, number> = {
  Premium: 1.13,
  "1. Kalite": 1.04,
  "2. Kalite": 0.92,
  Sanayi: 0.78,
  "Protein 13+": 1.06,
  "Protein 12": 1,
  Yemlik: 0.84,
}

export function estimateFairPriceLocal(input: {
  category: string
  city: string
  grade: string
  quantityKg: number
}) {
  const base = basePriceByCategory[input.category] ?? 25
  const cityFactor = cityPremium[input.city || ""] ?? 1
  const gradeFactor = qualityPremium[input.grade || ""] ?? 1
  const volumeFactor = input.quantityKg && input.quantityKg > 20000 ? 0.98 : input.quantityKg && input.quantityKg < 2000 ? 1.04 : 1
  const midpoint = base * cityFactor * gradeFactor * volumeFactor
  const spread = Math.max(midpoint * 0.08, midpoint > 100 ? 8 : 1.2)
  return {
    min: Math.round((midpoint - spread) * 10) / 10,
    max: Math.round((midpoint + spread) * 10) / 10,
    confidence: Math.min(94, Math.max(82, Math.round(88 + (cityFactor - 1) * 100))),
  }
}

function normalizeListing(raw: Partial<ProductListing> & Record<string, unknown>): ProductListing {
  const quantityKg = Number(raw.quantityKg ?? raw.quantity_kg ?? 0)
  const pricePerKg = Number(raw.pricePerKg ?? raw.asking_price_per_kg ?? 0)
  const category = String(raw.category || "kayısı")
  const city = String(raw.city || "Malatya")
  const dynamic = (raw.dynamic as Record<string, string>) || {}
  const variety = String(raw.variety || dynamic["çeşit"] || dynamic["cesit"] || dynamic["islem"] || category)
  const grade = String(raw.grade || raw.qualityGrade || "1. Kalite")
  const fair = estimateFairPriceLocal({ category, city, grade, quantityKg })

  return {
    id: String(raw.id || `listing-${Date.now()}`),
    title: String(raw.title || `${city} ${variety} ${category}`),
    category,
    variety,
    city,
    district: String(raw.district || "Merkez"),
    quantityKg,
    pricePerKg,
    priceType: raw.priceType === "offer" || pricePerKg <= 0 ? "offer" : "fixed",
    description: String(raw.description || raw.details || "Ürün parti bilgileri üretici tarafından paylaşılmıştır. Numune, yükleme ve ödeme koşulları alıcı ile netleştirilir."),
    ownerId: raw.ownerId ? String(raw.ownerId) : raw.owner_id ? String(raw.owner_id) : undefined,
    ownerEmail: raw.ownerEmail ? String(raw.ownerEmail) : raw.owner_email ? String(raw.owner_email) : undefined,
    ownerPhoto: raw.ownerPhoto ? String(raw.ownerPhoto) : raw.owner_photo ? String(raw.owner_photo) : undefined,
    ownerName: String(raw.ownerName || raw.created_by || "Anonim Üretici"),
    ownerRole: String(raw.ownerRole || "Üretici"),
    ownerPhone: String(raw.ownerPhone || raw.phone || "Profil üzerinden iletişim"),
    createdAt: String(raw.createdAt || raw.created_at || new Date().toISOString()),
    harvestDate: String(raw.harvestDate || "2026-07-01"),
    stockLocation: String(raw.stockLocation || `${city} / ${String(raw.district || "Merkez")}`),
    grade,
    moisture: raw.moisture ? String(raw.moisture) : undefined,
    brix: raw.brix ? String(raw.brix) : undefined,
    size: raw.size ? String(raw.size) : String(dynamic["kalibre"] || dynamic["boyut"] || ""),
    packaging: String(raw.packaging || "Alıcı talebine göre çuval veya kasa"),
    delivery: String(raw.delivery || "Yerinde teslim, nakliye alıcıya ait"),
    payment: String(raw.payment || commonPayment),
    certificates: Array.isArray(raw.certificates) ? raw.certificates.map(String) : ["ÇKS kaydı"],
    imageUrls: Array.isArray(raw.imageUrls) ? raw.imageUrls.map(String) : Array.isArray(raw.image_urls) ? raw.image_urls.map(String) : [],
    dynamic,
    ai: raw.ai as ProductListing["ai"] || {
      fairMin: fair.min,
      fairMax: fair.max,
      confidence: fair.confidence,
      qualityScore: 84,
      analysis: "Yerel piyasa, kalite ve tonaj verileriyle oluşturulan tahmini fiyat aralığı.",
      risk: "Orta",
      trustScore: Math.min(94, Math.max(68, fair.confidence - 2)),
      listingComment: "İlan temel bilgileriyle anlaşılır; fotoğraf, teslim ve ödeme detayları alıcı kararını destekler.",
      trustSource: "local",
    },
    seller: raw.seller as ProductListing["seller"] || {
      trustScore: 8.2,
      verified: true,
      completedTrades: 6,
      responseTime: "1 sa",
    },
    metrics: raw.metrics as ProductListing["metrics"] || {
      views: 80,
      offers: 1,
      favorites: 4,
    },
  }
}

function isOldDemoListing(item: ProductListing) {
  const title = item.title.toLocaleLowerCase("tr-TR")
  const description = item.description.toLocaleLowerCase("tr-TR")
  return title.includes("yrgbhtryg") || description.includes("erwfcvedvcf")
}

export function getStoredListings(): ProductListing[] {
  if (typeof window === "undefined") return SEED_LISTINGS

  try {
    const stored = JSON.parse(localStorage.getItem(LISTINGS_STORAGE_KEY) || "[]") as Array<Partial<ProductListing> & Record<string, unknown>>

    if (stored.length === 0) {
      localStorage.setItem(LISTINGS_STORAGE_KEY, JSON.stringify(SEED_LISTINGS))
      return SEED_LISTINGS
    }

    const seedMap = new Map(SEED_LISTINGS.map((item) => [item.id, item]))
    const normalized = stored.map((item) => seedMap.get(String(item.id)) || normalizeListing(item)).filter((item) => !isOldDemoListing(item))
    const existingIds = new Set(normalized.map((item) => item.id))
    const missingSeeds = SEED_LISTINGS.filter((item) => !existingIds.has(item.id))
    const migrated = [...normalized, ...missingSeeds].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    localStorage.setItem(LISTINGS_STORAGE_KEY, JSON.stringify(migrated))
    return migrated
  } catch {
    localStorage.setItem(LISTINGS_STORAGE_KEY, JSON.stringify(SEED_LISTINGS))
    return SEED_LISTINGS
  }
}

export function saveStoredListings(listings: ProductListing[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(LISTINGS_STORAGE_KEY, JSON.stringify(listings))
}

export function getListingById(id: string): ProductListing | undefined {
  return getStoredListings().find((listing) => listing.id === id)
}

export function upsertListing(listing: ProductListing) {
  const listings = getStoredListings()
  const index = listings.findIndex((item) => item.id === listing.id)
  const updated = index >= 0 ?
     listings.map((item) => item.id === listing.id ? listing : item)
    : [listing, ...listings]
  saveStoredListings(updated)
}

export function deleteListing(id: string) {
  saveStoredListings(getStoredListings().filter((listing) => listing.id !== id))
}

export function formatKg(value: number) {
  return `${new Intl.NumberFormat("tr-TR").format(value)} kg`
}

export function formatPrice(value: number) {
  return `${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: value % 1 ? 1 : 0 }).format(value)} TL`
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value))
}
