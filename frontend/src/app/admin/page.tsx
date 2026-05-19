"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Download,
  FileSearch,
  Leaf,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  Store,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react"
import Link from "next/link"

type CategoryKey = "kayısı" | "domates" | "elma"
type YearKey = "2024" | "2025" | "2026"
type YearStats = {
  avgPrice: number
  totalListings: number
  topCity: string
  totalVolume: string
  demand: string
  priceChange: string
}

const marketStats: Record<CategoryKey, Record<YearKey, YearStats>> = {
  kayısı: {
    "2024": { avgPrice: 145, totalListings: 312, topCity: "Malatya", totalVolume: "4.200 ton", demand: "Yüksek", priceChange: "+8%" },
    "2025": { avgPrice: 175, totalListings: 489, topCity: "Malatya", totalVolume: "5.800 ton", demand: "Çok yüksek", priceChange: "+21%" },
    "2026": { avgPrice: 195, totalListings: 156, topCity: "Malatya", totalVolume: "2.100 ton", demand: "Yüksek", priceChange: "+11%" },
  },
  domates: {
    "2024": { avgPrice: 12, totalListings: 567, topCity: "Antalya", totalVolume: "18.500 ton", demand: "Normal", priceChange: "+3%" },
    "2025": { avgPrice: 18, totalListings: 723, topCity: "Antalya", totalVolume: "22.300 ton", demand: "Yüksek", priceChange: "+50%" },
    "2026": { avgPrice: 22, totalListings: 234, topCity: "Mersin", totalVolume: "8.400 ton", demand: "Yüksek", priceChange: "+22%" },
  },
  elma: {
    "2024": { avgPrice: 8, totalListings: 234, topCity: "Isparta", totalVolume: "12.000 ton", demand: "Normal", priceChange: "-2%" },
    "2025": { avgPrice: 11, totalListings: 345, topCity: "Amasya", totalVolume: "15.600 ton", demand: "Normal", priceChange: "+38%" },
    "2026": { avgPrice: 14, totalListings: 89, topCity: "Isparta", totalVolume: "4.200 ton", demand: "Düşük", priceChange: "+27%" },
  },
}

const socialStats = {
  totalPosts: 1247,
  totalGroups: 34,
  totalComments: 4891,
  topGroups: [
    { name: "Malatya Kayısıcıları", members: 156, posts: 43 },
    { name: "Antalya Seracılar", members: 89, posts: 27 },
    { name: "Ege Zeytincileri", members: 204, posts: 61 },
  ],
}

