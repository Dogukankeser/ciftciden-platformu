"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  BriefcaseBusiness,
  Camera,
  Heart,
  Home,
  LayoutDashboard,
  Leaf,
  LogOut,
  LucideIcon,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  ShieldCheck,
  Store,
  UserRound,
  Users,
} from "lucide-react"

import { AuthModal } from "@/components/shared/AuthModal"
import { ProfileButton } from "@/components/shared/ProfileButton"
import { Button } from "@/components/ui/button"
import { clearAuthUser, getStoredUser, getUserByName, saveAuthUser } from "@/lib/auth"
import { compressImage } from "@/lib/imageUtils"
import { ProductListing, formatKg, formatPrice, getStoredListings, saveStoredListings } from "@/lib/marketData"

type ProfileState = {
  id: string
  name: string
  phone: string
  city: string
  productionProducts: string[]
  bio: string
  photo: string
  role: string
  email: string
}

type StoredPost = {
  id: string
  authorId: string
  author: string
  authorEmail: string
  authorPhoto: string
  content: string
  imageUrl: string
  likes: number
  comments: unknown[]
  time: string
}

const emptyProfile: ProfileState = {
  id: "",
  name: "",
  phone: "",
  city: "",
  productionProducts: [],
  bio: "",
  photo: "",
  role: "farmer",
  email: "",
}

const navItems = [
  { href: "/", label: "Ana Sayfa", icon: Home },
  { href: "/products", label: "Pazar Yeri", icon: Store },
  { href: "/community", label: "Dijital Kahvehane", icon: Users },
  { href: "/dashboard", label: "Tarlam", icon: LayoutDashboard },
]

const PRODUCT_OPTIONS = ["Kayısı", "Domates", "Buğday", "Elma", "Üzüm", "Zeytin", "Fındık", "Antep Fıstığı"]

const PRODUCT_CONTENT: Record<string, { title: string; text: string; finance: string }> = {
  Kayısı: {
    title: "Kayısıda kurutma dönemi için nem takibi kritik",
    text: "Malatya hattında günkurusu kalite farkını en çok nem oranı, kükürt durumu ve kalibre belirliyor.",
    finance: "Günkurusu kayısıda ortalama band 188-214 TL/kg seviyesinde.",
  },
  Domates: {
    title: "Salkım domateste günlük kesim planı öne çıkıyor",
    text: "Sera üreticileri için soğuk zincir ve sabah kesimi teklif kalitesini artırıyor.",
    finance: "Antalya halinde salkım domates 24,5-28 TL/kg bandında.",
  },
  Buğday: {
    title: "Protein değeri buğday fiyatını yukarı taşıyor",
    text: "Kantar fişi ve analiz belgesi olan partiler daha hızlı teklif topluyor.",
    finance: "Protein 13+ buğdayda alıcı ilgisi yükselişte.",
  },
  Elma: {
    title: "Depolu elmada çap ve fire oranı belirleyici",
    text: "Starking ve Golden partilerde sınıflandırma bilgisi alıcı güvenini artırıyor.",
    finance: "Seçilmiş çap elma partilerinde fiyat istikrarı korunuyor.",
  },
  Üzüm: {
    title: "Sofralık üzümde ambalaj standardı önem kazandı",
    text: "İhracata uygun kasa ve soğuk sevkiyat bilgisi ilanda net yazılmalı.",
    finance: "Manisa hattında kaliteli sofralık üzüm talebi canlı.",
  },
  Zeytin: {
    title: "Gemlik zeytinde dane boyu ve salamura planı izleniyor",
    text: "Hasat öncesi numune ve yağ oranı bilgisi tüccar kararını hızlandırıyor.",
    finance: "Dane boyu yüksek partilerde primli fiyat oluşuyor.",
  },
  Fındık: {
    title: "Fındıkta randıman bilgisi teklif kalitesini belirliyor",
    text: "Tombul fındıkta randıman ve nem analizi ilan açıklamasında öne çıkarılmalı.",
    finance: "Randıman arttıkça kg başı pazarlık gücü yükseliyor.",
  },
  "Antep Fıstığı": {
    title: "Boz iç ve kırmızı kabukta ayrıştırma fark yaratıyor",
    text: "Parti homojenliği ve boş oranı alıcının ilk sorduğu başlıklar arasında.",
    finance: "Seçilmiş kalite fıstıkta sezon öncesi talep güçlü.",
  },
}

