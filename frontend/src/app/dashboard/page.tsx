"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  ArrowUpRight,
  Banknote,
  BarChart3,
  Bot,
  CloudSun,
  Droplets,
  Leaf,
  Loader2,
  Newspaper,
  ReceiptText,
  SendHorizontal,
  ShieldCheck,
  SunMedium,
  TrendingUp,
  Users,
  Wind,
} from "lucide-react"

import { SiteHeader } from "@/components/shared/SiteHeader"
import { AuthUser, getStoredUser } from "@/lib/auth"

const weather = [
  { day: "Pzt", status: "Güneşli", temp: 29, humidity: 42, wind: 15 },
  { day: "Sal", status: "Açık", temp: 31, humidity: 39, wind: 12 },
  { day: "Çar", status: "Bulutlu", temp: 27, humidity: 54, wind: 18 },
  { day: "Per", status: "Yağış bekleniyor", temp: 24, humidity: 68, wind: 22 },
  { day: "Cum", status: "Güneşli", temp: 28, humidity: 46, wind: 14 },
  { day: "Cmt", status: "Açık", temp: 30, humidity: 41, wind: 11 },
  { day: "Paz", status: "Sıcak", temp: 32, humidity: 35, wind: 9 },
]

const monthLabels = ["Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara", "Oca", "Şub", "Mar", "Nis", "May"]

type ProductPriceProfile = {
  product: string
  key: string
  currentPrice: number
  annualChange: number
  expectedKg: number
  volatility: number
  color: string
  seasonality: number[]
}

type PriceTrendRow = { month: string } & Record<string, string | number>

type MarketSeries = {
  product: string
  key: string
  color: string
  latestPrice: number
  annualChange: number
  expectedKg: number
  expectedRevenue: number
}

type MarketInsight = {
  trendData: PriceTrendRow[]
  series: MarketSeries[]
  averageChange: number
  updatedLabel: string
  summary: string
}

type MuhtarChatMessage = {
  role: "user" | "muhtar"
  text: string
}

type MuhtarFallbackContext = {
  userProducts: string[]
  userCity: string
  totalExpense: number
  expectedRevenue: number
  netProfit: number
}

const productPriceProfiles: ProductPriceProfile[] = [
  {
    product: "Kayısı",
    key: "kayisi",
    currentPrice: 198,
    annualChange: 42,
    expectedKg: 15000,
    volatility: 4.2,
    color: "#D97742",
    seasonality: [-2, -1, 1, 3, 5, 6, 8, 9, 10, 11, 12, 14],
  },
  {
    product: "Domates",
    key: "domates",
    currentPrice: 24.5,
    annualChange: 18,
    expectedKg: 12500,
    volatility: 8.5,
    color: "#A0422D",
    seasonality: [-4, 0, 3, -2, 2, 7, 9, 4, 11, 8, 12, 14],
  },
  {
    product: "Buğday",
    key: "bugday",
    currentPrice: 11.4,
    annualChange: 16,
    expectedKg: 30000,
    volatility: 2.8,
    color: "#8B7355",
    seasonality: [-1, 0, 1, 2, 4, 5, 6, 7, 8, 9, 10, 12],
  },
  {
    product: "Elma",
    key: "elma",
    currentPrice: 19.5,
    annualChange: 21,
    expectedKg: 18000,
    volatility: 4.8,
    color: "#496B3A",
    seasonality: [-3, -2, 1, 4, 2, 3, 5, 8, 10, 9, 11, 13],
  },
  {
    product: "Üzüm",
    key: "uzum",
    currentPrice: 34.8,
    annualChange: 29,
    expectedKg: 11000,
    volatility: 6.2,
    color: "#6E4B8B",
    seasonality: [-4, -1, 6, 8, 5, 4, 6, 7, 9, 10, 12, 15],
  },
  {
    product: "Zeytin",
    key: "zeytin",
    currentPrice: 48,
    annualChange: 24,
    expectedKg: 9000,
    volatility: 5.4,
    color: "#2C4C3B",
    seasonality: [-2, -1, 0, 2, 6, 8, 7, 6, 8, 11, 12, 14],
  },
  {
    product: "Fındık",
    key: "findik",
    currentPrice: 116,
    annualChange: 31,
    expectedKg: 7000,
    volatility: 5.1,
    color: "#7A4E2D",
    seasonality: [-3, 0, 5, 7, 5, 6, 8, 9, 11, 13, 14, 16],
  },
  {
    product: "Antep Fıstığı",
    key: "antepFistigi",
    currentPrice: 430,
    annualChange: 38,
    expectedKg: 2500,
    volatility: 6.8,
    color: "#C85A17",
    seasonality: [-5, -2, 3, 8, 9, 7, 8, 10, 12, 14, 16, 18],
  },
]