const fraudLogs = [
  { id: 1, type: "NACE uyumsuzluğu", desc: "Tarım dışı faaliyet koduyla tüccar kaydı denendi.", time: "10 dk önce", severity: "high" },
  { id: 2, type: "Belge okunurluğu düşük", desc: "Vergi levhası bulanık yüklendi, manuel kontrol bekliyor.", time: "45 dk önce", severity: "medium" },
  { id: 3, type: "İsim eşleşmesi başarısız", desc: "VKN kayıt adı ile başvuru ünvanı örtüşmedi.", time: "2 saat önce", severity: "high" },
]

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "stats">("overview")
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>("kayısı")
  const [selectedYear, setSelectedYear] = useState<YearKey>("2026")
  const [isMounted, setIsMounted] = useState(false)
  const [realListings, setRealListings] = useState(0)
  const [pendingMerchants, setPendingMerchants] = useState([
    { id: 1, name: "Yılmazlar Tarım A.Ş.", vkn: "1234567890", nace: "46.31.04", date: "14 Mayıs 2026 15:30" },
    { id: 2, name: "Bereket Gıda İhracat", vkn: "9876543210", nace: "46.31.04", date: "14 Mayıs 2026 16:15" },
  ])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsMounted(true)
      setRealListings(JSON.parse(localStorage.getItem("ciftciden_listings") || "[]").length)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [])

  const currentStats = marketStats[selectedCategory][selectedYear]

  const handleApprove = (id: number) => setPendingMerchants((previous) => previous.filter((merchant) => merchant.id !== id))
  const handleReject = (id: number) => setPendingMerchants((previous) => previous.filter((merchant) => merchant.id !== id))

  const handleDownloadCSV = () => {
    const stats = marketStats[selectedCategory]
    let csv = "Yıl,Ortalama Fiyat (TL/kg),Toplam İlan,En Aktif Şehir,Toplam Hacim,Talep,Fiyat Değişimi\n"
    ;(Object.entries(stats) as [YearKey, YearStats][]).forEach(([year, stat]) => {
      csv += `${year},${stat.avgPrice},${stat.totalListings},${stat.topCity},${stat.totalVolume},${stat.demand},${stat.priceChange}\n`
    })

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `ciftciden_${selectedCategory}_istatistik.csv`
    link.click()
  }

  const handleDownloadJSON = () => {
    const data = { category: selectedCategory, stats: marketStats[selectedCategory], social: socialStats, exportDate: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `ciftciden_${selectedCategory}_rapor.json`
    link.click()
  }

  if (!isMounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9F8F6]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#3A5A40] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#2A211A]">
      <header className="border-b border-[#E4DBC8] bg-[#F9F8F6]/92 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#3A5A40] shadow-[0_12px_28px_-14px_rgba(58,90,64,0.9)]">
              <Leaf className="h-5 w-5 text-[#F9F8F6]" />
            </span>
            <span className="text-xl font-black tracking-tight text-[#2C4C3B]">Çiftçiden</span>
          </Link>
          <div className="flex items-center gap-2 rounded-2xl border border-[#C8D8BD] bg-[#EAF1E4] px-4 py-2 text-sm font-black text-[#2C4C3B]">
            <Activity className="h-4 w-4" />
            Sistem canlı
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] space-y-7 px-4 py-7 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[32px] border border-[#E4DBC8] bg-white shadow-[0_24px_80px_-62px_rgba(42,33,26,0.48)]">
          <div className="grid gap-0 lg:grid-cols-[1fr_360px]">
            <div className="p-6 sm:p-8">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#C8D8BD] bg-[#EAF1E4] px-4 py-2 text-xs font-black text-[#2C4C3B]">
                <ShieldCheck className="h-4 w-4" />
                Kurumsal denetim merkezi
              </div>
              <h1 className="text-4xl font-black tracking-tight text-[#2A211A] sm:text-5xl">Sistem Yönetim Paneli</h1>
              <p className="mt-4 max-w-3xl text-base font-medium leading-8 text-[#6E5A42]">
                Tüccar onayı, güvenlik olayları, pazar istatistikleri ve kahvehane hareketleri tek ekranda takip edilir.
              </p>
            </div>
            <div className="bg-[#2C4C3B] p-6 text-[#F9F8F6]">
              <ShieldAlert className="h-10 w-10 text-[#E88C5D]" />
              <div className="mt-5 text-2xl font-black">Güvenlik öncelikli</div>
              <p className="mt-3 text-sm font-semibold leading-7 text-[#E8DDCD]">
                Başvurular belge, faaliyet kodu ve profil tutarlılığı üzerinden incelenir.
              </p>
            </div>
          </div>
        </section>

        <div className="flex flex-col justify-between gap-3 rounded-[24px] border border-[#E4DBC8] bg-white p-2 shadow-[0_18px_60px_-52px_rgba(42,33,26,0.45)] sm:flex-row sm:items-center">
          <div className="flex rounded-2xl bg-[#FAF7F2] p-1">
            <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")}>
              Genel Bakış
            </TabButton>
            <TabButton active={activeTab === "stats"} onClick={() => setActiveTab("stats")}>
              Pazar İstatistikleri
            </TabButton>
          </div>
          <div className="px-3 text-xs font-black uppercase tracking-[0.14em] text-[#8B7355]">
            17 Mayıs 2026
          </div>
        </div>

        {activeTab === "overview" ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-7">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Kpi title="Toplam İşlem Hacmi" value="24.5M TL" detail="+12% bu ay" icon={TrendingUp} />
              <Kpi title="Aktif İlan" value={String(realListings)} detail="Kullanıcı ilanları" icon={Store} />
              <Kpi title="Onaylı Tüccar" value="312" detail="Belgeleri doğrulanmış" icon={ShieldCheck} />
              <Kpi title="Engellenen Risk" value="47" detail="Şüpheli başvuru" icon={ShieldAlert} danger />
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_390px]">
              <section className="rounded-[28px] border border-[#E4DBC8] bg-white shadow-[0_24px_80px_-62px_rgba(42,33,26,0.48)]">
                <div className="flex items-center justify-between gap-3 border-b border-[#E7DCCB] p-5">
                  <div className="flex items-center gap-2 text-xl font-black text-[#2A211A]">
                    <FileSearch className="h-5 w-5 text-[#2C4C3B]" />
                    Tüccar Onay Kuyruğu
                  </div>
                  <span className="rounded-full bg-[#F7DAC1] px-3 py-1 text-xs font-black text-[#9A4C20]">{pendingMerchants.length} bekleyen</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="bg-[#FAF7F2] text-xs font-black uppercase tracking-[0.1em] text-[#8B7355]">
                      <tr>
                        <th className="px-6 py-4">Şirket Ünvanı</th>
                        <th className="px-6 py-4">VKN</th>
                        <th className="px-6 py-4">NACE</th>
                        <th className="px-6 py-4">Tarih</th>
                        <th className="px-6 py-4 text-right">Aksiyon</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7DCCB]">
                      {pendingMerchants.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center font-bold text-[#8B7355]">Onay bekleyen tüccar yok.</td>
                        </tr>
                      ) : (
                        pendingMerchants.map((merchant) => (
                          <tr key={merchant.id} className="transition hover:bg-[#FAF7F2]">
                            <td className="px-6 py-4 font-black text-[#2A211A]">{merchant.name}</td>
                            <td className="px-6 py-4 font-semibold text-[#5C4A3D]">{merchant.vkn}</td>
                            <td className="px-6 py-4">
                              <span className="rounded-full bg-[#EAF1E4] px-3 py-1 text-xs font-black text-[#2C4C3B]">{merchant.nace}</span>
                            </td>
                            <td className="px-6 py-4 text-xs font-semibold text-[#8B7355]">{merchant.date}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <ActionButton label="Reddet" icon={XCircle} danger onClick={() => handleReject(merchant.id)} />
                                <ActionButton label="Onayla" icon={CheckCircle2} onClick={() => handleApprove(merchant.id)} />
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="rounded-[28px] bg-[#2C4C3B] p-5 text-[#F9F8F6] shadow-[0_30px_70px_-45px_rgba(44,76,59,0.9)]">
                <div className="mb-5 flex items-center gap-2 text-xl font-black">
                  <ShieldAlert className="h-5 w-5 text-[#E88C5D]" />
                  Güvenlik Radarı
                </div>
                <div className="space-y-3">
                  {fraudLogs.map((log) => (
                    <article key={log.id} className="rounded-2xl bg-white/10 p-4">
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <div className="font-black">{log.type}</div>
                        <span className="text-[10px] font-bold text-[#D7C9B2]">{log.time}</span>
                      </div>
                      <p className="text-sm font-semibold leading-6 text-[#E8DDCD]">{log.desc}</p>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-7">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(marketStats) as CategoryKey[]).map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`rounded-2xl px-5 py-2 text-sm font-black capitalize transition ${
                      selectedCategory === category ? "bg-[#3A5A40] text-white" : "border border-[#D6C7B1] bg-white text-[#5C4A3D] hover:bg-[#EAF1E4]"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                {(["2024", "2025", "2026"] as YearKey[]).map((year) => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => setSelectedYear(year)}
                    className={`rounded-2xl px-4 py-2 text-sm font-black transition ${
                      selectedYear === year ? "bg-[#D97742] text-white" : "border border-[#D6C7B1] bg-white text-[#5C4A3D] hover:bg-[#FAF7F2]"
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Kpi title="Ortalama Fiyat" value={`${currentStats.avgPrice} TL/kg`} detail={`${currentStats.priceChange} önceki yıla göre`} icon={TrendingUp} />
              <Kpi title="Toplam İlan" value={String(currentStats.totalListings)} detail="Seçili yıl içinde" icon={Store} />
              <Kpi title="Toplam Hacim" value={currentStats.totalVolume} detail="Tahmini üretim" icon={BarChart3} />
              <Kpi title="En Aktif Şehir" value={currentStats.topCity} detail="En yoğun arz bölgesi" icon={Leaf} />
              <Kpi title="Arz Talep Dengesi" value={currentStats.demand} detail="Pazar hareketi" icon={Activity} />
              <Kpi title="Dijital Kahvehane" value={String(socialStats.totalPosts)} detail="Toplam paylaşım" icon={MessageSquare} />
            </div>

            <section className="rounded-[28px] border border-[#E4DBC8] bg-white p-5 shadow-[0_24px_80px_-62px_rgba(42,33,26,0.48)]">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.14em] text-[#8B7355]">Yıllık karşılaştırma</div>
                  <h2 className="mt-1 text-2xl font-black capitalize text-[#2A211A]">{selectedCategory}</h2>
                </div>
                <div className="flex gap-2">
                  <DownloadButton onClick={handleDownloadCSV}>CSV İndir</DownloadButton>
                  <DownloadButton onClick={handleDownloadJSON}>JSON İndir</DownloadButton>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="border-b border-[#E7DCCB] text-xs font-black uppercase tracking-[0.1em] text-[#8B7355]">
                    <tr>
                      <th className="py-3 pr-4">Yıl</th>
                      <th className="py-3 pr-4">Ort. Fiyat</th>
                      <th className="py-3 pr-4">Toplam İlan</th>
                      <th className="py-3 pr-4">Aktif Şehir</th>
                      <th className="py-3 pr-4">Hacim</th>
                      <th className="py-3 pr-4">Talep</th>
                      <th className="py-3">Değişim</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7DCCB]">
                    {(Object.entries(marketStats[selectedCategory]) as [YearKey, YearStats][]).map(([year, stat]) => (
                      <tr key={year} className={year === selectedYear ? "bg-[#EAF1E4]" : ""}>
                        <td className="py-3 pr-4 font-black text-[#2A211A]">{year}</td>
                        <td className="py-3 pr-4 font-semibold text-[#5C4A3D]">{stat.avgPrice} TL</td>
                        <td className="py-3 pr-4 font-semibold text-[#5C4A3D]">{stat.totalListings}</td>
                        <td className="py-3 pr-4 font-semibold text-[#5C4A3D]">{stat.topCity}</td>
                        <td className="py-3 pr-4 font-semibold text-[#5C4A3D]">{stat.totalVolume}</td>
                        <td className="py-3 pr-4"><span className="rounded-full bg-[#FAF7F2] px-3 py-1 text-xs font-black text-[#2C4C3B]">{stat.demand}</span></td>
                        <td className={`py-3 font-black ${stat.priceChange.startsWith("+") ? "text-[#2C4C3B]" : "text-[#B42318]"}`}>{stat.priceChange}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-[28px] border border-[#E4DBC8] bg-white p-5 shadow-[0_24px_80px_-62px_rgba(42,33,26,0.48)]">
              <div className="mb-5 flex items-center gap-2 text-xl font-black text-[#2A211A]">
                <Users className="h-5 w-5 text-[#2C4C3B]" />
                Dijital Kahvehane İstatistikleri
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <SmallStat label="Toplam Paylaşım" value={String(socialStats.totalPosts)} />
                <SmallStat label="Aktif Grup" value={String(socialStats.totalGroups)} />
                <SmallStat label="Toplam Yorum" value={String(socialStats.totalComments)} />
              </div>
              <div className="mt-5 space-y-2">
                {socialStats.topGroups.map((group) => (
                  <div key={group.name} className="flex items-center justify-between rounded-2xl border border-[#E7DCCB] bg-[#FAF7F2] p-3">
                    <span className="font-black text-[#2A211A]">{group.name}</span>
                    <span className="text-xs font-bold text-[#8B7355]">{group.members} üye · {group.posts} paylaşım</span>
                  </div>
                ))}
              </div>
            </section>
          </motion.div>
        )}
      </main>
    </div>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-11 rounded-2xl px-5 text-sm font-black transition ${active ? "bg-[#3A5A40] text-white" : "text-[#6E5A42] hover:bg-white"}`}
    >
      {children}
    </button>
  )
}

function Kpi({
  title,
  value,
  detail,
  icon: Icon,
  danger,
}: {
  title: string
  value: string
  detail: string
  icon: typeof TrendingUp
  danger?: boolean
}) {
  return (
    <section className="rounded-[28px] border border-[#E4DBC8] bg-white p-5 shadow-[0_24px_80px_-62px_rgba(42,33,26,0.48)]">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.12em] text-[#8B7355]">{title}</div>
          <div className="mt-2 text-3xl font-black tracking-tight text-[#2A211A]">{value}</div>
        </div>
        <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${danger ? "bg-red-50 text-[#B42318]" : "bg-[#EAF1E4] text-[#2C4C3B]"}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <div className={`text-sm font-black ${danger ? "text-[#B42318]" : "text-[#2C4C3B]"}`}>{detail}</div>
    </section>
  )
}

function ActionButton({ label, icon: Icon, onClick, danger }: { label: string; icon: typeof XCircle; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-10 w-10 items-center justify-center rounded-2xl transition ${danger ? "bg-red-50 text-[#B42318] hover:bg-red-100" : "bg-[#EAF1E4] text-[#2C4C3B] hover:bg-[#DDEAD4]"}`}
      aria-label={label}
    >
      <Icon className="h-5 w-5" />
    </button>
  )
}

function DownloadButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="hidden h-10 items-center gap-2 rounded-2xl border border-[#D6C7B1] px-4 text-xs font-black text-[#2C4C3B] transition hover:bg-[#EAF1E4] sm:flex"
    >
      <Download className="h-4 w-4" />
      {children}
    </button>
  )
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#E7DCCB] bg-[#FAF7F2] p-4">
      <div className="text-xs font-black uppercase tracking-[0.1em] text-[#8B7355]">{label}</div>
      <div className="mt-1 text-2xl font-black text-[#2A211A]">{value}</div>
    </div>
  )
}
