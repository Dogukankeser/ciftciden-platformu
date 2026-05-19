"use client"

import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Info,
  Leaf,
  Loader2,
  ShieldCheck,
  Sparkles,
  Truck,
  UploadCloud,
  X,
} from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ProfileButton } from "@/components/shared/ProfileButton"
import { getStoredUser } from "@/lib/auth"
import {
  CATEGORY_OPTIONS,
  ProductListing,
  PROVINCES,
  estimateFairPriceLocal,
  formatKg,
  formatPrice,
  upsertListing,
} from "@/lib/marketData"

type FormData = {
  category: string
  variety: string
  productType: string
  title: string
  city: string
  district: string
  quantity: string
  priceType: "offer" | "fixed"
  price: string
  description: string
  grade: string
  harvestDate: string
  stockLocation: string
  packaging: string
  delivery: string
  payment: string
  certificates: string
  moisture: string
  size: string
  phone: string
  dynamicDetails: Record<string, string>
}

type Quote = {
  min: number
  max: number
  confidence: number
  source: "backend" | "local"
  status: "idle" | "loading" | "ready"
}

type ListingTrustResult = {
  trustScore: number
  comment: string
  source: "gemini" | "local"
}

const defaultForm: FormData = {
  category: "",
  variety: "",
  productType: "",
  title: "",
  city: "",
  district: "",
  quantity: "",
  priceType: "offer",
  price: "",
  description: "",
  grade: "1. Kalite",
  harvestDate: "",
  stockLocation: "",
  packaging: "25 kg çuval veya kasa",
  delivery: "Yerinde teslim, nakliye alıcıya ait",
  payment: "Kapora + teslim onayı sonrası ödeme",
  certificates: "ÇKS kaydı",
  moisture: "",
  size: "",
  phone: "",
  dynamicDetails: {},
}