const sponsorNews = [
  {
    title: "Kayısı için özel bordo bulamacı indirimi",
    text: "Malatya ve Elazığ üreticilerine sezon öncesi toplu alımda %18 avantaj.",
    tag: "Haber",
  },
  {
    title: "Damla sulama sistemlerinde %20 devlet desteği",
    text: "Basınç kontrollü hat kurulumunda fatura ve keşif dosyasıyla başvuru açıldı.",
    tag: "Destek",
  },
  {
    title: "Erkenci domates fideleri stoklarda",
    text: "Serik ve Kumluca hattı için hastalık toleransı yüksek fide paketleri.",
    tag: "Sera",
  },
]

const initialExpenses = {
  fuel: 45000,
  fertilizer: 86000,
  water: 28000,
  labor: 120000,
  other: 18000,
}

const colors = ["#2C4C3B", "#D97742", "#8B7355", "#A0422D", "#6D5A48"]
const defaultProductionProducts = ["Kayısı", "Buğday"]

function formatCurrency(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(value)
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: value >= 100 ? 0 : 1,
    minimumFractionDigits: value < 30 ? 1 : 0,
  }).format(value)
}

function normalizeProductName(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
}

function hashText(value: string) {
  let hash = 2166136261
  for (const char of value) {
    hash ^= char.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function seededRatio(seed: string) {
  return (hashText(seed) % 10000) / 10000
}

function roundMarketPrice(value: number) {
  if (value >= 100) return Math.round(value)
  if (value >= 30) return Math.round(value * 10) / 10
  return Math.round(value * 100) / 100
}

function getDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function getProfileForProduct(product: string, index: number): ProductPriceProfile {
  const normalized = normalizeProductName(product)
  const existing = productPriceProfiles.find((profile) => normalizeProductName(profile.product) === normalized)
  if (existing) return existing

  const seed = hashText(product)
  const currentPrice = 18 + (seed % 140)
  return {
    product,
    key: `urun${index}`,
    currentPrice,
    annualChange: 18 + (seed % 18),
    expectedKg: 6000 + (seed % 18000),
    volatility: 4 + (seed % 5),
    color: ["#D97742", "#2C4C3B", "#8B7355", "#A0422D", "#496B3A"][index % 5],
    seasonality: [-2, 0, 2, 3, 4, 5, 7, 8, 9, 10, 12, 13],
  }
}

function buildDailyMarketInsight(products: string[], city: string): MarketInsight {
  const today = new Date()
  const dateKey = getDateKey(today)
  const selectedProducts = Array.from(new Set(products.filter(Boolean))).slice(0, 5)
  const activeProducts = selectedProducts.length ? selectedProducts : ["Kayısı", "Buğday"]
  const cacheKey = `ciftciden_market_ai_v2_${dateKey}_${city}_${activeProducts.join("_")}`

  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) return JSON.parse(cached) as MarketInsight
    } catch {
      localStorage.removeItem(cacheKey)
    }
  }

  const profiles = activeProducts.map((product, index) => getProfileForProduct(product, index))
  const monthlyPrices = profiles.map((profile) => {
    const startPrice = profile.currentPrice / (1 + profile.annualChange / 100)
    return monthLabels.map((_, monthIndex) => {
      const progress = monthIndex / (monthLabels.length - 1)
      const trendPrice = startPrice + (profile.currentPrice - startPrice) * progress
      const seasonalMove = profile.seasonality[monthIndex] || 0
      const cityPulse = (seededRatio(`${dateKey}:${city}:${profile.key}:${monthIndex}`) - 0.5) * profile.volatility
      const marketPulse = (seededRatio(`${dateKey}:${profile.key}:market`) - 0.5) * profile.volatility * 0.6
      return roundMarketPrice(Math.max(1, trendPrice * (1 + (seasonalMove + cityPulse + marketPulse) / 100)))
    })
  })

  const trendData = monthLabels.map((month, monthIndex) => {
    const row: PriceTrendRow = { month }
    profiles.forEach((profile, profileIndex) => {
      const firstPrice = monthlyPrices[profileIndex][0]
      const price = monthlyPrices[profileIndex][monthIndex]
      row[profile.key] = Math.round((price / firstPrice) * 1000) / 10
      row[`${profile.key}Price`] = price
    })
    return row
  })

  const series = profiles.map((profile, profileIndex) => {
    const prices = monthlyPrices[profileIndex]
    const first = prices[0]
    const latest = prices[prices.length - 1]
    const annualChange = Math.round(((latest - first) / first) * 100)
    return {
      product: profile.product,
      key: profile.key,
      color: profile.color,
      latestPrice: latest,
      annualChange,
      expectedKg: profile.expectedKg,
      expectedRevenue: profile.expectedKg * latest,
    }
  })

  const averageChange = Math.round(series.reduce((sum, item) => sum + item.annualChange, 0) / series.length)
  const leader = [...series].sort((a, b) => b.annualChange - a.annualChange)[0]
  const insight: MarketInsight = {
    trendData,
    series,
    averageChange,
    updatedLabel: today.toLocaleDateString("tr-TR", { day: "numeric", month: "long" }),
    summary: `${city} için seçili ürünlerde en güçlü hareket ${leader.product} tarafında; model bugün hal bandı, mevsimsellik ve bölge etkisini yeniden dengeledi.`,
  }

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(insight))
    } catch {
      // Storage doluysa hesaplanan güncel veri ekranda kullanılmaya devam eder.
    }
  }

  return insight
}

