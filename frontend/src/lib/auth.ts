"use client"

/* eslint-disable @typescript-eslint/no-explicit-any */

export type UserRole = "farmer" | "merchant"

export type AuthUser = {
  id: string
  email: string
  name: string
  photo: string
  role: UserRole
  phone: string
  city: string
  productionProducts: string[]
  bio: string
  provider: "google" | "local" | "demo"
}

declare global {
  interface Window {
    google: any
  }
}

export const AUTH_CHANGED_EVENT = "ciftciden_auth_changed"

const USERS_STORAGE_KEY = "ciftciden_users"
const CREDENTIALS_STORAGE_KEY = "ciftciden_credentials"
const DOCUMENTS_STORAGE_KEY = "ciftciden_user_documents"

const SESSION_KEYS = [
  "user_logged_in",
  "user_id",
  "user_email",
  "user_name",
  "user_photo",
  "user_role",
  "user_phone",
  "user_city",
  "user_products",
  "user_bio",
  "user_provider",
]

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback
  try {
    return JSON.parse(localStorage.getItem(key) || "") as T
  } catch {
    return fallback
  }
}

function toSafeId(value: string) {
  const clean = value.trim().toLocaleLowerCase("tr-TR")
  return clean.replace(/[^a-z0-9._@-]+/gi, "_").replace(/^_+|_+$/g, "") || `local_${Date.now()}`
}

export function makeUserId(seed: string, provider = "google") {
  return `${provider}_${toSafeId(seed)}`
}

export function getStoredUsers() {
  return readJson<Record<string, AuthUser>>(USERS_STORAGE_KEY, {})
}

function getStoredCredentials() {
  return readJson<Record<string, { userId: string; password: string }>>(CREDENTIALS_STORAGE_KEY, {})
}

function normalizeEmail(email: string) {
  return email.trim().toLocaleLowerCase("tr-TR")
}

export function getStoredUser(): AuthUser | null {
  if (!canUseStorage() || localStorage.getItem("user_logged_in") !== "true") return null

  const users = getStoredUsers()
  const email = localStorage.getItem("user_email") || ""
  const legacyName = localStorage.getItem("user_name") || ""
  const id = localStorage.getItem("user_id") || makeUserId(email || legacyName || "demo", email ? "google" : "local")
  const stored = users[id] || ({} as Partial<AuthUser>)

  return {
    id,
    email: stored.email || email,
    name: stored.name || legacyName || email || "Kullanıcı",
    photo: stored.photo || localStorage.getItem("user_photo") || "",
    role: (stored.role || localStorage.getItem("user_role") || "farmer") as UserRole,
    phone: stored.phone || localStorage.getItem("user_phone") || "",
    city: stored.city || localStorage.getItem("user_city") || "",
    productionProducts: stored.productionProducts || readJson<string[]>("user_products", []),
    bio: stored.bio || localStorage.getItem("user_bio") || "",
    provider: stored.provider || (localStorage.getItem("user_provider") as AuthUser["provider"]) || "google",
  }
}

export function getUserByName(name: string) {
  const decoded = decodeURIComponent(name)
  return Object.values(getStoredUsers()).find((user) => user.name === decoded)
}

export function saveAuthUser(input: Partial<AuthUser> & { id: string; name: string; email: string }) {
  if (!canUseStorage()) {
    return {
      id: input.id,
      email: input.email || "",
      name: input.name || input.email || "Kullanıcı",
      photo: input.photo || "",
      role: (input.role || "farmer") as UserRole,
      phone: input.phone || "",
      city: input.city || "",
      productionProducts: input.productionProducts || [],
      bio: input.bio || "",
      provider: input.provider || "google",
    } satisfies AuthUser
  }

  const users = getStoredUsers()
  const currentSession = getStoredUser()
  const sessionBelongsToSameAccount = currentSession && (
    currentSession.id === input.id || (!!input.email && currentSession.email === input.email)
  )
  const previous = users[input.id] || (sessionBelongsToSameAccount ? currentSession : null)

  const user: AuthUser = {
    id: input.id,
    email: input.email || previous.email || "",
    name: input.name.trim() || previous.name || input.email || "Kullanıcı",
    photo: input.photo || previous.photo || "",
    role: (input.role || previous.role || "farmer") as UserRole,
    phone: input.phone || previous.phone || "",
    city: input.city || previous.city || "",
    productionProducts: input.productionProducts || previous.productionProducts || [],
    bio: input.bio || previous.bio || "",
    provider: input.provider || previous.provider || "google",
  }

  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify({ ...users, [user.id]: user }))
  localStorage.setItem("user_logged_in", "true")
  localStorage.setItem("user_id", user.id)
  localStorage.setItem("user_email", user.email)
  localStorage.setItem("user_name", user.name)
  localStorage.setItem("user_photo", user.photo)
  localStorage.setItem("user_role", user.role)
  localStorage.setItem("user_phone", user.phone)
  localStorage.setItem("user_city", user.city)
  localStorage.setItem("user_products", JSON.stringify(user.productionProducts))
  localStorage.setItem("user_bio", user.bio)
  localStorage.setItem("user_provider", user.provider)
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT))

  return user
}

export function saveLocalCredentials(userId: string, email: string, password: string) {
  if (!canUseStorage()) return
  const credentials = getStoredCredentials()
  credentials[normalizeEmail(email)] = { userId, password }
  localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(credentials))
}

export function loginWithEmail(email: string, password: string) {
  if (!canUseStorage()) return null
  const credentials = getStoredCredentials()
  const credential = credentials[normalizeEmail(email)]
  if (!credential || credential.password !== password) return null

  const user = getStoredUsers()[credential.userId]
  if (!user) return null
  return saveAuthUser({ ...user, provider: user.provider || "local" })
}

export function saveUserDocuments(userId: string, documents: Record<string, string | string[]>) {
  if (!canUseStorage()) return
  const stored = readJson<Record<string, Record<string, string | string[]>>>(DOCUMENTS_STORAGE_KEY, {})
  localStorage.setItem(DOCUMENTS_STORAGE_KEY, JSON.stringify({ ...stored, [userId]: documents }))
}

export function clearAuthUser() {
  if (!canUseStorage()) return
  SESSION_KEYS.forEach((key) => localStorage.removeItem(key))
  window.google.accounts.id.disableAutoSelect?.()
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT))
}

export function buildGoogleUser(payload: Record<string, unknown>) {
  const email = String(payload.email || "")
  const subject = String(payload.sub || email || payload.name || "")
  if (!subject && !email) return null

  return {
    id: makeUserId(subject || email, "google"),
    email,
    name: String(payload.name || email || "Google Kullanıcısı"),
    photo: String(payload.picture || ""),
    provider: "google" as const,
  }
}

export function ownerMatchesUser(owner: { ownerId?: string; ownerName?: string; authorId?: string; author?: string }, user: AuthUser | null) {
  if (!user) return false
  const ownerId = owner.ownerId || owner.authorId
  const ownerName = owner.ownerName || owner.author
  return ownerId ? ownerId === user.id : ownerName === user.name
}