export default function ProfilePage() {
  const params = useParams()
  const profileId = params.id as string
  const isOwnProfile = profileId === "me"

  const [mounted, setMounted] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState<ProfileState>(emptyProfile)
  const [editData, setEditData] = useState<ProfileState>(emptyProfile)
  const [posts, setPosts] = useState<StoredPost[]>([])
  const [listings, setListings] = useState<ProductListing[]>([])
  const [activeTab, setActiveTab] = useState<"posts" | "listings">("posts")

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMounted(true)
      loadProfile()
    }, 0)

    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId])

  function loadProfile() {
    const allPosts = JSON.parse(localStorage.getItem("ciftciden_posts") || "[]") as StoredPost[]
    const allListings = getStoredListings()

    if (isOwnProfile) {
      const user = getStoredUser()
      if (!user) {
        setProfile(emptyProfile)
        setEditData(emptyProfile)
        setPosts([])
        setListings([])
        return
      }

      const nextProfile = { ...emptyProfile, ...user }
      setProfile(nextProfile)
      setEditData(nextProfile)
      setPosts(allPosts.filter((post) => post.authorId === user.id))
      setListings(allListings.filter((listing) => listing.ownerId === user.id))
      return
    }

    const decodedName = decodeURIComponent(profileId)
    const storedProfile = getUserByName(profileId)
    const foundPost = allPosts.find((post) => post.author === decodedName)
    const target = storedProfile || (foundPost ?
       { ...emptyProfile, id: foundPost.authorId || "", name: foundPost.author || decodedName, photo: foundPost.authorPhoto || "" }
      : { ...emptyProfile, name: decodedName })

    setProfile(target)
    setEditData(target)
    setPosts(allPosts.filter((post) => (target.id ? post.authorId === target.id : post.author === target.name)))
    setListings(allListings.filter((listing) => (target.id ? listing.ownerId === target.id : listing.ownerName === target.name)))
  }

  const handleSaveProfile = () => {
    if (!profile.id) return

    const previousName = profile.name
    const saved = saveAuthUser({
      id: profile.id,
      email: profile.email,
      name: editData.name,
      phone: editData.phone,
      city: editData.city,
      productionProducts: editData.productionProducts,
      bio: editData.bio,
      photo: editData.photo,
      role: (editData.role || "farmer") as "farmer" | "merchant",
      provider: "google",
    })

    const allPosts = JSON.parse(localStorage.getItem("ciftciden_posts") || "[]") as StoredPost[]
    const updatedPosts = allPosts.map((post) =>
      post.authorId === saved.id || (!post.authorId && post.author === previousName) ?
         { ...post, authorId: saved.id, authorEmail: saved.email, author: saved.name, authorPhoto: saved.photo }
        : post,
    )
    localStorage.setItem("ciftciden_posts", JSON.stringify(updatedPosts))

    const updatedListings = getStoredListings().map((listing) =>
      listing.ownerId === saved.id || (!listing.ownerId && listing.ownerName === previousName) ?
         {
            ...listing,
            ownerId: saved.id,
            ownerEmail: saved.email,
            ownerPhoto: saved.photo,
            ownerName: saved.name,
            ownerPhone: saved.phone || listing.ownerPhone,
            ownerRole: saved.role === "merchant" ? "Tüccar" : "Üretici",
          }
        : listing,
    )
    saveStoredListings(updatedListings)

    const nextProfile = { ...emptyProfile, ...saved }
    setProfile(nextProfile)
    setEditData(nextProfile)
    setPosts(updatedPosts.filter((post) => post.authorId === saved.id))
    setListings(updatedListings.filter((listing) => listing.ownerId === saved.id))
    setIsEditing(false)
  }

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const photo = await compressImage(file, 900, 0.85)
    setEditData((previous) => ({ ...previous, photo }))
  }

  const handleLogout = () => {
    clearAuthUser()
    window.location.href = "/"
  }

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9F8F6]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#3A5A40] border-t-transparent" />
      </div>
    )
  }

  if (isOwnProfile && !profile.id) {
    return (
      <div className="min-h-screen bg-[#F9F8F6]">
        <ProfileHeader />
        <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} onSuccess={() => loadProfile()} title="Profilinizi yönetmek için giriş yapın" />
        <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-5">
          <section className="max-w-md rounded-[28px] border border-[#E4DBC8] bg-white p-7 text-center shadow-[0_24px_80px_-62px_rgba(42,33,26,0.48)]">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF1E4] text-[#2C4C3B]">
              <UserRound className="h-8 w-8" />
            </div>
            <h1 className="mb-2 text-2xl font-black text-[#2A211A]">Profilinize giriş yapın</h1>
            <p className="mb-6 text-sm font-medium leading-7 text-[#6E5A42]">
              Paylaşımlarınızı, ilanlarınızı ve iletişim bilgilerinizi tek yerden yönetmek için hesabınızla giriş yapın.
            </p>
            <Button className="w-full bg-[#3A5A40] font-bold text-white hover:bg-[#2C4C3B]" onClick={() => setAuthOpen(true)}>
              Giriş Yap
            </Button>
          </section>
        </div>
      </div>
    )
  }

  const roleLabel = profile.role === "merchant" ? "Tüccar" : "Üretici"
  const totalKg = listings.reduce((sum, item) => sum + (item.quantityKg || 0), 0)
  const profileProducts = profile.productionProducts?.length ? profile.productionProducts : ["Kayısı", "Buğday"]
  const productContents = profileProducts.map((product) => PRODUCT_CONTENT[product]).filter(Boolean)

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#2A211A]">
      <ProfileHeader />

      <main className="mx-auto w-full max-w-[1500px] px-4 py-7 sm:px-6 lg:px-8">
        <Link href="/products" className="mb-5 inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-black text-[#5C4A3D] transition hover:bg-white hover:text-[#2C4C3B]">
          <ArrowLeft className="h-4 w-4" />
          Geri dön
        </Link>

        <section className="overflow-hidden rounded-[32px] border border-[#E4DBC8] bg-white shadow-[0_24px_80px_-62px_rgba(42,33,26,0.48)]">
          <div className="grid gap-0 lg:grid-cols-[360px_1fr]">
            <aside className="bg-[#2C4C3B] p-6 text-[#F9F8F6] sm:p-8">
              <div className="flex flex-col items-center text-center">
                <div className="relative h-32 w-32 overflow-hidden rounded-[28px] border-4 border-white/20 bg-[#EAF1E4] shadow-xl">
                  {(isEditing ? editData.photo : profile.photo) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={isEditing ? editData.photo : profile.photo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[#2C4C3B]">
                      <UserRound className="h-14 w-14" />
                    </div>
                  )}
                  {isEditing && (
                    <label className="absolute bottom-2 right-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#D97742] text-white shadow-lg">
                      <Camera className="h-4 w-4" />
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                    </label>
                  )}
                </div>

                {isEditing ? (
                  <input
                    value={editData.name}
                    onChange={(event) => setEditData((previous) => ({ ...previous, name: event.target.value }))}
                    className="mt-5 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-center text-2xl font-black text-white outline-none placeholder:text-white/50 focus:border-[#E88C5D]"
                  />
                ) : (
                  <h1 className="mt-5 max-w-full text-safe text-3xl font-black tracking-tight">{profile.name || "İsimsiz Profil"}</h1>
                )}

                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-xs font-black text-[#E8DDCD]">
                  <ShieldCheck className="h-4 w-4 text-[#E88C5D]" />
                  {roleLabel}
                </div>

                <div className="mt-6 grid w-full grid-cols-3 gap-2">
                  <DarkStat label="Paylaşım" value={String(posts.length)} />
                  <DarkStat label="İlan" value={String(listings.length)} />
                  <DarkStat label="Tonaj" value={totalKg ? formatKg(totalKg) : "0 kg"} />
                </div>
              </div>
            </aside>

            <div className="p-5 sm:p-8">
              <div className="flex flex-col justify-between gap-4 border-b border-[#E7DCCB] pb-6 lg:flex-row lg:items-start">
                <div className="min-w-0">
                  <div className="text-xs font-black uppercase tracking-[0.14em] text-[#8B7355]">Profilim</div>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-[#2A211A]">Hesap ve üretici vitrini</h2>
                  <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-[#6E5A42]">
                    Profil bilgileri, kullanıcıya ait paylaşımlar ve ilanlar aynı ekranda yönetilir. Alıcılar bu sayfada üreticiyi daha güvenli tanır.
                  </p>
                </div>

                {isOwnProfile && (
                  <div className="flex flex-wrap gap-2">
                    {isEditing ? (
                      <>
                        <Button variant="outline" className="button-safe border-[#D6C7B1] font-bold text-[#5C4A3D]" onClick={() => { setIsEditing(false); setEditData(profile) }}>
                          İptal
                        </Button>
                        <Button className="button-safe bg-[#3A5A40] font-bold text-white hover:bg-[#2C4C3B]" onClick={handleSaveProfile}>
                          Kaydet
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="outline" className="button-safe gap-2 border-[#D6C7B1] font-bold text-[#2C4C3B]" onClick={() => setIsEditing(true)}>
                          <Pencil className="h-4 w-4" />
                          Profili Düzenle
                        </Button>
                        <Button variant="ghost" className="button-safe gap-2 text-[#8F4720]" onClick={handleLogout}>
                          <LogOut className="h-4 w-4" />
                          Çıkış
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_330px]">
                <section className="rounded-[28px] border border-[#E4DBC8] bg-[#FAF7F2] p-5">
                  {isEditing ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Telefon" value={editData.phone} onChange={(value) => setEditData((previous) => ({ ...previous, phone: value }))} placeholder="05XX XXX XX XX" />
                      <Field label="Şehir" value={editData.city} onChange={(value) => setEditData((previous) => ({ ...previous, city: value }))} placeholder="Malatya" />
                      <div className="space-y-2 sm:col-span-2">
                        <span className="text-xs font-black uppercase tracking-[0.12em] text-[#8B7355]">Ürettiği ürünler</span>
                        <div className="grid gap-2 sm:grid-cols-4">
                          {PRODUCT_OPTIONS.map((product) => {
                            const selected = editData.productionProducts.includes(product)
                            return (
                              <button
                                key={product}
                                type="button"
                                onClick={() =>
                                  setEditData((previous) => ({
                                    ...previous,
                                    productionProducts: selected
                                      ? previous.productionProducts.filter((item) => item !== product)
                                      : [...previous.productionProducts, product],
                                  }))
                                }
                                className={`rounded-2xl border px-3 py-2 text-sm font-black transition ${
                                  selected ? "border-[#3A5A40] bg-[#EAF1E4] text-[#2C4C3B]" : "border-[#DED1BC] bg-white text-[#8B7355]"
                                }`}
                              >
                                {product}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                      <label className="space-y-2">
                        <span className="text-xs font-black uppercase tracking-[0.12em] text-[#8B7355]">Hesap türü</span>
                        <select
                          value={editData.role}
                          onChange={(event) => setEditData((previous) => ({ ...previous, role: event.target.value }))}
                          className="h-11 w-full rounded-2xl border border-[#DED1BC] bg-white px-3 text-sm font-semibold outline-none focus:border-[#2C4C3B]"
                        >
                          <option value="farmer">Üretici</option>
                          <option value="merchant">Tüccar</option>
                        </select>
                      </label>
                      <label className="space-y-2 sm:col-span-2">
                        <span className="text-xs font-black uppercase tracking-[0.12em] text-[#8B7355]">Hakkında</span>
                        <textarea
                          value={editData.bio}
                          onChange={(event) => setEditData((previous) => ({ ...previous, bio: event.target.value }))}
                          placeholder="Üretim yaptığınız ürünler, bölgeniz, tecrübeniz ve çalışma şekliniz..."
                          className="min-h-32 w-full resize-none rounded-2xl border border-[#DED1BC] bg-white px-4 py-3 text-sm font-medium leading-6 outline-none focus:border-[#2C4C3B]"
                        />
                      </label>
                    </div>
                  ) : (
                    <div>
                      <h3 className="mb-3 text-xl font-black text-[#2A211A]">Profil Bilgileri</h3>
                      <p className="text-safe min-h-14 text-sm font-medium leading-7 text-[#5C4A3D]">
                        {profile.bio || "Henüz hakkında bilgisi eklenmemiş. Profil düzenlendiğinde üretim alanı, ürün tecrübesi ve çalışma şekli burada görünür."}
                      </p>
                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <Info icon={Phone} label="Telefon" value={profile.phone || "Eklenmedi"} />
                        <Info icon={MapPin} label="Şehir" value={profile.city || "Eklenmedi"} />
                        <Info icon={BriefcaseBusiness} label="Hesap türü" value={roleLabel} />
                        <Info icon={Mail} label="E-posta" value={profile.email || "Gizli"} />
                      </div>
                      <div className="mt-5 flex flex-wrap gap-2">
                        {profileProducts.map((product) => (
                          <span key={product} className="rounded-full bg-[#EAF1E4] px-3 py-1.5 text-xs font-black text-[#2C4C3B]">
                            {product}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </section>

                <section className="rounded-[28px] bg-[#2C4C3B] p-5 text-[#F9F8F6]">
                  <ShieldCheck className="h-8 w-8 text-[#E88C5D]" />
                  <h3 className="mt-4 text-xl font-black">Güven vitrini</h3>
                  <p className="mt-3 text-sm font-semibold leading-7 text-[#E8DDCD]">
                    İlanlar, paylaşımlar ve tamamlanan profil bilgileri alıcı için güçlü bir ilk izlenim oluşturur.
                  </p>
                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/15">
                    <div className="h-full rounded-full bg-[#D97742]" style={{ width: `${Math.min(100, 45 + listings.length * 12 + posts.length * 8)}%` }} />
                  </div>
                </section>

                <section className="rounded-[28px] border border-[#E4DBC8] bg-white p-5 xl:col-span-2">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-black uppercase tracking-[0.14em] text-[#8B7355]">Ürüne özel içerikler</div>
                      <h3 className="mt-1 text-xl font-black text-[#2C4C3B]">Haberler ve finans notları</h3>
                    </div>
                    <span className="rounded-full bg-[#FAF7F2] px-3 py-1.5 text-xs font-black text-[#8B7355]">
                      {profileProducts.join(" · ")}
                    </span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    {productContents.slice(0, 3).map((item) => (
                      <article key={item.title} className="rounded-3xl border border-[#E7DCCB] bg-[#FAF7F2] p-4">
                        <h4 className="text-sm font-black leading-5 text-[#2A211A]">{item.title}</h4>
                        <p className="mt-2 text-xs font-semibold leading-5 text-[#6E5A42]">{item.text}</p>
                        <div className="mt-3 rounded-2xl bg-white px-3 py-2 text-xs font-black text-[#2C4C3B]">
                          {item.finance}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[32px] border border-[#E4DBC8] bg-white p-5 shadow-[0_24px_80px_-62px_rgba(42,33,26,0.48)]">
          <div className="mb-5 flex flex-wrap gap-2 border-b border-[#E7DCCB] pb-4">
            <Tab active={activeTab === "posts"} onClick={() => setActiveTab("posts")}>Paylaşımlar</Tab>
            <Tab active={activeTab === "listings"} onClick={() => setActiveTab("listings")}>İlanlar</Tab>
          </div>

          {activeTab === "posts" ? (
            posts.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {posts.map((post) => (
                  <article key={post.id} className="rounded-[24px] border border-[#E7DCCB] bg-[#FAF7F2] p-4">
                    <p className="text-safe mb-3 line-clamp-4 text-sm font-medium leading-7 text-[#3D3228]">{post.content}</p>
                    {post.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.imageUrl} alt="" className="mb-3 max-h-64 w-full rounded-2xl bg-white object-contain" />
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-xs font-black text-[#8B7355]">
                      <span className="inline-flex items-center gap-1"><Heart className="h-4 w-4" /> {post.likes || 0}</span>
                      <span className="inline-flex items-center gap-1"><MessageCircle className="h-4 w-4" /> {post.comments.length || 0}</span>
                      <span className="ml-auto">{post.time}</span>
                    </div>
                  </article>
                ))}
              </div>
            ) : <Empty icon={MessageCircle} text="Henüz paylaşım yok." />
          ) : (
            listings.length ? (
              <div className="grid gap-4 md:grid-cols-3">
                {listings.map((item) => (
                  <Link key={item.id} href={`/products/${item.id}`} className="group overflow-hidden rounded-[24px] border border-[#E7DCCB] bg-[#FAF7F2] transition hover:border-[#C8D8BD] hover:bg-white">
                    <div className="h-40 bg-[#EEE7DA]">
                      {item.imageUrls?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imageUrls[0]} alt="" className="h-full w-full object-cover transition group-hover:scale-[1.03]" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[#8FA37D]"><Leaf className="h-8 w-8" /></div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-safe line-clamp-2 text-sm font-black text-[#2A211A]">{item.title}</h3>
                      <div className="mt-3 flex items-center justify-between gap-3 text-xs font-black text-[#8B7355]">
                        <span className="min-w-0 text-safe">{item.city}</span>
                        <span className="shrink-0 text-[#2C4C3B]">{item.pricePerKg ? `${formatPrice(item.pricePerKg)}/kg` : "Teklif"}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : <Empty icon={Store} text="Henüz ilan yok." />
          )}
        </section>
      </main>
    </div>
  )
}

function ProfileHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#E4DBC8] bg-[#F9F8F6]/92 shadow-[0_10px_30px_-24px_rgba(42,33,26,0.45)] backdrop-blur-xl">
      <div className="mx-auto flex h-20 w-full max-w-[1800px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="Çiftçiden ana sayfa">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#3A5A40] shadow-[0_12px_28px_-14px_rgba(58,90,64,0.9)]">
            <Leaf className="h-5 w-5 text-[#F9F8F6]" />
          </span>
          <span className="text-xl font-black tracking-tight text-[#2C4C3B]">Çiftçiden</span>
        </Link>

        <nav className="ml-auto hidden shrink-0 items-center gap-1 rounded-[22px] border border-[#E4DBC8] bg-white/72 p-1 shadow-[0_12px_30px_-24px_rgba(42,33,26,0.55)] 2xl:flex">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-2xl px-3.5 text-sm font-extrabold text-[#5C4A3D] transition hover:bg-[#FAF7F2] hover:text-[#2C4C3B]"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <ProfileButton />
      </div>
    </header>
  )
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-black uppercase tracking-[0.12em] text-[#8B7355]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-2xl border border-[#DED1BC] bg-white px-4 text-sm font-semibold outline-none placeholder:text-[#8B7355] focus:border-[#2C4C3B]"
      />
    </label>
  )
}

function Info({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-[#E7DCCB] bg-white p-3">
      <Icon className="h-4 w-4 shrink-0 text-[#2C4C3B]" />
      <div className="min-w-0">
        <div className="text-[10px] font-black uppercase tracking-[0.1em] text-[#8B7355]">{label}</div>
        <div className="text-safe text-sm font-black text-[#2A211A]">{value}</div>
      </div>
    </div>
  )
}

function DarkStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/12 p-3">
      <div className="text-[10px] font-black uppercase tracking-[0.12em] text-[#D7C9B2]">{label}</div>
      <div className="text-safe mt-1 text-sm font-black">{value}</div>
    </div>
  )
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`button-safe rounded-2xl px-4 py-2 text-sm font-black transition ${active ? "bg-[#3A5A40] text-white" : "text-[#6E5A42] hover:bg-[#FAF7F2]"}`}
    >
      {children}
    </button>
  )
}

function Empty({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center text-center text-[#8B7355]">
      <Icon className="mb-3 h-10 w-10 opacity-45" />
      <p className="text-sm font-black">{text}</p>
    </div>
  )
}