function cleanMuhtarAnswer(value: string) {
  return value
    .replace(/\*\*/g, "")
    .replace(/#{1,6}\s?/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function localMuhtarFinanceFallback(question: string, context: MuhtarFallbackContext) {
  const lower = question.toLocaleLowerCase("tr-TR")
  const mainProduct = context.userProducts[0] || "ürün"
  const netMargin = context.expectedRevenue > 0 ? Math.round((context.netProfit / context.expectedRevenue) * 100) : 0
  const fertilizerBudget = Math.round(context.totalExpense * 0.28)

  if (lower.includes("monilya")) {
    return `${mainProduct} için monilya riski özellikle çiçeklenme ve nemli havada artar.\nMarka söylemem; ruhsatlı fungisit etken maddesini ilçe tarım veya ziraat mühendisiyle seçin.\nKuruyan sürgünleri sağlam yerden 10-15 cm aşağıdan kesip bahçeden çıkarın.`
  }

  if (lower.includes("gübre") || lower.includes("gubre") || lower.includes("azot")) {
    return `Toprak analizi yoksa gübreyi tek seferde yüklenmeyin.\n${mainProduct} için azotu gelişim dönemine bölün, fosfor ve potasyumu kök-meyve ihtiyacına göre planlayın.\nBu sezon gübre bütçesini yaklaşık ${formatCurrency(fertilizerBudget)} bandında tutup analiz sonucuna göre düzeltin.`
  }

  if (lower.includes("ilaç") || lower.includes("ilac") || lower.includes("hastalık") || lower.includes("risk")) {
    return `${context.userCity} tarafında nem ve yağış artıyorsa ilaçlama riski yükselir.\nRüzgarlı ve çok sıcak saatte uygulama yapmayın.\nBelirti net değilse önce yakın plan fotoğraf ve yaprak-dal kontrolü yapın; ruhsatlı etken madde için uzmana danışın.`
  }

  if (lower.includes("sulama") || lower.includes("damla") || lower.includes("su") || lower.includes("nem")) {
    return `Sulamayı sabah erken veya akşam serinliğinde yapın.\nToprağın üstü kuru ama altı nemliyse sulamayı erteleyin.\nYağış bekleniyorsa aynı gün ekstra sulama yapmayın.`
  }

  if (lower.includes("mazot") || lower.includes("gider") || lower.includes("kar") || lower.includes("kâr") || lower.includes("yeterli")) {
    return context.netProfit >= 0
      ? `Net kar pozitif ve yaklaşık marjınız %${netMargin} görünüyor.\nYine de mazot, işçilik ve gübre için hasat öncesi nakit payı ayırın.\nBüyük harcamayı ürün satışı kesinleşmeden tek seferde yapmayın.`
      : `Net kar negatife dönmüş görünüyor.\nÖnce yüksek gider kalemlerini azaltın, sonra beklenen satış gelirini ve kg fiyat hedefini yeniden kontrol edin.\nYeni masrafı satış planı netleşmeden erteleyin.`
  }

  return `${mainProduct} için şehir, dönem ve hedefinizi biraz daha net yazarsanız daha kesin plan çıkarırım.\nFinans, gübre, ilaçlama veya sulama sorularında kısa ve uygulanabilir yol gösterebilirim.`
}

function shouldUseLocalMuhtarAnswer(question: string, answer: string) {
  const lowerQuestion = question.toLocaleLowerCase("tr-TR")
  const lowerAnswer = answer.toLocaleLowerCase("tr-TR")
  if (!answer.trim()) return true
  if (
    lowerAnswer.includes("daha net cevap için ürün") ||
    lowerAnswer.includes("belirti ve yakın plan fotoğraf") ||
    lowerAnswer.includes("hastalık varsa yaprak")
  ) {
    return true
  }
  if (lowerQuestion.includes("monilya") && !lowerAnswer.includes("monilya")) return true
  if ((lowerQuestion.includes("gübre") || lowerQuestion.includes("gubre")) && !/(gübre|azot|toprak)/.test(lowerAnswer)) return true
  if ((lowerQuestion.includes("kar") || lowerQuestion.includes("kâr") || lowerQuestion.includes("finans")) && !/(kar|kâr|nakit|gider)/.test(lowerAnswer)) return true
  if ((lowerQuestion.includes("ilaç") || lowerQuestion.includes("ilac")) && !/(ilaç|etken|ruhsat|uygulama|risk)/.test(lowerAnswer)) return true
  return false
}

export default function DashboardPage() {
  const [expenses, setExpenses] = useState(initialExpenses)
  const [currentUser] = useState<AuthUser | null>(() => (typeof window === "undefined" ? null : getStoredUser()))

  const userProducts = useMemo(
    () => (currentUser?.productionProducts?.length ? currentUser.productionProducts : defaultProductionProducts),
    [currentUser],
  )
  const userCity = currentUser?.city || "Malatya"
  const producerLine = `${userCity} - ${userProducts.join(" ve ")} Üreticisi`
  const marketInsight = useMemo(() => buildDailyMarketInsight(userProducts, userCity), [userProducts, userCity])
  const modelExpectedRevenue = marketInsight.series.reduce((sum, item) => sum + item.expectedRevenue, 0)
  const [expectedRevenue, setExpectedRevenue] = useState(() => Math.round(modelExpectedRevenue))
  const totalExpense = expenses.fuel + expenses.fertilizer + expenses.water + expenses.labor + expenses.other
  const netProfit = expectedRevenue - totalExpense

  const pieData = useMemo(
    () => [
      { name: "Mazot", value: expenses.fuel },
      { name: "Gübre ve ilaç", value: expenses.fertilizer },
      { name: "Su / elektrik", value: expenses.water },
      { name: "İşçilik", value: expenses.labor },
      { name: "Diğer gider", value: expenses.other },
    ],
    [expenses],
  )

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#2A211A]">
      <SiteHeader searchPlaceholder="Ürün, şehir, üretici ara..." />

      <main className="mx-auto w-full max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[34px] border border-[#E4DBC8] bg-[#2C4C3B] shadow-[0_24px_70px_-46px_rgba(42,33,26,0.75)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/hero-farm-premium.png"
            alt="Çiftçiden tarım finans merkezi"
            className="absolute inset-0 h-full w-full object-cover object-center opacity-58"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(42,33,26,0.90)_0%,rgba(42,33,26,0.68)_42%,rgba(42,33,26,0.18)_100%)]" />
          <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:p-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/22 bg-white/14 px-4 py-2 text-sm font-black text-[#F9F8F6] backdrop-blur">
                <ShieldCheck className="h-4 w-4" />
                {producerLine}
              </div>
              <h1 className="mt-8 max-w-3xl text-4xl font-black leading-[0.96] tracking-tight text-white sm:text-6xl lg:text-7xl">
                Tarlam Finans Merkezi
              </h1>
              <p className="mt-5 max-w-2xl text-lg font-semibold leading-8 text-[#F7E8D7]">
                Sezon giderini, beklenen hasılatı, fiyat trendini ve hava durumunu tek ekranda yönetin.
              </p>
              <div className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
                <HeroMetric label="Aktif ürün" value={userProducts.join(" + ")} />
                <HeroMetric label="Beklenen gelir" value={formatCurrency(expectedRevenue)} />
                <HeroMetric label="Net kar" value={formatCurrency(netProfit)} />
              </div>
            </div>

            <div className="rounded-[28px] border border-white/18 bg-white/14 p-5 text-white shadow-[0_22px_55px_-36px_rgba(0,0,0,0.9)] backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#F7D8B5]">Bugünkü karar</p>
                  <h2 className="mt-2 text-2xl font-black">Akşam 2 saat damla sulama</h2>
                </div>
                <SunMedium className="h-10 w-10 text-[#F2C078]" />
              </div>
              <p className="mt-4 text-sm font-semibold leading-7 text-[#F7E8D7]">
                Nem düşük, rüzgar orta seviyede. Kayısı bahçesinde sabah erken saatlerde yaprak altı kontrolü önerilir.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <WeatherStrip />
            <PriceTrendPanel marketInsight={marketInsight} city={userCity} />
            <FinancePanel
              expenses={expenses}
              setExpenses={setExpenses}
              pieData={pieData}
              totalExpense={totalExpense}
              expectedRevenue={expectedRevenue}
              setExpectedRevenue={setExpectedRevenue}
              modelExpectedRevenue={modelExpectedRevenue}
              netProfit={netProfit}
            />
          </div>

          <aside className="space-y-6">
            <SponsorPanel />
            <DecisionPanel
              userProducts={userProducts}
              userCity={userCity}
              totalExpense={totalExpense}
              expectedRevenue={expectedRevenue}
              netProfit={netProfit}
              marketSummary={marketInsight.summary}
            />
          </aside>
        </section>
      </main>
    </div>
  )
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/18 bg-white/14 p-4 shadow-[0_18px_48px_-34px_rgba(0,0,0,0.9)] backdrop-blur">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#F7D8B5]">{label}</p>
      <p className="mt-2 break-words text-2xl font-black text-white">{value}</p>
    </div>
  )
}

