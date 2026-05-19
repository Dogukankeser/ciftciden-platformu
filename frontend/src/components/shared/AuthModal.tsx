"use client"

/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */

import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { Camera, CheckCircle2, FileCheck2, LockKeyhole, Mail, MapPin, Phone, ShieldCheck, User, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  AuthUser,
  buildGoogleUser,
  getStoredUsers,
  loginWithEmail,
  makeUserId,
  saveAuthUser,
  saveLocalCredentials,
  saveUserDocuments,
} from "@/lib/auth"
import { compressImage } from "@/lib/imageUtils"

declare global {
  interface Window {
    google: any
    handleGoogleCredentialResponse: (response: any) => void
  }
}

type ProfileDraft = {
  id: string
  email: string
  name: string
  phone: string
  city: string
  productionProducts: string[]
  bio: string
  photo: string
  role: "farmer" | "merchant" | ""
}

type RegisterDocuments = {
  identityNumber: string
  producerCertificate: string
  chamberRecord: string
  fileNames: string[]
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "930204077182-8j4fmpor6vvh610r1g7l6gvbpp4jcd5f.apps.googleusercontent.com"

const emptyProfile: ProfileDraft = {
  id: "",
  email: "",
  name: "",
  phone: "",
  city: "",
  productionProducts: [],
  bio: "",
  photo: "",
  role: "",
}

const emptyDocuments: RegisterDocuments = {
  identityNumber: "",
  producerCertificate: "",
  chamberRecord: "",
  fileNames: [],
}

const PRODUCT_OPTIONS = ["Kayısı", "Domates", "Buğday", "Elma", "Üzüm", "Zeytin", "Fındık", "Antep Fıstığı"]

const PROVINCES = [
  "Adana","Adıyaman","Afyonkarahisar","Ağrı","Amasya","Ankara","Antalya","Artvin","Aydın","Balıkesir","Bilecik","Bingöl","Bitlis","Bolu","Burdur","Bursa","Çanakkale","Çankırı","Çorum","Denizli","Diyarbakır","Edirne","Elazığ","Erzincan","Erzurum","Eskişehir","Gaziantep","Giresun","Gümüşhane","Hakkari","Hatay","Isparta","Mersin","İstanbul","İzmir","Kars","Kastamonu","Kayseri","Kırklareli","Kırşehir","Kocaeli","Konya","Kütahya","Malatya","Manisa","Kahramanmaraş","Mardin","Muğla","Muş","Nevşehir","Niğde","Ordu","Rize","Sakarya","Samsun","Siirt","Sinop","Sivas","Tekirdağ","Tokat","Trabzon","Tunceli","Şanlıurfa","Uşak","Van","Yozgat","Zonguldak","Aksaray","Bayburt","Karaman","Kırıkkale","Batman","Şırnak","Bartın","Ardahan","Iğdır","Yalova","Karabük","Kilis","Osmaniye","Düzce"
].sort((a, b) => a.localeCompare(b, "tr"))

const AUTH_INPUT_CLASS =
  "h-11 w-full rounded-xl border border-[#e5d6c2] bg-[#fffaf2] px-4 text-sm font-semibold text-[#2b241d] placeholder:text-[#a79681] outline-none transition focus:border-[#3a5a40] focus:ring-4 focus:ring-[#3a5a40]/10"
const AUTH_INPUT_WITH_ICON_CLASS =
  "h-11 w-full rounded-xl border border-[#e5d6c2] bg-[#fffaf2] pl-10 pr-4 text-sm font-semibold text-[#2b241d] placeholder:text-[#a79681] outline-none transition focus:border-[#3a5a40] focus:ring-4 focus:ring-[#3a5a40]/10"
const AUTH_ICON_CLASS = "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7b6a58]"
const AUTH_CARD_CLASS = "rounded-3xl border border-[#eadcca] bg-white/88 p-5 shadow-[0_22px_60px_-45px_rgba(74,59,50,0.75)]"

function decodeJwt(token: string) {
  try {
    const base64Url = token.split(".")[1]
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64).split("").map((char) => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`).join("")
    )
    return JSON.parse(jsonPayload) as Record<string, unknown>
  } catch {
    return null
  }
}

function loadGoogleIdentityScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.google.accounts.id) {
      resolve()
      return
    }

    const existing = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]')
    if (existing) {
      let attempts = 0
      const interval = window.setInterval(() => {
        attempts += 1
        if (window.google.accounts.id) {
          window.clearInterval(interval)
          resolve()
        } else if (attempts > 20) {
          window.clearInterval(interval)
          reject(new Error("Google script hazır olmadı."))
        }
      }, 150)
      existing.addEventListener("load", () => {
        window.clearInterval(interval)
        resolve()
      }, { once: true })
      existing.addEventListener("error", () => {
        window.clearInterval(interval)
        reject(new Error("Google script yüklenemedi."))
      }, { once: true })
      return
    }

    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Google script yüklenemedi."))
    document.head.appendChild(script)
  })
}

export function AuthModal({
  isOpen,
  onClose,
  title,
  initialMode = "login",
  onSuccess,
}: {
  isOpen: boolean
  onClose: () => void
  title?: string
  initialMode?: "login" | "register"
  onSuccess?: (user: AuthUser) => void
}) {
  const [step, setStep] = useState<"initial" | "loading" | "role" | "profile" | "success">("initial")
  const [authMode, setAuthMode] = useState<"login" | "register">(initialMode)
  const [loginData, setLoginData] = useState({ email: "", password: "" })
  const [registerPassword, setRegisterPassword] = useState("")
  const [registerStage, setRegisterStage] = useState<"email" | "details">("email")
  const [verificationCode, setVerificationCode] = useState("")
  const [verificationInput, setVerificationInput] = useState("")
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [documents, setDocuments] = useState<RegisterDocuments>(emptyDocuments)
  const [authError, setAuthError] = useState("")
  const [profileData, setProfileData] = useState<ProfileDraft>(emptyProfile)
  const [googleError, setGoogleError] = useState("")
  const [mounted, setMounted] = useState(false)
  const modalPanelRef = useRef<HTMLDivElement | null>(null)
  const modalTitle = title || (authMode === "register" ? "Yeni Hesap Oluştur" : "Hesabınıza Giriş Yapın")

  const resetRegisterFlow = useCallback(() => {
    setRegisterStage("email")
    setVerificationCode("")
    setVerificationInput("")
    setIsEmailVerified(false)
    setRegisterPassword("")
    setProfileData(emptyProfile)
    setDocuments(emptyDocuments)
  }, [])

  const closeModal = useCallback(() => {
    onClose()
    setStep("initial")
    setAuthMode(initialMode)
    setAuthError("")
    setGoogleError("")
    resetRegisterFlow()
  }, [initialMode, onClose, resetRegisterFlow])

  const finishAuth = useCallback((user: AuthUser, redirectToMerchant = false) => {
    setStep("success")
    window.setTimeout(() => {
      onSuccess?.(user)
      onClose()
      setStep("initial")
      if (redirectToMerchant) {
        window.location.href = "/merchants/verify"
      } else if (!onSuccess) {
        window.location.reload()
      }
    }, 900)
  }, [onClose, onSuccess])

  const handleCredential = useCallback((response: any) => {
    setGoogleError("")
    setStep("loading")

    const decoded = decodeJwt(response.credential || "")
    const googleUser = decoded ? buildGoogleUser(decoded) : null

    if (!googleUser) {
      setStep("initial")
      setGoogleError("Google hesabı okunamadı. Lütfen tekrar deneyin.")
      return
    }

    const existing = getStoredUsers()[googleUser.id]
    if (existing?.name && existing.role) {
      const user = saveAuthUser({
        ...existing,
        email: googleUser.email || existing.email,
        photo: existing.photo || googleUser.photo,
        provider: "google",
      })
      finishAuth(user)
      return
    }

    setProfileData({
      ...emptyProfile,
      ...googleUser,
      role: "",
    })
    setStep("role")
  }, [finishAuth])

  const initializeGoogle = useCallback(async () => {
    if (!isOpen || step !== "initial") return

    try {
      await loadGoogleIdentityScript()
      if (!window.google.accounts.id) throw new Error("Google Identity Services hazır değil.")

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredential,
        auto_select: false,
        cancel_on_tap_outside: true,
        ux_mode: "popup",
      })

    } catch {
      setGoogleError("Google giriş servisi başlatılamadı. İnternet bağlantısı veya Google Client ID ayarını kontrol edin.")
    }
  }, [handleCredential, isOpen, step])

  useEffect(() => {
    window.handleGoogleCredentialResponse = handleCredential
  }, [handleCredential])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    initializeGoogle()
  }, [initializeGoogle])

  useEffect(() => {
    if (!isOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    if (modalPanelRef.current) {
      modalPanelRef.current.scrollTop = 0
    }
  }, [authMode, isOpen, registerStage, step])

  useEffect(() => {
    if (!isOpen) return
    setAuthMode(initialMode)
    setStep("initial")
    setAuthError("")
    setGoogleError("")
    resetRegisterFlow()
  }, [initialMode, isOpen, resetRegisterFlow])

  const handleGooglePrompt = async () => {
    setGoogleError("")
    try {
      await initializeGoogle()
      if (!window.google.accounts.id) throw new Error("Google hazır değil.")
      setStep("loading")
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed?.() || notification.isSkippedMoment?.()) {
          setStep("initial")
          setGoogleError("Google penceresi açılamadı. Tarayıcı çerez/izin ayarlarını kontrol edin veya e-posta ile devam edin.")
        }
      })
    } catch {
      setStep("initial")
      setGoogleError("Google ile giriş başlatılamadı. Google Cloud'da bu alan adının yetkili olduğundan emin olun.")
    }
  }

  const handleLocalLogin = () => {
    setAuthError("")
    const user = loginWithEmail(loginData.email, loginData.password)
    if (!user) {
      setAuthError("E-posta veya şifre hatalı. Hesabınız yoksa Kayıt Ol sekmesinden yeni hesap açın.")
      return
    }

    finishAuth(user, user.role === "merchant")
  }

  const handleRegisterDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []).map((file) => file.name)
    setDocuments((prev) => ({ ...prev, fileNames: files }))
  }

  const handleSendVerificationCode = () => {
    setAuthError("")
    const email = profileData.email.trim()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setAuthError("Önce geçerli bir e-posta adresi yazın.")
      return
    }

    if (registerPassword.length < 6) {
      setAuthError("Şifre en az 6 karakter olmalıdır.")
      return
    }

    const existingUser = Object.values(getStoredUsers()).find((user) => user.email.toLocaleLowerCase("tr-TR") === email.toLocaleLowerCase("tr-TR"))
    if (existingUser) {
      setAuthError("Bu e-posta ile kayıtlı bir hesap var. Giriş Yap sekmesinden devam edin.")
      return
    }

    setVerificationCode(String(Math.floor(100000 + Math.random() * 900000)))
    setVerificationInput("")
  }

  const handleConfirmVerificationCode = () => {
    setAuthError("")

    if (!verificationCode) {
      setAuthError("Önce doğrulama kodu gönderin.")
      return
    }

    if (verificationInput.trim() !== verificationCode) {
      setAuthError("Doğrulama kodu hatalı. Kodu kontrol edip tekrar deneyin.")
      return
    }

    setIsEmailVerified(true)
    setRegisterStage("details")
  }

  const handleBackToEmailStep = () => {
    setRegisterStage("email")
    setIsEmailVerified(false)
    setVerificationCode("")
    setVerificationInput("")
  }

  const handleLocalRegister = () => {
    setAuthError("")
    const email = profileData.email.trim()
    const name = profileData.name.trim()

    if (!isEmailVerified) {
      setAuthError("Hesap bilgilerine geçmeden önce e-postanızı doğrulayın.")
      return
    }

    if (!name || !email || !registerPassword || !profileData.role || !profileData.phone.trim() || !profileData.city) {
      setAuthError("Ad soyad, rol, telefon ve şehir alanları zorunludur.")
      return
    }

    if (registerPassword.length < 6) {
      setAuthError("Şifre en az 6 karakter olmalıdır.")
      return
    }

    if (profileData.role === "farmer" && profileData.productionProducts.length === 0) {
      setAuthError("Üretici hesabı için en az bir ürün seçmelisiniz.")
      return
    }

    if (profileData.role === "farmer" && !documents.producerCertificate.trim()) {
      setAuthError("Üretici hesabı için ÇKS veya üretici belge numarası yeterlidir.")
      return
    }

    if (profileData.role === "merchant" && (!documents.identityNumber.trim() || !documents.chamberRecord.trim())) {
      setAuthError("Tüccar hesabı için vergi no ve ticaret/oda kayıt bilgisi zorunludur.")
      return
    }

    const existingUser = Object.values(getStoredUsers()).find((user) => user.email.toLocaleLowerCase("tr-TR") === email.toLocaleLowerCase("tr-TR"))
    if (existingUser) {
      setAuthError("Bu e-posta ile kayıtlı bir hesap var. Giriş Yap sekmesinden devam edin.")
      return
    }

    const userId = makeUserId(email, "local")
    const user = saveAuthUser({
      id: userId,
      email,
      name,
      photo: profileData.photo,
      role: profileData.role,
      phone: profileData.phone,
      city: profileData.city,
      productionProducts: profileData.productionProducts,
      bio: profileData.bio,
      provider: "local",
    })
    saveLocalCredentials(user.id, email, registerPassword)
    saveUserDocuments(user.id, {
      accountType: user.role,
      identityNumber: user.role === "merchant" ? documents.identityNumber : "",
      producerCertificate: user.role === "farmer" ? documents.producerCertificate : "",
      chamberRecord: user.role === "merchant" ? documents.chamberRecord : "",
      fileNames: documents.fileNames,
    })
    finishAuth(user, user.role === "merchant")
  }

  const handleRoleSelect = (role: "farmer" | "merchant") => {
    setProfileData((prev) => ({ ...prev, role }))
    setStep("profile")
  }

  const toggleProduct = (product: string) => {
    setProfileData((prev) => {
      const hasProduct = prev.productionProducts.includes(product)
      return {
        ...prev,
        productionProducts: hasProduct
          ? prev.productionProducts.filter((item) => item !== product)
          : [...prev.productionProducts, product],
      }
    })
  }

  const handleProfilePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const compressedBase64 = await compressImage(file, 400, 0.6)
      setProfileData((prev) => ({ ...prev, photo: compressedBase64 }))
    } catch (err) {
      console.error("Profil fotoğrafı sıkıştırılamadı:", err)
    }
  }

  const handleProfileComplete = () => {
    if (!profileData.id || !profileData.name.trim() || !profileData.role) return

    const user = saveAuthUser({
      id: profileData.id,
      email: profileData.email,
      name: profileData.name,
      photo: profileData.photo,
      role: profileData.role,
      phone: profileData.phone,
      city: profileData.city,
      productionProducts: profileData.productionProducts,
      bio: profileData.bio,
      provider: "google",
    })

    finishAuth(user, profileData.role === "merchant")
  }

  if (!isOpen || !mounted) return null

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] grid min-h-[100dvh] place-items-center overflow-y-auto bg-[#2b2118]/45 p-4 backdrop-blur-md" onClick={closeModal}>
        <motion.div
          ref={modalPanelRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative my-auto max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-hidden overflow-y-auto rounded-[28px] border border-[#eadcca] bg-[#faf7f2] text-[#2b241d] shadow-[0_35px_110px_-50px_rgba(43,33,24,0.85)]"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            onClick={closeModal}
            className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-[#e5d6c2] bg-white/85 text-[#6f5f4d] shadow-sm transition hover:bg-[#f1eadf] hover:text-[#2b241d]"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="min-h-[350px] p-6 sm:p-8">
            {step === "initial" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-left">
                <div className="mb-6 flex items-start gap-3 pr-10">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#2c4c3b] text-white shadow-[0_12px_28px_-18px_rgba(44,76,59,0.9)]">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="mb-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#937a5f]">Çiftçiden hesap</p>
                    <h2 className="text-2xl font-black tracking-tight text-[#2b241d]">{modalTitle}</h2>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-[#766754]">
                      {authMode === "register"
                        ? "Önce e-postanızı doğrulayın; sonra hesabınıza uygun kısa bilgileri tamamlayın."
                        : "Daha önce hesap açtıysanız e-posta ve şifrenizle devam edin."}
                    </p>
                  </div>
                </div>

                <div className="mb-5 grid grid-cols-2 rounded-2xl border border-[#e5d6c2] bg-[#efe6d9] p-1">
                  {(["login", "register"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setAuthMode(mode)
                        setAuthError("")
                        if (mode === "register") resetRegisterFlow()
                      }}
                      className={`h-10 rounded-xl text-sm font-black transition ${
                        authMode === mode ? "bg-[#2c4c3b] text-white shadow-sm" : "text-[#6d5b49] hover:bg-white/70 hover:text-[#2b241d]"
                      }`}
                    >
                      {mode === "login" ? "Giriş Yap" : "Kayıt Ol"}
                    </button>
                  ))}
                </div>

                {authMode === "login" ? (
                  <div className="space-y-4">
                    <GoogleAuthButton
                      label="Google ile Hızlı Giriş Yap"
                      hint="Google hesabınız doğrulanır ve profiliniz açılır."
                      onClick={handleGooglePrompt}
                    />
                    <div className="flex items-center gap-3 text-xs font-bold text-[#9b8b76]">
                      <span className="h-px flex-1 bg-[#e5d6c2]" />
                      veya e-posta ile giriş yap
                      <span className="h-px flex-1 bg-[#e5d6c2]" />
                    </div>
                    <FieldLabel label="E-posta">
                      <Mail className={AUTH_ICON_CLASS} />
                      <input
                        type="text"
                        inputMode="email"
                        placeholder="ornek@mail.com"
                        className={AUTH_INPUT_WITH_ICON_CLASS}
                        value={loginData.email}
                        onChange={(event) => setLoginData((prev) => ({ ...prev, email: event.target.value }))}
                      />
                    </FieldLabel>
                    <FieldLabel label="Şifre">
                      <LockKeyhole className={AUTH_ICON_CLASS} />
                      <input
                        type="password"
                        placeholder="Şifreniz"
                        className={AUTH_INPUT_WITH_ICON_CLASS}
                        value={loginData.password}
                        onChange={(event) => setLoginData((prev) => ({ ...prev, password: event.target.value }))}
                      />
                    </FieldLabel>
                    <Button className="h-12 w-full rounded-xl bg-[#2c4c3b] font-black text-white shadow-[0_14px_30px_-20px_rgba(44,76,59,0.9)] hover:bg-[#243f31]" onClick={handleLocalLogin}>
                      Giriş Yap
                    </Button>
                  </div>
                ) : (
                  <RegisterForm
                    profileData={profileData}
                    setProfileData={setProfileData}
                    registerPassword={registerPassword}
                    setRegisterPassword={setRegisterPassword}
                    registerStage={registerStage}
                    verificationCode={verificationCode}
                    verificationInput={verificationInput}
                    setVerificationInput={setVerificationInput}
                    documents={documents}
                    setDocuments={setDocuments}
                    toggleProduct={toggleProduct}
                    onDocumentUpload={handleRegisterDocumentUpload}
                    onSendVerificationCode={handleSendVerificationCode}
                    onConfirmVerificationCode={handleConfirmVerificationCode}
                    onBackToEmail={handleBackToEmailStep}
                    onGoogleAuth={handleGooglePrompt}
                    onRegister={handleLocalRegister}
                  />
                )}

                {(authError || googleError) && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-left text-xs font-semibold leading-relaxed text-red-800">
                    {authError || googleError}
                  </div>
                )}

                <p className="mt-5 text-center text-xs leading-5 text-[#8a7862]">
                  Devam ederek Kullanıcı Sözleşmesi ve Gizlilik Politikasını kabul etmiş sayılırsınız.
                </p>
              </motion.div>
            )}

            {step === "loading" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-10">
                <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#eadcca] border-t-[#2c4c3b]" />
                <p className="font-semibold text-[#2b241d]">Google hesabınız doğrulanıyor...</p>
              </motion.div>
            )}

            {step === "role" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h2 className="mb-2 text-center text-2xl font-black text-[#2b241d]">Rolünüzü Seçin</h2>
                <p className="mb-8 text-center text-sm text-[#766754]">Bu hesapla platformu nasıl kullanacaksınız?</p>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleRoleSelect("farmer")}
                    className="flex flex-col items-center rounded-2xl border border-[#eadcca] bg-white/85 p-5 transition-all hover:border-[#3a5a40] hover:bg-[#eef5ea]"
                  >
                    <LeafIcon />
                    <span className="mt-3 font-black text-[#2b241d]">Üreticiyim</span>
                    <span className="mt-1 text-xs font-semibold text-[#766754]">İlan ve paylaşım yapacağım</span>
                  </button>

                  <button
                    onClick={() => handleRoleSelect("merchant")}
                    className="flex flex-col items-center rounded-2xl border border-[#eadcca] bg-white/85 p-5 transition-all hover:border-[#d97742] hover:bg-[#fff0e7]"
                  >
                    <StoreIcon />
                    <span className="mt-3 font-black text-[#2b241d]">Tüccarım</span>
                    <span className="mt-1 text-xs font-semibold text-[#766754]">Alım ve teklif yöneteceğim</span>
                  </button>
                </div>
              </motion.div>
            )}

            {step === "profile" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-left">
                <h2 className="mb-1 text-center text-xl font-black text-[#2b241d]">Profilini Tamamla</h2>
                <p className="mb-6 text-center text-sm text-[#766754]">Bu bilgiler hesabınıza kaydedilir ve sonraki girişlerde korunur.</p>

                <div className="flex justify-center mb-6">
                  <label className="relative cursor-pointer group">
                    <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-[#eadcca] bg-white">
                      {profileData.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={profileData.photo} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="h-10 w-10 text-[#8a7862]" />
                      )}
                    </div>
                    <div className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-[#2c4c3b] text-white shadow-lg transition-colors group-hover:bg-[#243f31]">
                      <Camera className="h-4 w-4" />
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleProfilePhotoUpload} />
                  </label>
                </div>

                <div className="space-y-4">
                  <FieldLabel label="Ad Soyad *">
                    <User className={AUTH_ICON_CLASS} />
                    <input
                      type="text"
                      placeholder="Adınız ve soyadınız"
                      className={AUTH_INPUT_WITH_ICON_CLASS}
                      value={profileData.name}
                      onChange={(event) => setProfileData((prev) => ({ ...prev, name: event.target.value }))}
                    />
                  </FieldLabel>

                  <FieldLabel label="Telefon Numarası">
                    <Phone className={AUTH_ICON_CLASS} />
                    <input
                      type="tel"
                      placeholder="05XX XXX XX XX"
                      className={AUTH_INPUT_WITH_ICON_CLASS}
                      value={profileData.phone}
                      onChange={(event) => setProfileData((prev) => ({ ...prev, phone: event.target.value }))}
                    />
                  </FieldLabel>

                  <FieldLabel label="Bulunduğunuz Şehir">
                    <MapPin className={AUTH_ICON_CLASS} />
                    <select
                      className={`${AUTH_INPUT_WITH_ICON_CLASS} appearance-none`}
                      value={profileData.city}
                      onChange={(event) => setProfileData((prev) => ({ ...prev, city: event.target.value }))}
                    >
                      <option value="">Şehir seçin</option>
                      {PROVINCES.map((province) => <option key={province} value={province}>{province}</option>)}
                    </select>
                  </FieldLabel>

                  <div>
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-[#937a5f]">
                      Ürettiğiniz ürünler
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {PRODUCT_OPTIONS.map((product) => {
                        const selected = profileData.productionProducts.includes(product)
                        return (
                          <button
                            key={product}
                            type="button"
                            onClick={() => toggleProduct(product)}
                            className={`rounded-xl border px-3 py-2 text-sm font-bold transition ${
                              selected
                                ? "border-[#3a5a40] bg-[#eaf3e5] text-[#2c4c3b]"
                                : "border-[#eadcca] bg-white/80 text-[#766754] hover:border-[#3a5a40]/60"
                            }`}
                          >
                            {product}
                          </button>
                        )
                      })}
                    </div>
                    <p className="mt-2 text-xs leading-5 text-[#766754]">
                      Bu seçimler profilinizde haberleri, Tarlam finans ekranını ve içerik önerilerini kişiselleştirir.
                    </p>
                  </div>

                  <label className="block">
                    <span className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-[#937a5f]">Hakkında</span>
                    <textarea
                      placeholder={profileData.role === "farmer" ? "Örn: Malatya'da kayısı üretimi yapıyorum..." : "Örn: Yaş meyve sebze toptan ticareti yapıyoruz..."}
                      className="h-20 w-full resize-none rounded-xl border border-[#e5d6c2] bg-[#fffaf2] px-4 py-3 text-sm font-semibold text-[#2b241d] placeholder:text-[#a79681] focus:outline-none focus:ring-4 focus:ring-[#3a5a40]/10"
                      value={profileData.bio}
                      onChange={(event) => setProfileData((prev) => ({ ...prev, bio: event.target.value }))}
                    />
                  </label>
                </div>

                <Button
                  className="mt-6 h-12 w-full rounded-xl bg-[#2c4c3b] font-black text-white hover:bg-[#243f31]"
                  onClick={handleProfileComplete}
                  disabled={!profileData.name.trim()}
                >
                  Hesabı Tamamla
                </Button>
              </motion.div>
            )}

            {step === "success" && (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="py-10">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#eaf3e5] text-[#2c4c3b]">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h2 className="mb-2 text-center text-2xl font-black text-[#2b241d]">Hoş geldiniz!</h2>
                <p className="text-center text-[#766754]">Hesabınız hazır, yönlendiriliyorsunuz...</p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  )
}

function RegisterForm({
  profileData,
  setProfileData,
  registerPassword,
  setRegisterPassword,
  registerStage,
  verificationCode,
  verificationInput,
  setVerificationInput,
  documents,
  setDocuments,
  toggleProduct,
  onDocumentUpload,
  onSendVerificationCode,
  onConfirmVerificationCode,
  onBackToEmail,
  onGoogleAuth,
  onRegister,
}: {
  profileData: ProfileDraft
  setProfileData: React.Dispatch<React.SetStateAction<ProfileDraft>>
  registerPassword: string
  setRegisterPassword: (value: string) => void
  registerStage: "email" | "details"
  verificationCode: string
  verificationInput: string
  setVerificationInput: (value: string) => void
  documents: RegisterDocuments
  setDocuments: React.Dispatch<React.SetStateAction<RegisterDocuments>>
  toggleProduct: (product: string) => void
  onDocumentUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  onSendVerificationCode: () => void
  onConfirmVerificationCode: () => void
  onBackToEmail: () => void
  onGoogleAuth: () => void
  onRegister: () => void
}) {
  const isFarmer = profileData.role === "farmer"
  const isMerchant = profileData.role === "merchant"
  const productLabel = isMerchant ? "Alım yaptığınız ürünler" : "Ürettiğiniz ürünler"

  const selectRole = (role: "farmer" | "merchant") => {
    setProfileData((prev) => ({ ...prev, role }))
    setDocuments(emptyDocuments)
  }

  if (registerStage === "email") {
    return (
      <div className="space-y-5">
        <GoogleAuthButton
          label="Google ile Hızlı Kayıt/Giriş"
          hint="Google e-postanızı doğrular, profil bilgilerine geçersiniz."
          onClick={onGoogleAuth}
        />
        <div className="flex items-center gap-3 text-xs font-bold text-[#9b8b76]">
          <span className="h-px flex-1 bg-[#e5d6c2]" />
          veya e-posta kodu ile devam et
          <span className="h-px flex-1 bg-[#e5d6c2]" />
        </div>
        <div className={AUTH_CARD_CLASS}>
          <div className="mb-5 flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eaf3e5] text-[#2c4c3b]">
              <Mail className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-lg font-black text-[#2b241d]">E-posta doğrulaması</h3>
              <p className="mt-1 text-sm leading-6 text-[#766754]">
                Önce hesabın kime ait olduğunu doğrulayalım. Üretici veya tüccar bilgilerini sonraki adımda isteyeceğiz.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <FieldLabel label="E-posta *">
              <Mail className={AUTH_ICON_CLASS} />
              <input
                type="text"
                inputMode="email"
                placeholder="ornek@mail.com"
                className={AUTH_INPUT_WITH_ICON_CLASS}
                value={profileData.email}
                onChange={(event) => setProfileData((prev) => ({ ...prev, email: event.target.value }))}
              />
            </FieldLabel>
            <FieldLabel label="Şifre *">
              <LockKeyhole className={AUTH_ICON_CLASS} />
              <input
                type="password"
                placeholder="En az 6 karakter"
                className={AUTH_INPUT_WITH_ICON_CLASS}
                value={registerPassword}
                onChange={(event) => setRegisterPassword(event.target.value)}
              />
            </FieldLabel>
          </div>

          {verificationCode && (
            <div className="mt-4 rounded-2xl border border-[#d6e7cc] bg-[#f2f8ee] p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-[#3a5a40]">
                <span>Sunum doğrulama kodu</span>
                <span className="rounded-full bg-white px-3 py-1 font-black tracking-[0.2em] text-[#2c4c3b] shadow-sm">{verificationCode}</span>
              </div>
              <FieldLabel label="Gelen kod *">
                <input
                  inputMode="numeric"
                  placeholder="6 haneli kod"
                  className={AUTH_INPUT_CLASS}
                  value={verificationInput}
                  onChange={(event) => setVerificationInput(event.target.value)}
                />
              </FieldLabel>
            </div>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Button
              type="button"
              className="h-12 rounded-xl bg-[#2c4c3b] font-black text-white hover:bg-[#243f31]"
              onClick={verificationCode ? onConfirmVerificationCode : onSendVerificationCode}
            >
              {verificationCode ? "Doğrula ve Devam Et" : "Doğrulama Kodu Gönder"}
            </Button>
            {verificationCode && (
              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-xl border-[#e0d1bf] bg-white/70 font-black text-[#2b241d] hover:bg-[#f1eadf]"
                onClick={onSendVerificationCode}
              >
                Yeni Kod Gönder
              </Button>
            )}
          </div>
        </div>

        <p className="text-center text-xs leading-5 text-[#8a7862]">
          Sunum ortamında kod ekranda gösterilir; canlı sistemde kod kullanıcının e-posta adresine gönderilir.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#d6e7cc] bg-[#f2f8ee] p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2c4c3b] text-white">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-black text-[#2b241d]">E-posta doğrulandı</p>
            <p className="text-xs font-semibold text-[#766754]">{profileData.email}</p>
          </div>
        </div>
        <button type="button" onClick={onBackToEmail} className="text-xs font-black text-[#d97742] hover:text-[#c85a17]">
          E-postayı değiştir
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <FieldLabel label="Ad Soyad *">
          <User className={AUTH_ICON_CLASS} />
          <input
            type="text"
            placeholder="Adınız soyadınız"
            className={AUTH_INPUT_WITH_ICON_CLASS}
            value={profileData.name}
            onChange={(event) => setProfileData((prev) => ({ ...prev, name: event.target.value }))}
          />
        </FieldLabel>
        <FieldLabel label="Telefon *">
          <Phone className={AUTH_ICON_CLASS} />
          <input
            type="tel"
            placeholder="05XX XXX XX XX"
            className={AUTH_INPUT_WITH_ICON_CLASS}
            value={profileData.phone}
            onChange={(event) => setProfileData((prev) => ({ ...prev, phone: event.target.value }))}
          />
        </FieldLabel>
      </div>

      <div>
        <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-[#937a5f]">Hesap tipi *</span>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            aria-pressed={isFarmer}
            onClick={() => selectRole("farmer")}
            className={`rounded-2xl border p-4 text-left transition ${
              isFarmer
                ? "border-[#3a5a40] bg-[#eaf3e5] text-[#2c4c3b]"
                : "border-[#eadcca] bg-white/80 text-[#766754] hover:border-[#3a5a40]/70"
            }`}
          >
            <span className="block text-sm font-black">Üreticiyim</span>
            <span className="mt-1 block text-xs leading-5">ÇKS veya üretici belge no yeterlidir.</span>
          </button>
          <button
            type="button"
            aria-pressed={isMerchant}
            onClick={() => selectRole("merchant")}
            className={`rounded-2xl border p-4 text-left transition ${
              isMerchant
                ? "border-[#d97742] bg-[#fff0e7] text-[#8d3d11]"
                : "border-[#eadcca] bg-white/80 text-[#766754] hover:border-[#d97742]/70"
            }`}
          >
            <span className="block text-sm font-black">Tüccarım</span>
            <span className="mt-1 block text-xs leading-5">Vergi no ve ticari kayıt bilgisi istenir.</span>
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <FieldLabel label="Şehir *">
          <MapPin className={AUTH_ICON_CLASS} />
          <select
            className={AUTH_INPUT_WITH_ICON_CLASS}
            value={profileData.city}
            onChange={(event) => setProfileData((prev) => ({ ...prev, city: event.target.value }))}
          >
            <option value="">Şehir seçin</option>
            {PROVINCES.map((province) => <option key={province} value={province}>{province}</option>)}
          </select>
        </FieldLabel>
      </div>

      {profileData.role && (
      <div>
        <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-[#937a5f]">
          {productLabel}{isFarmer ? " *" : " (isteğe bağlı)"}
        </span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PRODUCT_OPTIONS.map((product) => {
            const selected = profileData.productionProducts.includes(product)
            return (
              <button
                key={product}
                type="button"
                onClick={() => toggleProduct(product)}
                className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                  selected
                    ? "border-[#3a5a40] bg-[#eaf3e5] text-[#2c4c3b]"
                    : "border-[#eadcca] bg-white/80 text-[#766754] hover:border-[#3a5a40]/70"
                }`}
              >
                {product}
              </button>
            )
          })}
        </div>
      </div>
      )}

      <div className="rounded-2xl border border-[#eadcca] bg-white/82 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-black text-[#2b241d]">
          <FileCheck2 className="h-4 w-4 text-[#2c4c3b]" />
          {isMerchant ? "Ticari doğrulama" : isFarmer ? "Üretici doğrulaması" : "Gerekli belge"}
        </div>
        {!profileData.role && (
          <p className="text-sm leading-6 text-[#766754]">Hesap tipinizi seçince sadece gerekli belge alanları açılır.</p>
        )}
        {isFarmer && (
          <>
          <input
            placeholder="ÇKS / üretici belge no *"
            className={AUTH_INPUT_CLASS}
            value={documents.producerCertificate}
            onChange={(event) => setDocuments((prev) => ({ ...prev, producerCertificate: event.target.value }))}
          />
          <p className="mt-2 text-xs font-semibold leading-5 text-[#766754]">Çiftçi hesabında vergi no veya ticari faaliyet belgesi istenmez.</p>
          </>
        )}
        {isMerchant && (
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              placeholder="Vergi no *"
              className={AUTH_INPUT_CLASS}
              value={documents.identityNumber}
              onChange={(event) => setDocuments((prev) => ({ ...prev, identityNumber: event.target.value }))}
            />
            <input
              placeholder="Ticaret sicil / MERSİS / oda kayıt no *"
              className={AUTH_INPUT_CLASS}
              value={documents.chamberRecord}
              onChange={(event) => setDocuments((prev) => ({ ...prev, chamberRecord: event.target.value }))}
            />
          </div>
        )}
        {profileData.role && (
          <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-[#b9d1a7] bg-[#f7f2ea] px-4 py-3 text-xs font-bold text-[#766754] transition hover:border-[#3a5a40]">
            <span>{documents.fileNames.length ? documents.fileNames.join(", ") : isMerchant ? "Ticari belge dosyası yükle (isteğe bağlı)" : "ÇKS belgesi yükle (isteğe bağlı)"}</span>
            <span className="shrink-0 text-[#2c4c3b]">Seç</span>
            <input type="file" multiple accept=".pdf,image/*" className="hidden" onChange={onDocumentUpload} />
          </label>
        )}
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-[#937a5f]">Hakkında</span>
        <textarea
          placeholder="Üretim alanınız, ürünleriniz ve çalışma şekliniz..."
          className="h-20 w-full resize-none rounded-xl border border-[#e5d6c2] bg-[#fffaf2] px-4 py-3 text-sm font-semibold text-[#2b241d] placeholder:text-[#a79681] focus:outline-none focus:ring-4 focus:ring-[#3a5a40]/10"
          value={profileData.bio}
          onChange={(event) => setProfileData((prev) => ({ ...prev, bio: event.target.value }))}
        />
      </label>

      <Button className="h-12 w-full rounded-xl bg-[#2c4c3b] font-black text-white hover:bg-[#243f31]" onClick={onRegister}>
        Hesap Oluştur
      </Button>
    </div>
  )
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-[#937a5f]">{label}</span>
      <div className="relative">{children}</div>
    </label>
  )
}

function GoogleAuthButton({ label, hint, onClick }: { label: string; hint: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-2xl border border-[#e5d6c2] bg-white px-4 py-3 text-left shadow-[0_16px_40px_-34px_rgba(74,59,50,0.65)] transition hover:-translate-y-0.5 hover:border-[#d6c5af] hover:bg-[#fffdf8] hover:shadow-[0_24px_55px_-38px_rgba(74,59,50,0.78)]"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#e5d6c2] bg-[#fffaf2] text-lg font-black text-[#2b241d]">
        G
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black text-[#2b241d]">{label}</span>
        <span className="mt-0.5 block text-xs font-semibold leading-5 text-[#766754]">{hint}</span>
      </span>
      <span className="hidden rounded-full bg-[#eaf3e5] px-3 py-1 text-xs font-black text-[#2c4c3b] sm:inline-flex">
        Hızlı
      </span>
    </button>
  )
}

function LeafIcon() {
  return (
    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf3e5] text-[#2c4c3b]">
      <User className="h-6 w-6" />
    </span>
  )
}

function StoreIcon() {
  return (
    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff0e7] text-[#d97742]">
      <ShieldCheck className="h-6 w-6" />
    </span>
  )
}