const PRODUCT_GUIDES: Record<string, {
  typeLabel: string
  typeOptions: string[]
  fields: { key: string; label: string; placeholder: string; required?: boolean }[]
  tips: string[]
}> = {
  "kayısı": {
    typeLabel: "Kayısı tipi",
    typeOptions: ["Gün kurusu kayısı", "Sarı kayısı", "Yaş kayısı", "Kükürtsüz kuru kayısı", "Kükürtlü kuru kayısı", "Endüstriyel kayısı"],
    fields: [
      { key: "kurutma", label: "Kurutma / işleme", placeholder: "Güneşte doğal, islimli, taze hasat...", required: true },
      { key: "kukurtdurumu", label: "Kükürt durumu", placeholder: "Kükürtsüz, düşük kükürt, sarı islimli..." },
      { key: "kalibre", label: "Boy / kalibre", placeholder: "Jumbo, 1 numara, 2 numara, elek üstü...", required: true },
      { key: "renk", label: "Renk ve görünüm", placeholder: "Açık sarı, koyu günkurusu, homojen renk..." },
      { key: "fire", label: "Fire / kusur oranı", placeholder: "Çekirdek kırığı az, lekeli oranı düşük..." },
    ],
    tips: ["Kayısıda tip, nem, kükürt durumu ve kalibre fiyatı doğrudan etkiler.", "Yaş kayısı seçildiğinde soğuk zincir ve hasat günü bilgisi özellikle önemlidir."],
  },
  domates: {
    typeLabel: "Domates tipi",
    typeOptions: ["Salkım domates", "Sırık domates", "Cherry domates", "Tarla domatesi", "Salçalık domates"],
    fields: [
      { key: "uretim", label: "Üretim şekli", placeholder: "Sera, açık tarla, topraksız tarım...", required: true },
      { key: "brix", label: "Brix / tat oranı", placeholder: "4.8, 5.2, ölçüm yok..." },
      { key: "ambalaj", label: "Kasa / ambalaj", placeholder: "6 kg kasa, 12 kg kasa, dökme..." },
      { key: "kesim", label: "Kesim durumu", placeholder: "Günlük kesim, haftalık parti, dalında..." },
    ],
    tips: ["Domateste günlük kesim, kasa tipi ve sera/tarla bilgisi alıcı kararını hızlandırır."],
  },
  elma: {
    typeLabel: "Elma tipi",
    typeOptions: ["Starking", "Golden", "Granny Smith", "Fuji", "Amasya", "Depoluk elma"],
    fields: [
      { key: "cap", label: "Çap / kalibre", placeholder: "70-80 mm, 75-85 mm...", required: true },
      { key: "depo", label: "Depolama", placeholder: "Soğuk hava, normal depo, bahçe teslim..." },
      { key: "sertlik", label: "Sertlik / durum", placeholder: "Sert, diri, depo çıkışı, yeni hasat..." },
      { key: "renk", label: "Renk oranı", placeholder: "%80 kırmızı, canlı yeşil..." },
    ],
    tips: ["Elmada çap, depo koşulu ve sertlik fiyatı belirleyen temel sinyallerdir."],
  },
  "buğday": {
    typeLabel: "Buğday tipi",
    typeOptions: ["Ekmeklik buğday", "Makarnalık buğday", "Sert Anadolu", "Yemlik buğday"],
    fields: [
      { key: "protein", label: "Protein", placeholder: "13.2, 12.5, analiz yok...", required: true },
      { key: "hektolitre", label: "Hektolitre", placeholder: "79, 80, ölçüm yok..." },
      { key: "rutubet", label: "Rutubet", placeholder: "%11.8, %12.5..." },
      { key: "depo", label: "Depo / teslim", placeholder: "Lisanslı depo, silo, kamyon üstü..." },
    ],
    tips: ["Buğdayda protein, hektolitre ve rutubet fiyat pazarlığında kritik veridir."],
  },
  "üzüm": {
    typeLabel: "Üzüm tipi",
    typeOptions: ["Sultani", "Çekirdeksiz", "Sofralık üzüm", "Kurutmalık üzüm", "Şaraplık üzüm"],
    fields: [
      { key: "brix", label: "Brix / şeker", placeholder: "20+, 18-20..." },
      { key: "salkim", label: "Salkım yapısı", placeholder: "İri salkım, sık taneli, seyrek..." },
      { key: "kullanim", label: "Kullanım amacı", placeholder: "Sofralık, kurutmalık, ihracat..." },
      { key: "sogutma", label: "Ön soğutma", placeholder: "Var, yok, alıcı talebine göre..." },
    ],
    tips: ["Üzümde brix, salkım formu ve ön soğutma bilgisi alıcı için ayırt edicidir."],
  },
  "antepfıstığı": {
    typeLabel: "Fıstık tipi",
    typeOptions: ["Kırmızı kabuk", "Boz iç", "Siirt", "Kavrulmalık", "Çıtlamış fıstık"],
    fields: [
      { key: "randiman", label: "Randıman", placeholder: "%52, %48, analiz bekliyor..." },
      { key: "nem", label: "Nem", placeholder: "%5.8, %6.2..." },
      { key: "aflatoksin", label: "Aflatoksin analizi", placeholder: "Var, yok, talep üzerine..." },
      { key: "boy", label: "Boy / elek", placeholder: "İri, orta, elek üstü..." },
    ],
    tips: ["Antep fıstığında analiz, nem ve randıman güvenli ticaret için özellikle önemlidir."],
  },
  zeytin: {
    typeLabel: "Zeytin tipi",
    typeOptions: ["Gemlik", "Domat", "Ayvalık", "Memecik", "Yağlık zeytin", "Sofralık zeytin"],
    fields: [
      { key: "kalibre", label: "Kalibre", placeholder: "201-230, 231-260..." },
      { key: "kullanim", label: "Kullanım", placeholder: "Sofralık, yağlık, salamuralık..." },
      { key: "hasat", label: "Hasat şekli", placeholder: "Elle toplama, silkme, bahçe teslim..." },
      { key: "asit", label: "Asit / yağ oranı", placeholder: "Analiz varsa yazın..." },
    ],
    tips: ["Zeytinde kullanım amacı, kalibre ve hasat şekli alıcı segmentini belirler."],
  },
  "fındık": {
    typeLabel: "Fındık tipi",
    typeOptions: ["Tombul", "Levant", "Sivri", "Palaz", "Kavrulmalık fındık"],
    fields: [
      { key: "randiman", label: "Randıman", placeholder: "52, 50, analiz yok...", required: true },
      { key: "nem", label: "Nem", placeholder: "%6.2, %7..." },
      { key: "kurutma", label: "Kurutma", placeholder: "Patoz sonrası kurutuldu, serender..." },
      { key: "ambalaj", label: "Çuval / ambalaj", placeholder: "80 kg jüt çuval, dökme..." },
    ],
    tips: ["Fındıkta randıman ve nem değeri fiyatın ana belirleyicisidir."],
  },
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.readAsDataURL(file)
  })
}