function WeatherStrip() {
  return (
    <section className="rounded-[30px] border border-[#E4DBC8] bg-white p-5 shadow-[0_20px_54px_-42px_rgba(42,33,26,0.65)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8B7355]">7 günlük zirai hava</p>
          <h2 className="mt-1 text-2xl font-black text-[#2C4C3B]">Malatya üretim bölgesi</h2>
        </div>
        <div className="rounded-full bg-[#EAF1E4] px-4 py-2 text-sm font-black text-[#2C4C3B]">Perşembe yağış bekleniyor</div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-7">
        {weather.map((item) => (
          <div key={item.day} className="rounded-3xl border border-[#E7DCCB] bg-[#FAF7F2] p-4">
            <div className="flex items-center justify-between">
              <span className="font-black text-[#2A211A]">{item.day}</span>
              <CloudSun className="h-5 w-5 text-[#D97742]" />
            </div>
            <p className="mt-3 text-2xl font-black text-[#2C4C3B]">{item.temp}°</p>
            <p className="mt-1 min-h-10 text-xs font-bold text-[#8B7355]">{item.status}</p>
            <div className="mt-3 space-y-1 text-xs font-bold text-[#5C4A3D]">
              <p className="flex items-center gap-1"><Droplets className="h-3.5 w-3.5" /> %{item.humidity}</p>
              <p className="flex items-center gap-1"><Wind className="h-3.5 w-3.5" /> {item.wind} km/s</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function PriceTrendPanel({ marketInsight, city }: { marketInsight: MarketInsight; city: string }) {
  return (
    <section className="rounded-[30px] border border-[#E4DBC8] bg-white p-5 shadow-[0_20px_54px_-42px_rgba(42,33,26,0.65)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8B7355]">1 yıllık ürün fiyat endeksi</p>
          <h2 className="mt-1 text-2xl font-black text-[#2C4C3B]">Ürettiğiniz ürünler tek grafikte</h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#6D5A48]">
            Hesap açarken seçtiğiniz ürünler aynı grafikte karşılaştırılır. Endeks Haziran ayını 100 kabul eder; güncel TL/kg değerleri alttaki kartlarda görünür.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-[#EAF1E4] px-4 py-2 text-sm font-black text-[#2C4C3B]">
          <TrendingUp className="h-4 w-4" />
          Güncellendi: {marketInsight.updatedLabel}
        </div>
      </div>
      <div className="mt-6 h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={marketInsight.trendData} margin={{ top: 10, right: 18, left: -18, bottom: 0 }}>
            <CartesianGrid stroke="#E9DFD0" strokeDasharray="4 8" />
            <XAxis dataKey="month" tick={{ fill: "#8B7355", fontSize: 12, fontWeight: 800 }} axisLine={false} tickLine={false} />
            <YAxis domain={["dataMin - 4", "dataMax + 6"]} tick={{ fill: "#8B7355", fontSize: 12, fontWeight: 800 }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(value, name) => [`${Number(value).toLocaleString("tr-TR")} endeks`, name]}
              contentStyle={{ borderRadius: 18, border: "1px solid #E4DBC8", boxShadow: "0 18px 50px -34px rgba(42,33,26,.7)" }}
            />
            {marketInsight.series.map((item) => (
              <Line
                key={item.key}
                type="monotone"
                dataKey={item.key}
                stroke={item.color}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0 }}
                name={item.product}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {marketInsight.series.map((item) => (
          <div key={item.key} className="rounded-3xl border border-[#E7DCCB] bg-[#FAF7F2] p-4">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-sm font-black text-[#2A211A]">{item.product}</span>
            </div>
            <div className="mt-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#8B7355]">Güncel fiyat</p>
                <p className="mt-1 text-2xl font-black text-[#2C4C3B]">{formatPrice(item.latestPrice)} TL/kg</p>
              </div>
              <span className="rounded-full bg-[#EAF1E4] px-3 py-1 text-xs font-black text-[#2C4C3B]">
                %{item.annualChange}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-3xl border border-[#C8D8BD] bg-[#EAF1E4] px-4 py-3 text-sm font-bold leading-6 text-[#2C4C3B]">
        {marketInsight.summary} Ortalama yıllık hareket %{marketInsight.averageChange}. Kaynak: {city} odaklı günlük piyasa modeli.
      </div>
    </section>
  )
}

function FinancePanel({
  expenses,
  setExpenses,
  pieData,
  totalExpense,
  expectedRevenue,
  setExpectedRevenue,
  modelExpectedRevenue,
  netProfit,
}: {
  expenses: typeof initialExpenses
  setExpenses: React.Dispatch<React.SetStateAction<typeof initialExpenses>>
  pieData: { name: string; value: number }[]
  totalExpense: number
  expectedRevenue: number
  setExpectedRevenue: React.Dispatch<React.SetStateAction<number>>
  modelExpectedRevenue: number
  netProfit: number
}) {
  const fields = [
    { key: "fuel", label: "Mazot Gideri", icon: Banknote },
    { key: "fertilizer", label: "Gübre ve İlaç", icon: Leaf },
    { key: "water", label: "Su / Elektrik Faturası", icon: Droplets },
    { key: "labor", label: "Yevmiyeli İşçi Ücreti", icon: Users },
    { key: "other", label: "Diğer Gider", icon: ReceiptText },
  ] as const

  return (
    <section className="grid gap-6 rounded-[30px] border border-[#E4DBC8] bg-white p-5 shadow-[0_20px_54px_-42px_rgba(42,33,26,0.65)] lg:grid-cols-[minmax(0,1fr)_360px]">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8B7355]">Tarım muhasebesi</p>
        <h2 className="mt-1 text-2xl font-black text-[#2C4C3B]">Gelir gider yönetimi</h2>
        <div className="mt-5 rounded-3xl border border-[#C8D8BD] bg-[#EAF1E4] p-4">
          <label>
            <span className="flex items-center gap-2 text-sm font-black text-[#2C4C3B]">
              <BarChart3 className="h-4 w-4" />
              Beklenen Satış Geliri
            </span>
            <input
              type="number"
              value={expectedRevenue}
              onChange={(event) => setExpectedRevenue(Number(event.target.value) || 0)}
              className="mt-3 h-12 w-full rounded-2xl border border-[#C8D8BD] bg-white px-4 text-lg font-black text-[#2C4C3B] outline-none focus:border-[#D97742]"
            />
          </label>
          <p className="mt-2 text-xs font-bold leading-5 text-[#5C4A3D]">
            Günlük piyasa modelinin önerisi: {formatCurrency(modelExpectedRevenue)}. Çiftçi kendi sezon beklentisine göre bu alanı değiştirebilir.
          </p>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {fields.map((field) => {
            const Icon = field.icon
            return (
              <label key={field.key} className="rounded-3xl border border-[#E7DCCB] bg-[#FAF7F2] p-4">
                <span className="flex items-center gap-2 text-sm font-black text-[#4A3B32]">
                  <Icon className="h-4 w-4 text-[#2C4C3B]" />
                  {field.label}
                </span>
                <input
                  type="number"
                  value={expenses[field.key]}
                  onChange={(event) =>
                    setExpenses((previous) => ({ ...previous, [field.key]: Number(event.target.value) || 0 }))
                  }
                  className="mt-3 h-12 w-full rounded-2xl border border-[#DED1BC] bg-white px-4 text-lg font-black text-[#2C4C3B] outline-none focus:border-[#D97742]"
                />
              </label>
            )
          })}
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <FinanceCard label="Toplam Sezon Gideri" value={formatCurrency(totalExpense)} />
          <FinanceCard label="Beklenen Satış Geliri" value={formatCurrency(expectedRevenue)} />
          <FinanceCard label="Tahmini Net Kar" value={formatCurrency(netProfit)} positive={netProfit >= 0} />
        </div>
      </div>

      <div className="rounded-[28px] border border-[#E7DCCB] bg-[#2C4C3B] p-5 text-white">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#F7D8B5]">Gider dağılımı</p>
        <div className="mt-4 h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} innerRadius={72} outerRadius={104} paddingAngle={4} dataKey="value">
                {pieData.map((entry, index) => (
                  <Cell key={entry.name} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ borderRadius: 18 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 space-y-2">
          {pieData.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between gap-3 text-sm font-bold">
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: colors[index] }} />
                {item.name}
              </span>
              <span>{totalExpense > 0 ? Math.round((item.value / totalExpense) * 100) : 0}%</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FinanceCard({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className={`rounded-3xl border p-4 ${positive === undefined ? "border-[#E7DCCB] bg-[#FAF7F2]" : positive ? "border-[#C8D8BD] bg-[#EAF1E4]" : "border-red-200 bg-red-50"}`}>
      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#8B7355]">{label}</p>
      <p className={`mt-2 break-words text-2xl font-black ${positive === false ? "text-red-700" : "text-[#2C4C3B]"}`}>{value}</p>
    </div>
  )
}

function SponsorPanel() {
  return (
    <section className="rounded-[30px] border border-[#E4DBC8] bg-white p-5 shadow-[0_20px_54px_-42px_rgba(42,33,26,0.65)]">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D97742] text-white">
          <Newspaper className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xl font-black text-[#2C4C3B]">Çiftçiye Haberler</h2>
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {sponsorNews.map((item) => (
          <article key={item.title} className="rounded-3xl border border-[#E7DCCB] bg-[#FAF7F2] p-4 transition hover:-translate-y-0.5 hover:shadow-[0_18px_46px_-34px_rgba(42,33,26,0.72)]">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#D97742]">{item.tag}</span>
              <ArrowUpRight className="h-4 w-4 text-[#8B7355]" />
            </div>
            <h3 className="mt-3 text-base font-black leading-snug text-[#2A211A]">{item.title}</h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#6D5A48]">{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function DecisionPanel({
  userProducts,
  userCity,
  totalExpense,
  expectedRevenue,
  netProfit,
  marketSummary,
}: {
  userProducts: string[]
  userCity: string
  totalExpense: number
  expectedRevenue: number
  netProfit: number
  marketSummary: string
}) {
  const [question, setQuestion] = useState("")
  const [isAsking, setIsAsking] = useState(false)
  const messagesRef = useRef<HTMLDivElement | null>(null)
  const [messages, setMessages] = useState<MuhtarChatMessage[]>([
    {
      role: "muhtar",
      text: "Finans, gübre, ilaçlama, sulama veya satış planı için kısa bir soru yazın; tarlanıza göre cevaplayayım.",
    },
  ])

  const quickQuestions = [
    "Bu net kar yeterli mi?",
    "Gübreyi ne zaman atayım?",
    "İlaçlama için risk var mı?",
  ]

  useEffect(() => {
    const element = messagesRef.current
    if (!element) return
    element.scrollTo({ top: element.scrollHeight, behavior: "smooth" })
  }, [messages, isAsking])

  const askMuhtar = async (rawQuestion = question) => {
    const cleanQuestion = rawQuestion.trim()
    if (!cleanQuestion || isAsking) return

    setQuestion("")
    setMessages((previous) => [...previous, { role: "user", text: cleanQuestion }])
    setIsAsking(true)

    const contextualQuestion = [
      "Tarlam finans danışma modu.",
      `Şehir: ${userCity}.`,
      `Ürünler: ${userProducts.join(", ")}.`,
      `Beklenen satış geliri: ${formatCurrency(expectedRevenue)}.`,
      `Toplam sezon gideri: ${formatCurrency(totalExpense)}.`,
      `Tahmini net kar: ${formatCurrency(netProfit)}.`,
      `Piyasa özeti: ${marketSummary}`,
      `Çiftçinin sorusu: ${cleanQuestion}`,
      "Cevaplamadan önce finans, hava, ürün dönemi ve uygulama riskini birlikte düşün.",
      "Veri yetersizse kesin konuşma; hangi bilgi eksikse açıkça söyle.",
      "Cevabı 60 yaşındaki bir çiftçinin anlayacağı Türkçeyle ver.",
      "En fazla 5 kısa cümle yaz; markdown, başlık, doz ve ilaç markası kullanma.",
    ].join("\n")
    const fallbackContext = { userProducts, userCity, totalExpense, expectedRevenue, netProfit }
    const fallbackAnswer = localMuhtarFinanceFallback(cleanQuestion, fallbackContext)

    try {
      const response = await fetch("http://localhost:8000/api/v1/muhtar/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: contextualQuestion,
          plant: userProducts[0],
          city: userCity,
        }),
      })

      if (!response.ok) throw new Error("Muhtar yanıtı alınamadı.")
      const data = await response.json()
      const answer = cleanMuhtarAnswer(data.muhtar_response || data.answer || "")
      setMessages((previous) => [
        ...previous,
        {
          role: "muhtar",
          text: shouldUseLocalMuhtarAnswer(cleanQuestion, answer) ? fallbackAnswer : answer,
        },
      ])
    } catch {
      setMessages((previous) => [
        ...previous,
        {
          role: "muhtar",
          text: fallbackAnswer,
        },
      ])
    } finally {
      setIsAsking(false)
    }
  }

  return (
    <section className="overflow-hidden rounded-[30px] border border-[#E4DBC8] bg-[#FBF7EF] p-4 text-[#2A211A] shadow-[0_22px_62px_-48px_rgba(42,33,26,0.68)]">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#2C4C3B] text-[#F2C078] shadow-[0_14px_30px_-20px_rgba(44,76,59,0.85)]">
          <Bot className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <div className="inline-flex rounded-full border border-[#C8D8BD] bg-[#EAF1E4] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#2C4C3B]">
            Gemini ile çalışır
          </div>
          <h2 className="mt-2 text-xl font-black tracking-tight text-[#2C4C3B]">Muhtara Danış</h2>
          <p className="mt-1 text-xs font-bold leading-5 text-[#6D5A48]">
            Finans, gübre, ilaçlama ve sulama için kısa cevap al.
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-[26px] border border-[#E7DCCB] bg-white/78 p-3 shadow-inner">
        <div ref={messagesRef} className="h-[430px] overflow-y-auto pr-1 sm:h-[520px]">
          <div className="space-y-3">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}-${message.text.slice(0, 12)}`}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[92%] rounded-2xl px-3.5 py-3 text-sm font-semibold leading-6 ${
                  message.role === "user"
                    ? "rounded-br-md bg-[#D97742] text-white shadow-[0_14px_30px_-22px_rgba(217,119,66,0.95)]"
                    : "rounded-bl-md border border-[#E7DCCB] bg-[#FAF7F2] text-[#2A211A]"
                }`}
              >
                <div className={`mb-1 text-[10px] font-black uppercase tracking-[0.12em] ${message.role === "user" ? "text-white/75" : "text-[#8B7355]"}`}>
                  {message.role === "user" ? "Siz" : "Muhtar"}
                </div>
                <p className="whitespace-pre-line">{message.text}</p>
              </div>
            </div>
          ))}
          {isAsking && (
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E7DCCB] bg-[#FAF7F2] px-4 py-2 text-sm font-bold text-[#2C4C3B]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Muhtar veriyi ve riski değerlendiriyor...
            </div>
          )}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#8B7355]">Hızlı sorular</p>
        <div className="flex flex-wrap gap-2">
          {quickQuestions.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => askMuhtar(item)}
              disabled={isAsking}
              className="rounded-full border border-[#D6C7B1] bg-white px-3 py-2 text-xs font-black text-[#2C4C3B] transition hover:border-[#C8D8BD] hover:bg-[#EAF1E4] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <form
        className="mt-4 flex items-center gap-2 rounded-2xl border border-[#D6C7B1] bg-white p-2 shadow-[0_16px_38px_-34px_rgba(42,33,26,0.65)]"
        onSubmit={(event) => {
          event.preventDefault()
          askMuhtar()
        }}
      >
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Örn: Monilya için ne yapmalıyım?"
          className="min-w-0 flex-1 bg-transparent px-2 text-sm font-semibold text-[#2A211A] outline-none placeholder:text-[#8B7355]"
        />
        <button
          type="submit"
          disabled={isAsking || !question.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2C4C3B] text-white transition hover:bg-[#20382B] disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Muhtara sor"
        >
          {isAsking ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
        </button>
      </form>
    </section>
  )
}
