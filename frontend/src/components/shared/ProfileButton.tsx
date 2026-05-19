"use client"

import { useEffect, useState } from "react"
import { UserRound } from "lucide-react"
import Link from "next/link"

import { AUTH_CHANGED_EVENT, AuthUser, getStoredUser } from "@/lib/auth"
import { AuthModal } from "./AuthModal"

export function ProfileButton() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [mounted, setMounted] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "register">("login")

  useEffect(() => {
    const load = () => setUser(getStoredUser())
    const timer = window.setTimeout(() => {
      setMounted(true)
      load()
      window.addEventListener(AUTH_CHANGED_EVENT, load)
    }, 0)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener(AUTH_CHANGED_EVENT, load)
    }
  }, [])

  const initials = user?.name ?
     user.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toLocaleUpperCase("tr-TR")
    : ""

  if (mounted && !user) {
    return (
      <>
        <div className="ml-2 flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setAuthMode("login")
              setAuthOpen(true)
            }}
            className="inline-flex h-11 items-center whitespace-nowrap rounded-2xl bg-[#3A5A40] px-4 text-sm font-extrabold text-white shadow-[0_16px_35px_-24px_rgba(42,33,26,0.8)] transition hover:bg-[#2C4C3B]"
          >
            Giriş Yap
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode("register")
              setAuthOpen(true)
            }}
            className="hidden h-11 items-center whitespace-nowrap rounded-2xl border border-[#D6C7B1] bg-white px-4 text-sm font-extrabold text-[#2C4C3B] shadow-[0_16px_35px_-30px_rgba(42,33,26,0.55)] transition hover:border-[#C8D8BD] hover:bg-[#EAF1E4] sm:inline-flex"
          >
            Kayıt Ol
          </button>
        </div>
        <AuthModal
          isOpen={authOpen}
          onClose={() => setAuthOpen(false)}
          initialMode={authMode}
          onSuccess={(nextUser) => {
            setUser(nextUser)
            setAuthOpen(false)
          }}
        />
      </>
    )
  }

  return (
    <Link
      href="/profile/me"
      className="ml-2 inline-flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-2xl border border-[#E4DBC8] bg-white px-2.5 pr-4 text-sm font-extrabold text-[#2A211A] shadow-[0_16px_35px_-28px_rgba(42,33,26,0.65)] transition-all hover:border-[#C8D8BD] hover:bg-[#FAF7F2]"
      aria-label="Profilim"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#EAF1E4] text-xs font-black text-[#2C4C3B] ring-1 ring-[#C8D8BD]">
        {mounted && user?.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.photo} alt="" className="h-full w-full object-cover" />
        ) : mounted && initials ? (
          initials
        ) : (
          <UserRound className="h-4 w-4" />
        )}
      </span>
      <span className="hidden sm:inline">Profilim</span>
    </Link>
  )
}