export default function CreateListingPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [formData, setFormData] = useState<FormData>(defaultForm)
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([])
  const [draggedPhotoIndex, setDraggedPhotoIndex] = useState<number | null>(null)
  const [quote, setQuote] = useState<Quote>({ min: 0, max: 0, confidence: 0, source: "local", status: "idle" })
  const [publishedId, setPublishedId] = useState("")
  const [isPublishing, setIsPublishing] = useState(false)

  const selectedCategory = CATEGORY_OPTIONS.find((item) => item.slug === formData.category) || CATEGORY_OPTIONS[0]
  const productGuide = PRODUCT_GUIDES[formData.category]
  const quantityKg = Number(formData.quantity) || 0

  const completion = useMemo(() => {
    const required: Array<string | boolean> = [formData.category, formData.variety, formData.productType || !PRODUCT_GUIDES[formData.category], formData.title, formData.city, formData.district, formData.quantity, formData.description, formData.harvestDate]
    return Math.round((required.filter(Boolean).length / required.length) * 100)
  }, [formData])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const userPhone = localStorage.getItem("user_phone")
      if (userPhone) setFormData((prev) => ({ ...prev, phone: userPhone }))
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!formData.category || !formData.city || !formData.grade || quantityKg <= 0) {
      const idleTimer = window.setTimeout(() => {
        setQuote({ min: 0, max: 0, confidence: 0, source: "local", status: "idle" })
      }, 0)
      return () => window.clearTimeout(idleTimer)
    }

    const local = estimateFairPriceLocal({
      category: formData.category,
      city: formData.city,
      grade: formData.grade,
      quantityKg,
    })

    const loadingTimer = window.setTimeout(() => {
      setQuote({ ...local, source: "local", status: "loading" })
    }, 0)

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch("http://localhost:8000/api/v1/ai/price", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            category: formData.category,
            variety: formData.variety || formData.category,
            city: formData.city,
            quality_grade: formData.grade,
            quantity_kg: quantityKg,
          }),
        })

        if (!response.ok) throw new Error("price service unavailable")
        const data = await response.json()
        if (!data.estimated_min_price || !data.estimated_max_price) throw new Error("price service fallback")

        setQuote({
          min: Number(data.estimated_min_price),
          max: Number(data.estimated_max_price),
          confidence: Math.round(Number(data.confidence_level) * (Number(data.confidence_level) <= 1 ? 100 : 1)),
          source: "backend",
          status: "ready",
        })
      } catch {
        setQuote({ ...local, source: "local", status: "ready" })
      }
    }, 450)

    return () => {
      controller.abort()
      window.clearTimeout(loadingTimer)
      window.clearTimeout(timer)
    }
  }, [formData.category, formData.variety, formData.city, formData.grade, quantityKg])

  const setField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleCategory = (category: string) => {
    const meta = CATEGORY_OPTIONS.find((item) => item.slug === category)
    if (!meta) return
    setFormData((prev) => ({
      ...prev,
      category,
      variety: meta.varieties[0] || "",
      productType: PRODUCT_GUIDES[category]?.typeOptions[0] || "",
      dynamicDetails: {},
      grade: meta.qualities[0] || "1. Kalite",
    }))
  }

  const setDynamicDetail = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      dynamicDetails: {
        ...prev.dynamicDetails,
        [key]: value,
      },
    }))
  }

  const generateAiDescription = () => {
    if (!selectedCategory || !productGuide) return

    const detailText = productGuide.fields
      .map((field) => {
        const value = formData.dynamicDetails[field.key]
        return value ? `${field.label.toLocaleLowerCase("tr-TR")}: ${value}` : ""
      })
      .filter(Boolean)
      .join(", ")

    const location = [formData.city, formData.district].filter(Boolean).join(" / ")
    const quantity = formData.quantity ? `${Number(formData.quantity).toLocaleString("tr-TR")} kg` : "belirtilen miktarda"
    const priceText = formData.priceType === "fixed" && formData.price ?
       `${formData.price} TL/kg sabit fiyatla`
      : "teklif usulü"

    const generated = `${location || "Üretim bölgesinden"} ${formData.productType || selectedCategory.name} partisi. ${formData.variety ? `${formData.variety} çeşidi, ` : ""}${formData.grade.toLocaleLowerCase("tr-TR")} kalite, ${quantity} ürün ${priceText} satışa uygundur. ${detailText ? `Ürün özellikleri: ${detailText}. ` : ""}Hasat, numune, yükleme ve teslimat koşulları alıcı ile netleştirilebilir.`

    setFormData((prev) => ({
      ...prev,
      description: generated,
    }))
  }

  const handleAddPhotos = async (fileList: FileList) => {
    const newFiles = Array.from(fileList).slice(0, 5 - photos.length)
    const newPhotos = await Promise.all(newFiles.map(async (file) => ({
      file,
      preview: await fileToDataUrl(file),
    })))
    setPhotos((prev) => [...prev, ...newPhotos].slice(0, 5))
  }

  const movePhoto = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return
    setPhotos((prev) => {
      const updated = [...prev]
      const [moved] = updated.splice(fromIndex, 1)
      updated.splice(toIndex, 0, moved)
      return updated
    })
  }

  const handlePhotoDrop = (targetIndex: number) => {
    if (draggedPhotoIndex === null) return
    movePhoto(draggedPhotoIndex, targetIndex)
    setDraggedPhotoIndex(null)
  }

  const analyzeListingTrust = async (localQuote: Quote): Promise<ListingTrustResult> => {
    const payload = {
      title: formData.title,
      category: formData.category,
      variety: formData.variety,
      productType: formData.productType,
      city: formData.city,
      district: formData.district,
      quantityKg,
      pricePerKg: formData.priceType === "fixed" ? Number(formData.price) || 0 : 0,
      priceType: formData.priceType,
      description: formData.description,
      grade: formData.grade,
      harvestDate: formData.harvestDate,
      stockLocation: formData.stockLocation,
      packaging: formData.packaging,
      delivery: formData.delivery,
      payment: formData.payment,
      certificates: formData.certificates.split(",").map((item) => item.trim()).filter(Boolean),
      moisture: formData.moisture,
      size: formData.size,
      dynamic: formData.dynamicDetails,
      fairMin: localQuote.min,
      fairMax: localQuote.max,
    }

    const localScore = Math.min(
      96,
      Math.max(
        62,
        58 +
          (photos.length ? 12 : 0) +
          (formData.description.length > 90 ? 8 : 3) +
          (formData.certificates ? 4 : 0) +
          (formData.delivery ? 4 : 0) +
          (formData.payment ? 4 : 0) +
          Math.min(6, Object.values(formData.dynamicDetails).filter(Boolean).length * 2),
      ),
    )
    const localComment =
      localScore >= 86
        ? "Fotoğraf, açıklama ve ticari bilgiler güçlü; ilan alıcı için güven veren bir parti görünümünde."
        : "İlan anlaşılır durumda; daha net analiz, belge veya yakın plan fotoğraf teklif kalitesini artırır."

    try {
      const body = new FormData()
      body.append("payload", JSON.stringify(payload))
      if (photos[0]?.file) body.append("image", photos[0].file, "ilan-kapak.jpg")

      const response = await fetch("http://localhost:8000/api/v1/ai/listing-trust", {
        method: "POST",
        body,
      })

      if (!response.ok) throw new Error("listing trust unavailable")
      const data = await response.json()

      return {
        trustScore: Number(data.trust_score || localScore),
        comment: String(data.comment || localComment),
        source: data.source === "gemini" ? "gemini" : "local",
      }
    } catch {
      return {
        trustScore: localScore,
        comment: localComment,
        source: "local",
      }
    }
  }

  const handlePublish = async () => {
    if (isPublishing) return
    setIsPublishing(true)
    const currentUser = getStoredUser()
    const ownerName = currentUser?.name || localStorage.getItem("user_name") || "Üretici"
    const ownerRole = (currentUser?.role || localStorage.getItem("user_role")) === "merchant" ? "Tüccar" : "Üretici"
    const localQuote: Quote = quote.status === "idle" ?
       { ...estimateFairPriceLocal({ category: formData.category, city: formData.city, grade: formData.grade, quantityKg }), source: "local", status: "ready" }
      : quote
    const listingTrust = await analyzeListingTrust(localQuote)

    const listing: ProductListing = {
      id: `user_${Date.now()}`,
      title: formData.title,
      category: formData.category,
      variety: formData.variety,
      city: formData.city,
      district: formData.district,
      quantityKg,
      pricePerKg: formData.priceType === "fixed" ? Number(formData.price) || 0 : 0,
      priceType: formData.priceType,
      description: formData.description,
      ownerId: currentUser?.id || "",
      ownerEmail: currentUser?.email || "",
      ownerPhoto: currentUser?.photo || "",
      ownerName,
      ownerRole,
      ownerPhone: formData.phone || "Profil üzerinden iletişim",
      createdAt: new Date().toISOString(),
      harvestDate: formData.harvestDate,
      stockLocation: formData.stockLocation || `${formData.city} / ${formData.district}`,
      grade: formData.grade,
      moisture: formData.moisture || "",
      brix: "",
      size: formData.size || "",
      packaging: formData.packaging,
      delivery: formData.delivery,
      payment: formData.payment,
      certificates: formData.certificates.split(",").map((item) => item.trim()).filter(Boolean),
      imageUrls: photos.map((photo) => photo.preview),
      dynamic: {
        ürünTipi: formData.productType,
        çeşit: formData.variety,
        kalite: formData.grade,
        kalibre: formData.size,
        ...formData.dynamicDetails,
      },
      ai: {
        fairMin: localQuote.min,
        fairMax: localQuote.max,
        confidence: localQuote.confidence,
        qualityScore: photos.length > 0 ? 90 : 82,
        analysis: localQuote.source === "backend" ?
           "Hal fiyatı, kalite ve tonaj birlikte değerlendirilerek hesaplandı."
          : "Kategori, şehir, kalite ve tonaja göre tahmini piyasa aralığı hazırlandı.",
        risk: photos.length > 0 && formData.certificates ? "Düşük" : "Orta",
        trustScore: listingTrust.trustScore,
        listingComment: listingTrust.comment,
        trustSource: listingTrust.source,
      },
      seller: {
        trustScore: 8.8,
        verified: true,
        completedTrades: 0,
        responseTime: "Yeni ilan",
      },
      metrics: {
        views: 0,
        offers: 0,
        favorites: 0,
      },
    }

    upsertListing(listing)
    setPublishedId(listing.id)
    setStep(3)
    setIsPublishing(false)
  }

  const canGoNext = completion >= 100 && (formData.priceType === "offer" || Number(formData.price) > 0)

  return (
    <div className="min-h-screen bg-[#F9F8F6] px-4 py-7 text-[#2A211A]">
      <div className="mx-auto max-w-[1500px]">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link href="/products" className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E4DBC8] bg-white text-[#5C4A3D] transition-colors hover:bg-[#FAF7F2] hover:text-[#2C4C3B]">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-safe text-3xl font-black text-[#2A211A]">İlan Oluştur</h1>
              <p className="text-safe text-sm text-[#6e5a42]">Ürün bilgisi, kalite, lojistik ve piyasa aralığı tek akışta hazırlanır.</p>
            </div>
          </div>
          <div className="hidden sm:block text-right">
            <div className="text-xs font-bold text-[#8b7355] mb-1">İlan doluluk skoru</div>
            <div className="h-2 w-40 rounded-full bg-[#f0e8dc] overflow-hidden">
              <div className="h-full gradient-green transition-all" style={{ width: `${completion}%` }} />
            </div>
          </div>
          <ProfileButton />
        </div>

        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid lg:grid-cols-[1fr_330px] gap-6">
            <div className="space-y-5">
              <Card className="border-0 card-glass rounded-[28px]">
                <CardContent className="p-6 space-y-6">
                  <SectionTitle icon={Leaf} title="Ürün Kimliği" />

                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {CATEGORY_OPTIONS.map((category) => (
                      <button
                        key={category.slug}
                        onClick={() => handleCategory(category.slug)}
                        className={`button-safe h-20 rounded-2xl border-2 px-3 text-left transition-all ${formData.category === category.slug ? "border-[#2C4C3B] bg-[#EAF1E4] text-[#2A211A]" : "border-[#E4DBC8] bg-white hover:border-[#C8D8BD]"}`}
                      >
                        <div className="font-extrabold">{category.name}</div>
                        <div className="text-xs text-[#8b7355] mt-1">{category.varieties.slice(0, 2).join(", ")}</div>
                      </button>
                    ))}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Field label="İlan başlığı" required>
                      <input
                        value={formData.title}
                        onChange={(event) => setField("title", event.target.value)}
                        className="field"
                        placeholder={formData.productType ? `Örn: ${formData.city || "Malatya"} ${formData.productType} ${formData.grade}` : "Örn: Malatya Battalgazi 1. kalite günkurusu kayısı"}
                      />
                    </Field>
                    <Field label="Çeşit" required>
                      <select value={formData.variety} onChange={(event) => setField("variety", event.target.value)} className="field">
                        <option value="">Çeşit seçin</option>
                        {(selectedCategory.varieties || []).map((item) => <option key={item} value={item}>{item}</option>)}
                      </select>
                    </Field>
                    {productGuide && (
                      <Field label={productGuide.typeLabel} required>
                        <select value={formData.productType} onChange={(event) => setField("productType", event.target.value)} className="field">
                          <option value="">Ürün tipini seçin</option>
                          {productGuide.typeOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                        </select>
                      </Field>
                    )}
                    <Field label="Şehir" required>
                      <select value={formData.city} onChange={(event) => setField("city", event.target.value)} className="field">
                        <option value="">Şehir seçin</option>
                        {PROVINCES.map((province) => <option key={province} value={province}>{province}</option>)}
                      </select>
                    </Field>
                    <Field label="İlçe / bölge" required>
                      <input value={formData.district} onChange={(event) => setField("district", event.target.value)} className="field" placeholder="Battalgazi, Serik, Eğirdir..." />
                    </Field>
                  </div>
                </CardContent>
              </Card>

              {productGuide && (
                <Card className="border-0 card-glass rounded-[28px]">
                  <CardContent className="p-6 space-y-5">
                    <SectionTitle icon={Sparkles} title="Ürün Özellikleri" />
                    <div className="rounded-2xl border border-[#C8D8BD] bg-[#F2F6EC] p-4">
                      <div className="text-sm font-extrabold text-[#2a1f14] mb-2">
                        {formData.productType || productGuide.typeLabel} için Muhtar kontrol listesi
                      </div>
                      <div className="space-y-1.5">
                        {productGuide.tips.map((tip) => (
                          <div key={tip} className="flex gap-2 text-xs text-[#4a392b] leading-relaxed">
                            <Sparkles className="w-3.5 h-3.5 text-[#3a6b1e] shrink-0 mt-0.5" />
                            <span>{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      {productGuide.fields.map((field) => (
                        <Field key={field.key} label={field.label} required={field.required}>
                          <input
                            value={formData.dynamicDetails[field.key] || ""}
                            onChange={(event) => setDynamicDetail(field.key, event.target.value)}
                            className="field"
                            placeholder={field.placeholder}
                          />
                        </Field>
                      ))}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-[#d9edc4] text-[#3a6b1e] font-bold gap-2"
                      onClick={generateAiDescription}
                      disabled={!formData.category}
                    >
                      <Sparkles className="w-4 h-4" />
                      Açıklamayı Hazırla
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Card className="border-0 card-glass rounded-[28px]">
                <CardContent className="p-6 space-y-6">
                  <SectionTitle icon={FileText} title="Açıklama ve Ticari Detaylar" />

                  <Field label="İlan açıklaması" required hint="Alıcı bu metni detay sayfasında okuyacak. Ürün durumu, hasat, fire, numune ve yükleme bilgisini açık yaz.">
                    <textarea
                      value={formData.description}
                      onChange={(event) => setField("description", event.target.value)}
                      className="field min-h-32 py-3 resize-none"
                      placeholder="Ürünün hasat zamanı, kalite durumu, depolama şartı, numune imkanı ve teslim detaylarını yazın."
                    />
                  </Field>

                  <div className="grid md:grid-cols-3 gap-4">
                    <Field label="Miktar" required>
                      <div className="relative">
                        <input type="number" value={formData.quantity} onChange={(event) => setField("quantity", event.target.value)} className="field pr-12" placeholder="8400" />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8b7355] text-sm font-bold">kg</span>
                      </div>
                    </Field>
                    <Field label="Kalite" required>
                      <select value={formData.grade} onChange={(event) => setField("grade", event.target.value)} className="field">
                        {(selectedCategory.qualities || ["Premium", "1. Kalite", "2. Kalite", "Sanayi"]).map((item) => <option key={item} value={item}>{item}</option>)}
                      </select>
                    </Field>
                    <Field label="Hasat tarihi" required>
                      <input type="date" value={formData.harvestDate} onChange={(event) => setField("harvestDate", event.target.value)} className="field" />
                    </Field>
                    <Field label="Fiyatlandırma" required>
                      <select value={formData.priceType} onChange={(event) => setField("priceType", event.target.value as FormData["priceType"])} className="field">
                        <option value="offer">Teklif usulü</option>
                        <option value="fixed">Sabit kg fiyatı</option>
                      </select>
                    </Field>
                    <AnimatePresence>
                      {formData.priceType === "fixed" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <Field label="Kg fiyatı" required>
                            <input type="number" value={formData.price} onChange={(event) => setField("price", event.target.value)} className="field" placeholder="196" />
                          </Field>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <Field label="Kalibre / boyut">
                      <input value={formData.size} onChange={(event) => setField("size", event.target.value)} className="field" placeholder="Jumbo, 70-80 mm, randıman 52..." />
                    </Field>
                    <Field label="Nem / analiz">
                      <input value={formData.moisture} onChange={(event) => setField("moisture", event.target.value)} className="field" placeholder="%17, %6.2, protein 13.2..." />
                    </Field>
                    <Field label="Telefon">
                      <input value={formData.phone} onChange={(event) => setField("phone", event.target.value)} className="field" placeholder="05XX XXX XX XX" />
                    </Field>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 card-glass rounded-[28px]">
                <CardContent className="p-6 space-y-6">
                  <SectionTitle icon={Truck} title="Lojistik ve Güvenli Ödeme" />
                  <div className="grid md:grid-cols-2 gap-4">
                    <Field label="Stok yeri">
                      <input value={formData.stockLocation} onChange={(event) => setField("stockLocation", event.target.value)} className="field" placeholder="Depo, bahçe veya kantar lokasyonu" />
                    </Field>
                    <Field label="Paketleme">
                      <input value={formData.packaging} onChange={(event) => setField("packaging", event.target.value)} className="field" />
                    </Field>
                    <Field label="Teslim / nakliye">
                      <input value={formData.delivery} onChange={(event) => setField("delivery", event.target.value)} className="field" />
                    </Field>
                    <Field label="Sertifikalar">
                      <input value={formData.certificates} onChange={(event) => setField("certificates", event.target.value)} className="field" placeholder="ÇKS kaydı, İyi Tarım, analiz raporu..." />
                    </Field>
                  </div>
                  <Field label="Ödeme">
                    <input value={formData.payment} onChange={(event) => setField("payment", event.target.value)} className="field" />
                  </Field>
                </CardContent>
              </Card>

              <Button size="lg" className="button-safe w-full bg-[#3A5A40] font-bold text-white hover:bg-[#2C4C3B]" disabled={!canGoNext} onClick={() => setStep(2)}>
                Fotoğraf ve Önizlemeye Geç
              </Button>
            </div>

            <aside className="space-y-5">
              <AiPriceCard quote={quote} quantityKg={quantityKg} price={Number(formData.price) || 0} priceType={formData.priceType} />

              <div className="rounded-[28px] border border-[#E4DBC8] bg-white p-5 shadow-[0_24px_80px_-62px_rgba(42,33,26,0.48)]">
                <div className="flex items-center gap-2 font-bold text-[#2a1f14] mb-3">
                  <ShieldCheck className="w-5 h-5 text-[#3a6b1e]" />
                  İlan Kontrol Listesi
                </div>
                <CheckItem done={!!formData.description && formData.description.length > 60} text="Açıklama 60 karakterden uzun" />
                <CheckItem done={!!formData.harvestDate} text="Hasat tarihi girildi" />
                <CheckItem done={!!formData.certificates} text="Belge veya beyan eklendi" />
                <CheckItem done={quote.status === "ready"} text="Piyasa aralığı hazırlandı" />
              </div>

              <div className="rounded-[28px] bg-[#2C4C3B] p-5 text-white shadow-[0_24px_80px_-62px_rgba(42,33,26,0.6)]">
                <div className="flex items-center gap-2 font-bold mb-3">
                  <Info className="w-5 h-5 text-[#f8b567]" />
                  İlan Kalite Notu
                </div>
                <p className="text-sm text-[#f0e8dc] leading-relaxed">
                  Açıklama, alıcının ilk kontrol ettiği alandır. Ürün durumu, hasat, numune, yükleme ve teslim bilgisi net yazıldığında ilan daha güvenilir görünür.
                </p>
              </div>
            </aside>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} className="grid lg:grid-cols-[1fr_360px] gap-6">
            <Card className="border-0 card-glass rounded-[28px]">
              <CardContent className="p-6">
                <SectionTitle icon={Camera} title="Fotoğraf ve Önizleme" />
                <p className="text-sm text-[#6e5a42] mb-5">Kapak fotoğrafı kartta ve detay sayfasında görünür. Fotoğraf yoksa sistem sade bir ürün görseliyle ilanı boş bırakmaz.</p>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  {photos.map((photo, index) => (
                    <div
                      key={photo.preview}
                      draggable
                      onDragStart={(event) => {
                        setDraggedPhotoIndex(index)
                        event.dataTransfer.effectAllowed = "move"
                      }}
                      onDragOver={(event) => {
                        event.preventDefault()
                        event.dataTransfer.dropEffect = "move"
                      }}
                      onDrop={(event) => {
                        event.preventDefault()
                        handlePhotoDrop(index)
                      }}
                      onDragEnd={() => setDraggedPhotoIndex(null)}
                      className={`relative group aspect-square rounded-2xl overflow-hidden border-2 transition-all cursor-grab active:cursor-grabbing ${
                        draggedPhotoIndex === index ?
                           "border-[#3a6b1e] opacity-60 scale-95"
                          : "border-[#e0d0b8] hover:border-[#3a6b1e]"
                      }`}
                      title="Sırasını değiştirmek için sürükleyin"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.preview} alt={`Ürün fotoğrafı ${index + 1}`} className="w-full h-full object-cover" />
                      {index === 0 && <span className="absolute top-2 left-2 badge-green">Kapak</span>}
                      <span className="absolute bottom-2 left-2 rounded-full bg-black/55 px-2 py-1 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        Sürükle
                      </span>
                      <button
                        onClick={() => setPhotos((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {photos.length < 5 && (
                    <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#D4C4A8] bg-white transition-colors hover:border-[#2C4C3B] hover:bg-[#FAF7F2]">
                      <UploadCloud className="w-8 h-8 text-[#8b7355] mb-2" />
                      <span className="text-xs font-bold text-[#6e5a42]">Fotoğraf ekle</span>
                      <input type="file" multiple accept="image/*" className="hidden" onChange={(event) => event.target.files && handleAddPhotos(event.target.files)} />
                    </label>
                  )}
                </div>

                <div className="overflow-hidden rounded-[28px] border border-[#E4DBC8] bg-white">
                  <div className="h-44 bg-[linear-gradient(135deg,#d9edc4_0%,#fff8f0_60%,#e0d0b8_100%)] flex items-center justify-center">
                    {photos[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photos[0].preview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-14 h-14 text-[#3a6b1e]/45" />
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs font-bold text-[#3a6b1e] mb-1">{formData.city} / {formData.district}</div>
                        <h2 className="text-xl font-extrabold text-[#2a1f14]">{formData.title}</h2>
                        {formData.productType && (
                          <div className="inline-flex mt-2 badge-green">
                            <Sparkles className="w-3 h-3" />
                            {formData.productType}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-[#8b7355] font-bold">Fiyat</div>
                        <div className="text-lg font-black text-[#3a6b1e]">{formData.priceType === "fixed" ? `${formatPrice(Number(formData.price) || 0)}/kg` : "Teklif"}</div>
                      </div>
                    </div>
                    <p className="text-safe mt-3 line-clamp-3 text-sm text-[#5a4a3a]">{formData.description}</p>
                    <div className="grid sm:grid-cols-3 gap-2 mt-4">
                      <PreviewStat label="Miktar" value={formatKg(quantityKg)} />
                      <PreviewStat label="Piyasa aralığı" value={quote.status !== "idle" ? `${formatPrice(quote.min)}-${formatPrice(quote.max)}` : "Bekliyor"} />
                      <PreviewStat label="Kalite" value={formData.grade} />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button variant="outline" className="button-safe flex-1 border-[#E4DBC8] font-bold text-[#2C4C3B]" onClick={() => setStep(1)}>Geri Dön</Button>
                  <Button className="button-safe flex-1 bg-[#D97742] font-bold text-white hover:bg-[#C85A17]" onClick={handlePublish} disabled={isPublishing}>
                    {isPublishing ? "İlan inceleniyor..." : "İlanı Yayınla"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <AiPriceCard quote={quote} quantityKg={quantityKg} price={Number(formData.price) || 0} priceType={formData.priceType} />
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="premium-card mx-auto max-w-2xl p-8 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#EAF1E4] text-[#2C4C3B]">
              <CheckCircle2 className="w-11 h-11" />
            </div>
            <h2 className="text-4xl font-extrabold text-[#2a1f14] mb-3">İlanınız yayında</h2>
            <p className="text-[#6e5a42] leading-relaxed mb-7">
              &quot;{formData.title}&quot; artık Pazar Yeri kartında ve detay sayfasında açıklaması, kalite verisi, lojistik bilgisi ve piyasa aralığıyla görünüyor.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href={`/products/${publishedId}`} className="button-safe flex h-12 items-center justify-center rounded-xl bg-[#3A5A40] px-6 font-bold text-white">
                İlan Detayını Aç
              </Link>
              <Link href="/products" className="button-safe flex h-12 items-center justify-center rounded-xl border border-[#E4DBC8] bg-white px-6 font-bold text-[#2C4C3B]">
                Pazar Yerine Dön
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

function SectionTitle({ icon: Icon, title }: { icon: typeof Leaf; title: string }) {
  return (
    <div className="text-safe flex items-center gap-2 font-extrabold text-[#2A211A]">
      <Icon className="h-5 w-5 shrink-0 text-[#2C4C3B]" />
      {title}
    </div>
  )
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-safe text-sm font-bold text-[#2a1f14]">
        {label} {required && <span className="text-[#d97736]">*</span>}
      </span>
      {children}
      {hint && <span className="block text-xs text-[#8b7355] leading-relaxed">{hint}</span>}
    </label>
  )
}

function AiPriceCard({ quote, quantityKg, price, priceType }: { quote: Quote; quantityKg: number; price: number; priceType: "offer" | "fixed" }) {
  const outsideFairRange = priceType === "fixed" && price > 0 && quote.status !== "idle" && (price < quote.min || price > quote.max)

  return (
    <div className="sticky top-5 rounded-[28px] border border-[#E4DBC8] bg-white p-5 shadow-[0_24px_80px_-62px_rgba(42,33,26,0.48)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#3A5A40] shadow-md">
          {quote.status === "loading" ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Sparkles className="w-5 h-5 text-white" />}
        </div>
        <div>
          <div className="font-extrabold text-[#2a1f14]">Piyasa Fiyatı</div>
          <div className="text-xs text-[#3a6b1e] font-bold">Aralık hazır</div>
        </div>
      </div>

      {quote.status === "idle" ? (
        <p className="text-sm text-[#6e5a42] leading-relaxed">Kategori, şehir, kalite ve miktar girildiğinde fiyat aralığı otomatik hesaplanır.</p>
      ) : (
        <>
          <div className="mb-4 rounded-2xl border border-[#E4DBC8] bg-[#FAF7F2] p-4 text-center">
            <div className="text-[11px] uppercase tracking-wide font-bold text-[#8b7355] mb-1">Önerilen aralık</div>
            <div className="text-safe text-2xl font-black text-[#2A211A]">{formatPrice(quote.min)} - {formatPrice(quote.max)}</div>
            <div className="text-xs font-bold text-[#3a6b1e] mt-2">%{quote.confidence} güven</div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <PreviewStat label="Tonaj" value={quantityKg ? formatKg(quantityKg) : "Bekliyor"} />
            <PreviewStat label="Toplam tahmin" value={quantityKg ? formatPrice(quantityKg * ((quote.min + quote.max) / 2)) : "Bekliyor"} />
          </div>
          {outsideFairRange && (
            <div className="rounded-xl bg-[#fff8f0] border border-[#fcd3a3] p-3 text-xs text-[#8f4720] font-semibold leading-relaxed">
              Girdiğiniz fiyat piyasa aralığının dışında. İsterseniz açıklamada kalite, sertifika veya acil satış gerekçesini belirtin.
            </div>
          )}
        </>
      )}
    </div>
  )
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#E7DCCB] bg-[#FAF7F2] p-3">
      <div className="text-[10px] uppercase tracking-wide font-bold text-[#8b7355]">{label}</div>
      <div className="text-safe mt-1 text-sm font-black text-[#2A211A]">{value}</div>
    </div>
  )
}

function CheckItem({ done, text }: { done: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2 py-2 text-sm">
      {done ? <CheckCircle2 className="w-4 h-4 text-[#3a6b1e]" /> : <div className="w-4 h-4 rounded-full border border-[#d4c4a8]" />}
      <span className={done ? "font-semibold text-[#2a1f14]" : "text-[#8b7355]"}>{text}</span>
    </div>
  )
}
