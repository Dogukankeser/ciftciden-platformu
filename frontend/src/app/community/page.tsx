"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  Bot,
  Heart,
  Image as ImageIcon,
  Loader2,
  LogIn,
  Maximize2,
  MessageCircle,
  Pencil,
  Send,
  Sparkles,
  Trash2,
  User,
  Video,
  X,
} from "lucide-react"
import Link from "next/link"

import { AuthModal } from "@/components/shared/AuthModal"
import { AuthUser, getStoredUser } from "@/lib/auth"
import { compressImage } from "@/lib/imageUtils"

type PostComment = {
  authorId?: string
  author: string
  text: string
  time: string
  authorPhoto?: string
  isMuhtar?: boolean
}

type Post = {
  id: string
  authorId?: string
  authorEmail?: string
  author: string
  authorPhoto: string
  content: string
  imageUrl?: string
  videoUrl?: string
  likes: number
  comments: PostComment[]
  time: string
  likedBy: string[]
}

const postsStorageKey = "ciftciden_posts"
const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

const seedPosts: Post[] = [
  {
    id: "seed-p1",
    author: "Mehmet Yılmaz",
    authorPhoto: "",
    content:
      "Malatya’da Hacıhaliloğlu kayısısı için kurutma alanını hazırladık. Depoya girişte nem ölçümü yapıp alıcıya analiz bilgisini de paylaşacağız.",
    likes: 24,
    comments: [
      { author: "Ali Kaya", text: "Bereketli olsun. Numune paketini erken hazırlamak teklif sürecini hızlandırıyor.", time: "2 saat önce" },
      { author: "Fatma Demir", text: "Nem bilgisini ilanda açık yazarsanız alıcı güveni artar.", time: "1 saat önce" },
    ],
    time: "3 saat önce",
    likedBy: [],
  },
  {
    id: "seed-p2",
    author: "Fatma Demir",
    authorPhoto: "",
    content:
      "Serada salkım domates ilk kesime yaklaştı. Damla sulama düzeni iyi gidiyor, bu hafta beyazsinek için sarı tuzakları sıklaştırdık.",
    likes: 18,
    comments: [{ author: "Ayşe Korkmaz", text: "Sarı tuzakları kaç metrede bir koyuyorsunuz?", time: "3 saat önce" }],
    time: "5 saat önce",
    likedBy: [],
  },
  {
    id: "seed-p3",
    author: "Ali Kaya",
    authorPhoto: "",
    content:
      "Isparta tarafında elma karaleke belirtisi konuşuluyor. Yağıştan sonra bahçeyi gezenler yaprak üstünü ve meyve yüzeyini kontrol etsin.",
    likes: 45,
    comments: [
      {
        author: "Muhtar",
        isMuhtar: true,
        text:
          "Olası sorun: karaleke riski. Yağıştan sonra yaprak ve meyve yüzeyindeki lekeleri kontrol edin. Lekeli yaprakları bahçede bırakmayın, ağacı havalandırın. İlaç kararı için yerel ziraat uzmanına danışın.",
        time: "2 saat önce",
      },
    ],
    time: "6 saat önce",
    likedBy: [],
  },
]

function textValue(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback
}

function normalizeComment(comment: Partial<PostComment>): PostComment {
  return {
    authorId: textValue(comment.authorId),
    author: textValue(comment.author, "Anonim Üretici"),
    text: textValue(comment.text),
    time: textValue(comment.time, "Şimdi"),
    authorPhoto: textValue(comment.authorPhoto),
    isMuhtar: !!comment.isMuhtar,
  }
}

function normalizePost(post: Partial<Post>): Post {
  return {
    id: textValue(post.id, `post_${Date.now()}`),
    authorId: textValue(post.authorId),
    authorEmail: textValue(post.authorEmail),
    author: textValue(post.author, "Anonim Üretici"),
    authorPhoto: textValue(post.authorPhoto),
    content: textValue(post.content),
    imageUrl: textValue(post.imageUrl) || undefined,
    videoUrl: textValue(post.videoUrl) || undefined,
    likes: Number.isFinite(Number(post.likes)) ? Number(post.likes) : 0,
    comments: Array.isArray(post.comments) ? post.comments.map(normalizeComment).filter((comment) => comment.text) : [],
    time: textValue(post.time, "Şimdi"),
    likedBy: Array.isArray(post.likedBy) ? post.likedBy.map(String) : [],
  }
}

function isOldDemoPost(post: Post) {
  const content = post.content.toLocaleLowerCase("tr-TR")

  return (
    content.includes("kayısı ağaçlarımdaki bu hastalık nedir") ||
    content.includes("kayisi ağaçlarımdaki bu hastalık nedir") ||
    content.includes("hay babby") ||
    content.includes("hi ken") ||
    content.includes("ijoisefjcjf")
  )
}

function dataUrlToBlob(dataUrl: string) {
  const [meta, value] = dataUrl.split(",")
  const mime = meta.match(/data:(.*);base64/)?.[1] || "image/jpeg"
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return new Blob([bytes], { type: mime })
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function cleanMuhtarText(text: string) {
  const lines = text
    .replace(/\*\*/g, "")
    .replace(/#{1,6}\s*/g, "")
    .replace(/[✅🌿🔍📊⚠️🛡️]/g, "")
    .split(/\n+/)
    .map((line) => line.replace(/^\s*[-•]\s*/, "").replace(/\s+/g, " ").trim())
    .filter(Boolean)

  const uniqueLines = Array.from(new Set(lines))
  return uniqueLines.slice(0, 6).join("\n")
}

function localMuhtarFallback(question: string) {
  const lower = question.toLocaleLowerCase("tr-TR")

  if (
    lower.includes("kayısı") &&
    (lower.includes("dal") ||
      lower.includes("sürgün") ||
      lower.includes("çiçek") ||
      lower.includes("kuruma") ||
      lower.includes("hastalık"))
  ) {
    return [
      "En olası durum: kayısıda monilya kaynaklı çiçek ve sürgün yanıklığına benziyor.",
      "Dayanak: dal ve çiçek kısımlarında kahverengileşme ile geriye doğru kuruma görülüyor.",
      "Bugün yapın: kuruyan sürgünleri sağlam dokudan 10-15 cm aşağıdan kesip bahçeden uzaklaştırın.",
      "Yayılımı izleyin: yağış ve yüksek nem varsa aynı bahçedeki diğer ağaçları sık kontrol edin.",
      "İlaç kararı için fotoğrafla birlikte ilçe tarım veya ziraat mühendisine danışın.",
    ].join("\n")
  }

  if (lower.includes("hastalık") || lower.includes("leke") || lower.includes("çil") || lower.includes("karaleke")) {
    return [
      "Kesin teşhis için yakın plan yaprak, meyve ve dal fotoğrafı gerekir.",
      "En olası durum: görüntüdeki belirtiye göre mantari hastalık veya çevresel zarar olabilir.",
      "Bugün yapın: hastalıklı görünen kısımları ayırın, döküntüleri bahçede bırakmayın.",
      "Yayılımı izleyin: yağış, yüksek nem ve yeni leke artışı varsa kontrolü sıklaştırın.",
      "İlaç kararı için ürün, dönem ve yakın plan fotoğrafla ziraat mühendisine danışın.",
    ].join("\n")
  }

  if (lower.includes("fiyat") || lower.includes("kaç tl") || lower.includes("kac tl") || lower.includes("pazar")) {
    return [
      "Tek fiyat vermek doğru olmaz; kalite, nem, tonaj ve teslim şekli fiyatı değiştirir.",
      "Benzer ürünlerde piyasa bandını ve son teklifleri kontrol edin.",
      "Numune, gerçek fotoğraf ve analiz bilgisi teklif kalitesini artırır.",
      "Nakliye ve ödeme şartını ilanda açık yazın.",
    ].join("\n")
  }

  if (lower.includes("sulama") || lower.includes("nem") || lower.includes("hava") || lower.includes("don")) {
    return [
      "Sulama kararını toprak nemi ve hava durumuna göre verin.",
      "Sabah erken veya akşam serinliği daha uygundur.",
      "Yaprak ıslak kalıyorsa mantari risk artar; aşırı sulamadan kaçının.",
      "Don riski varsa çiçek döneminde bahçeyi gece takip edin.",
    ].join("\n")
  }

  return [
    "Daha net cevap için ürün, şehir, dönem ve fotoğraf ekleyin.",
    "Sorun hastalıksa yaprak, meyve ve dalı yakın çekim paylaşın.",
    "Fiyat sorusuysa kalite, miktar, nem ve teslim bilgisini yazın.",
  ].join("\n")
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [newPostText, setNewPostText] = useState("")
  const [newPostImage, setNewPostImage] = useState<string | null>(null)
  const [newPostVideo, setNewPostVideo] = useState<string | null>(null)
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({})
  const [muhtarQuestion, setMuhtarQuestion] = useState("")
  const [muhtarAnswer, setMuhtarAnswer] = useState("")
  const [muhtarLoading, setMuhtarLoading] = useState(false)
  const [userPhoto, setUserPhoto] = useState("")
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [imageViewerUrl, setImageViewerUrl] = useState("")
  const [isMounted, setIsMounted] = useState(false)
  const [editingPostId, setEditingPostId] = useState("")
  const [editingPostText, setEditingPostText] = useState("")
  const [editingComment, setEditingComment] = useState<{ postId: string; index: number } | null>(null)
  const [editingCommentText, setEditingCommentText] = useState("")
  const [muhtarCommentLoading, setMuhtarCommentLoading] = useState<Record<string, boolean>>({})

  const totals = useMemo(
    () => ({
      posts: posts.length,
      comments: posts.reduce((sum, post) => sum + post.comments.length, 0),
      likes: posts.reduce((sum, post) => sum + post.likes, 0),
    }),
    [posts],
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const user = getStoredUser()
      const stored = JSON.parse(localStorage.getItem(postsStorageKey) || "[]") as Partial<Post>[]
      const userPosts = stored
        .map(normalizePost)
        .filter((post) => post.content || post.imageUrl || post.videoUrl)
        .filter((post) => !isOldDemoPost(post))
        .filter((post) => post.authorId)
      const nextPosts = [...userPosts, ...seedPosts]

      localStorage.setItem(postsStorageKey, JSON.stringify(nextPosts))
      setPosts(nextPosts)
      setIsMounted(true)
      setCurrentUser(user)
      setUserPhoto(user?.photo || "")
      setIsLoggedIn(!!user)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [])

  const savePosts = (updated: Post[]) => {
    setPosts(updated)
    try {
      localStorage.setItem(postsStorageKey, JSON.stringify(updated))
    } catch {
      window.alert("Dosya tarayıcı depolama sınırını aşıyor. Daha kısa video veya daha küçük görsel deneyin.")
    }
  }

  const handleAuthSuccess = (user: AuthUser) => {
    setCurrentUser(user)
    setUserPhoto(user.photo)
    setIsLoggedIn(true)
  }

  const requireAuth = () => {
    setAuthOpen(true)
  }

  const callMuhtar = async (question: string, mediaUrl?: string): Promise<string> => {
    const concisePrompt = [
      "Çiftçiye sade Türkçe cevap ver.",
      "En fazla 5 kısa madde kullan.",
      "Kesin teşhis koyma; olasılık ve yapılacak ilk işleri yaz.",
      "Fotoğraf veya video varsa görüntüyü metinle birlikte değerlendir.",
      "Görüntü net değilse hastalık uydurma, yakın plan fotoğraf iste.",
      "Gereksiz emoji, uzun giriş ve karmaşık terim kullanma.",
      question,
    ].join("\n")

    try {
      const response = mediaUrl
        ? await fetch(`${backendUrl}/api/v1/muhtar/analyze`, {
            method: "POST",
            body: (() => {
              const payload = new FormData()
              const mediaBlob = dataUrlToBlob(mediaUrl)
              const extension = mediaBlob.type.startsWith("video/") ? "mp4" : "jpg"
              payload.append("text", concisePrompt)
              payload.append("image", mediaBlob, `paylasim.${extension}`)
              return payload
            })(),
          })
        : await fetch(`${backendUrl}/api/v1/muhtar/ask`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: concisePrompt }),
          })

      if (!response.ok) throw new Error(`Sunucu hatası: ${response.status}`)
      const data = await response.json()
      const text = data.muhtar_response || data.answer || data.response || data.text || localMuhtarFallback(question)
      return cleanMuhtarText(text)
    } catch (error) {
      console.warn("Muhtar API fallback:", error)
      return cleanMuhtarText(localMuhtarFallback(question))
    }
  }

  const handleMuhtarAsk = async () => {
    if (!muhtarQuestion.trim()) return
    setMuhtarLoading(true)
    setMuhtarAnswer("")
    const answer = await callMuhtar(muhtarQuestion)
    setMuhtarAnswer(answer)
    setMuhtarLoading(false)
  }

  const handleMuhtarComment = async (postId: string, postContent: string, mediaUrl?: string) => {
    setMuhtarCommentLoading((previous) => ({ ...previous, [postId]: true }))

    try {
      const answer = await callMuhtar(`Paylaşımı değerlendir ve çiftçiye kısa yol göster: ${postContent}`, mediaUrl)
      const updated = posts.map((post) => {
        if (post.id !== postId) return post
        return {
          ...post,
          comments: [
            ...post.comments,
            {
              author: "Muhtar",
              isMuhtar: true,
              text: answer,
              time: "Şimdi",
            },
          ],
        }
      })
      savePosts(updated)
    } finally {
      setMuhtarCommentLoading((previous) => ({ ...previous, [postId]: false }))
    }
  }

  const handlePost = () => {
    if (!isLoggedIn || !currentUser) {
      requireAuth()
      return
    }

    if (!newPostText.trim() && !newPostImage && !newPostVideo) return

    const newPost: Post = {
      id: `post_${Date.now()}`,
      authorId: currentUser.id,
      authorEmail: currentUser.email,
      author: currentUser.name,
      authorPhoto: currentUser.photo,
      content: newPostText.trim(),
      imageUrl: newPostImage || undefined,
      videoUrl: newPostVideo || undefined,
      likes: 0,
      comments: [],
      time: "Şimdi",
      likedBy: [],
    }

    savePosts([newPost, ...posts])
    setNewPostText("")
    setNewPostImage(null)
    setNewPostVideo(null)
  }

  const handleLike = (postId: string) => {
    if (!isLoggedIn || !currentUser) {
      requireAuth()
      return
    }

    savePosts(
      posts.map((post) => {
        if (post.id !== postId) return post
        const liked = post.likedBy.includes(currentUser.id)
        return {
          ...post,
          likes: liked ? Math.max(0, post.likes - 1) : post.likes + 1,
          likedBy: liked ? post.likedBy.filter((id) => id !== currentUser.id) : [...post.likedBy, currentUser.id],
        }
      }),
    )
  }

  const handleComment = (postId: string) => {
    if (!isLoggedIn || !currentUser) {
      requireAuth()
      return
    }

    const text = commentTexts[postId] || ""
    if (!text.trim()) return

    savePosts(
      posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: [
                ...post.comments,
                {
                  authorId: currentUser.id,
                  author: currentUser.name,
                  authorPhoto: currentUser.photo,
                  text: text.trim(),
                  time: "Şimdi",
                },
              ],
            }
          : post,
      ),
    )
    setCommentTexts((previous) => ({ ...previous, [postId]: "" }))
  }

  const handleMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    const file = event.target.files?.[0]
    if (!file) return

    if (type === "image") {
      const imageData = file.size <= 8 * 1024 * 1024 ? await fileToDataUrl(file) : await compressImage(file, 2200, 0.95)
      setNewPostImage(imageData)
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => setNewPostVideo(reader.result as string)
    reader.readAsDataURL(file)
  }

  const isLikedByCurrentUser = (post: Post) => !!currentUser && post.likedBy.includes(currentUser.id)
  const isOwnPost = (post: Post) => !!currentUser && post.authorId === currentUser.id
  const isOwnComment = (comment: PostComment) => !!currentUser && comment.authorId === currentUser.id && !comment.isMuhtar

  const savePostEdit = (postId: string) => {
    const text = editingPostText.trim()
    if (!text) return

    savePosts(posts.map((post) => (post.id === postId && isOwnPost(post) ? { ...post, content: text } : post)))
    setEditingPostId("")
    setEditingPostText("")
  }

  const deletePost = (postId: string) => {
    const post = posts.find((item) => item.id === postId)
    if (!post || !isOwnPost(post)) return
    savePosts(posts.filter((item) => item.id !== postId))
  }

  const startEditComment = (postId: string, index: number, text: string) => {
    setEditingComment({ postId, index })
    setEditingCommentText(text)
  }

  const saveCommentEdit = () => {
    if (!editingComment || !editingCommentText.trim()) return

    savePosts(
      posts.map((post) => {
        if (post.id !== editingComment.postId) return post
        return {
          ...post,
          comments: post.comments.map((comment, index) =>
            index === editingComment.index && isOwnComment(comment) ? { ...comment, text: editingCommentText.trim() } : comment,
          ),
        }
      }),
    )
    setEditingComment(null)
    setEditingCommentText("")
  }

  const deleteComment = (postId: string, index: number) => {
    savePosts(
      posts.map((post) => {
        if (post.id !== postId) return post
        const comment = post.comments[index]
        if (!comment || !isOwnComment(comment)) return post
        return { ...post, comments: post.comments.filter((_, itemIndex) => itemIndex !== index) }
      }),
    )
  }

  if (!isMounted) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#3A5A40] border-t-transparent" />
      </div>
    )
  }

  return (
    <>
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} onSuccess={handleAuthSuccess} title="Dijital Kahvehane için giriş yapın" />

      {imageViewerUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 p-4 sm:p-8" onClick={() => setImageViewerUrl("")}>
          <button
            type="button"
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
            onClick={() => setImageViewerUrl("")}
            aria-label="Fotoğrafı kapat"
          >
            <X className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageViewerUrl}
            alt="Büyütülmüş paylaşım fotoğrafı"
            className="max-h-full max-w-full rounded-2xl object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="space-y-5">
          <div className="rounded-[28px] border border-[#E4DBC8] bg-white p-5 shadow-[0_24px_80px_-62px_rgba(42,33,26,0.48)]">
            {isLoggedIn && currentUser ? (
              <div className="flex gap-3">
                <Link href="/profile/me" className="shrink-0">
                  <Avatar photo={userPhoto} name={currentUser.name} size="lg" />
                </Link>
                <div className="min-w-0 flex-1">
                  <textarea
                    placeholder="Bahçeden, depodan veya pazardan ne paylaşmak istersiniz?"
                    className="min-h-[96px] w-full resize-none rounded-2xl border border-[#E7DCCB] bg-[#FAF7F2] px-4 py-3 text-[15px] font-medium leading-6 text-[#2A211A] outline-none transition placeholder:text-[#8B7355] focus:border-[#2C4C3B] focus:bg-white"
                    value={newPostText}
                    onChange={(event) => setNewPostText(event.target.value)}
                  />

                  {(newPostImage || newPostVideo) && (
                    <div className="mt-3 overflow-hidden rounded-2xl border border-[#E7DCCB] bg-[#FAF7F2] p-2">
                      {newPostImage && (
                        <div className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={newPostImage} alt="" className="max-h-72 w-full rounded-xl object-contain" />
                          <RemoveMediaButton onClick={() => setNewPostImage(null)} label="Fotoğrafı kaldır" />
                        </div>
                      )}
                      {newPostVideo && (
                        <div className="relative">
                          <video src={newPostVideo} className="max-h-72 w-full rounded-xl bg-black object-contain" controls />
                          <RemoveMediaButton onClick={() => setNewPostVideo(null)} label="Videoyu kaldır" />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div className="flex flex-wrap gap-2">
                      <MediaLabel icon={ImageIcon} label="Fotoğraf" onChange={(event) => handleMediaUpload(event, "image")} accept="image/*" />
                      <MediaLabel icon={Video} label="Video" onChange={(event) => handleMediaUpload(event, "video")} accept="video/*" />
                    </div>
                    <button
                      type="button"
                      className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#3A5A40] px-5 text-sm font-black text-white shadow-[0_18px_36px_-24px_rgba(58,90,64,0.9)] transition hover:bg-[#2C4C3B] disabled:cursor-not-allowed disabled:opacity-45"
                      onClick={handlePost}
                      disabled={!newPostText.trim() && !newPostImage && !newPostVideo}
                    >
                      Paylaş
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#C8D8BD] bg-[#EAF1E4] text-[#2C4C3B]">
                    <LogIn className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-black text-[#2A211A]">Paylaşım yapmak için giriş yapın</div>
                    <div className="text-sm font-medium text-[#6E5A42]">Yazı, fotoğraf veya video ekleyip kendi hesabınızdan paylaşabilirsiniz.</div>
                  </div>
                </div>
                <button type="button" className="h-11 rounded-2xl bg-[#3A5A40] px-5 text-sm font-black text-white" onClick={requireAuth}>
                  Giriş Yap
                </button>
              </div>
            )}
          </div>

          <div className="space-y-5">
            {posts.map((post, index) => (
              <PostCard
                key={post.id}
                post={post}
                index={index}
                currentUser={currentUser}
                commentText={commentTexts[post.id] || ""}
                editingPostId={editingPostId}
                editingPostText={editingPostText}
                editingComment={editingComment}
                editingCommentText={editingCommentText}
                muhtarLoading={!!muhtarCommentLoading[post.id]}
                isLiked={isLikedByCurrentUser(post)}
                isOwnPost={isOwnPost(post)}
                isOwnComment={isOwnComment}
                onLike={() => handleLike(post.id)}
                onAskMuhtar={() => handleMuhtarComment(post.id, post.content, post.imageUrl || post.videoUrl)}
                onOpenImage={(url) => setImageViewerUrl(url)}
                onStartEditPost={() => {
                  setEditingPostId(post.id)
                  setEditingPostText(post.content)
                }}
                onEditPostText={setEditingPostText}
                onSavePostEdit={() => savePostEdit(post.id)}
                onCancelPostEdit={() => setEditingPostId("")}
                onDeletePost={() => deletePost(post.id)}
                onCommentTextChange={(text) => setCommentTexts((previous) => ({ ...previous, [post.id]: text }))}
                onCommentSubmit={() => handleComment(post.id)}
                onStartEditComment={(commentIndex, text) => startEditComment(post.id, commentIndex, text)}
                onEditCommentText={setEditingCommentText}
                onSaveCommentEdit={saveCommentEdit}
                onCancelCommentEdit={() => setEditingComment(null)}
                onDeleteComment={(commentIndex) => deleteComment(post.id, commentIndex)}
              />
            ))}
          </div>
        </section>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-[28px] border border-[#C8D8BD] bg-[#EAF1E4] p-5 shadow-[0_24px_80px_-62px_rgba(42,33,26,0.48)]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2C4C3B] text-[#F9F8F6]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-black text-[#2A211A]">Muhtar’a Sor</div>
                <div className="text-xs font-bold text-[#2C4C3B]">Kısa, anlaşılır, uygulanabilir</div>
              </div>
            </div>
            <textarea
              placeholder="Örn: Kayısı yaprağında kahverengi leke var, ne yapmalıyım?"
              className="min-h-28 w-full resize-none rounded-2xl border border-[#C8D8BD] bg-white px-4 py-3 text-sm font-semibold leading-6 text-[#2A211A] outline-none placeholder:text-[#8B7355] focus:border-[#2C4C3B]"
              value={muhtarQuestion}
              onChange={(event) => setMuhtarQuestion(event.target.value)}
            />
            <button
              type="button"
              className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#2C4C3B] px-5 text-sm font-black text-white transition hover:bg-[#203A2D] disabled:opacity-45"
              onClick={handleMuhtarAsk}
              disabled={muhtarLoading || !muhtarQuestion.trim()}
            >
              {muhtarLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
              Cevapla
            </button>
            {muhtarAnswer && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-2xl border border-[#C8D8BD] bg-white p-4">
                <p className="whitespace-pre-wrap text-sm font-medium leading-7 text-[#2A211A]">{muhtarAnswer}</p>
                <div className="mt-3 text-xs font-bold text-[#6E5A42]">Ön değerlendirmedir. Kesin uygulama için yerel ziraat uzmanına danışın.</div>
              </motion.div>
            )}
          </section>

          <section className="rounded-[28px] border border-[#E4DBC8] bg-white p-5 shadow-[0_24px_80px_-62px_rgba(42,33,26,0.48)]">
            <div className="text-sm font-black text-[#2A211A]">Kahvehane Nabzı</div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <PulseStat label="Paylaşım" value={totals.posts} />
              <PulseStat label="Yorum" value={totals.comments} />
              <PulseStat label="Beğeni" value={totals.likes} />
            </div>
          </section>
        </aside>
      </div>
    </>
  )
}

function PostCard({
  post,
  index,
  currentUser,
  commentText,
  editingPostId,
  editingPostText,
  editingComment,
  editingCommentText,
  muhtarLoading,
  isLiked,
  isOwnPost,
  isOwnComment,
  onLike,
  onAskMuhtar,
  onOpenImage,
  onStartEditPost,
  onEditPostText,
  onSavePostEdit,
  onCancelPostEdit,
  onDeletePost,
  onCommentTextChange,
  onCommentSubmit,
  onStartEditComment,
  onEditCommentText,
  onSaveCommentEdit,
  onCancelCommentEdit,
  onDeleteComment,
}: {
  post: Post
  index: number
  currentUser: AuthUser | null
  commentText: string
  editingPostId: string
  editingPostText: string
  editingComment: { postId: string; index: number } | null
  editingCommentText: string
  muhtarLoading: boolean
  isLiked: boolean
  isOwnPost: boolean
  isOwnComment: (comment: PostComment) => boolean
  onLike: () => void
  onAskMuhtar: () => void
  onOpenImage: (url: string) => void
  onStartEditPost: () => void
  onEditPostText: (text: string) => void
  onSavePostEdit: () => void
  onCancelPostEdit: () => void
  onDeletePost: () => void
  onCommentTextChange: (text: string) => void
  onCommentSubmit: () => void
  onStartEditComment: (index: number, text: string) => void
  onEditCommentText: (text: string) => void
  onSaveCommentEdit: () => void
  onCancelCommentEdit: () => void
  onDeleteComment: (index: number) => void
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.035 }}
      className="rounded-[28px] border border-[#E4DBC8] bg-white p-5 shadow-[0_24px_80px_-62px_rgba(42,33,26,0.48)]"
    >
      <div className="mb-4 flex items-center gap-3">
        <Link href={`/profile/${encodeURIComponent(post.author)}`} className="shrink-0">
          <Avatar photo={post.authorPhoto} name={post.author} size="lg" />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/profile/${encodeURIComponent(post.author)}`} className="line-clamp-1 text-sm font-black text-[#2A211A] hover:underline">
            {post.author}
          </Link>
          <div className="text-xs font-semibold text-[#8B7355]">{post.time}</div>
        </div>
        {isOwnPost && (
          <div className="flex items-center gap-1">
            <IconButton label="Paylaşımı düzenle" onClick={onStartEditPost} icon={Pencil} />
            <IconButton label="Paylaşımı sil" onClick={onDeletePost} icon={Trash2} danger />
          </div>
        )}
      </div>

      {editingPostId === post.id ? (
        <div className="mb-4">
          <textarea
            value={editingPostText}
            onChange={(event) => onEditPostText(event.target.value)}
            className="min-h-28 w-full resize-none rounded-2xl border border-[#DED1BC] bg-[#FAF7F2] px-4 py-3 text-sm font-medium text-[#2A211A] outline-none focus:border-[#2C4C3B]"
          />
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={onCancelPostEdit} className="h-10 rounded-2xl border border-[#D6C7B1] px-4 text-sm font-black text-[#6E5A42]">
              İptal
            </button>
            <button type="button" onClick={onSavePostEdit} className="h-10 rounded-2xl bg-[#3A5A40] px-4 text-sm font-black text-white">
              Kaydet
            </button>
          </div>
        </div>
      ) : (
        post.content && <p className="mb-4 whitespace-pre-wrap break-words text-[15px] font-medium leading-7 text-[#3D3228]">{post.content}</p>
      )}

      {post.imageUrl && (
        <button
          type="button"
          className="group relative mb-4 w-full overflow-hidden rounded-2xl border border-[#E7DCCB] bg-[#FAF7F2]"
          onClick={() => onOpenImage(post.imageUrl || "")}
          aria-label="Fotoğrafı büyüt"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.imageUrl} alt="" className="max-h-[620px] w-full object-contain" />
          <span className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition group-hover:opacity-100">
            <Maximize2 className="h-4 w-4" />
          </span>
        </button>
      )}

      {post.videoUrl && <video src={post.videoUrl} className="mb-4 max-h-[480px] w-full rounded-2xl border border-[#E7DCCB] bg-black object-contain" controls />}

      <div className="grid grid-cols-3 gap-2 border-y border-[#E7DCCB] py-2">
        <ActionButton active={isLiked} icon={Heart} label={`${post.likes} Beğen`} onClick={onLike} />
        <ActionButton icon={MessageCircle} label={`${post.comments.length} Yorum`} onClick={() => undefined} />
        <button
          type="button"
          onClick={onAskMuhtar}
          disabled={muhtarLoading}
          className="flex h-10 min-w-0 items-center justify-center gap-2 rounded-2xl text-sm font-black text-[#2C4C3B] transition hover:bg-[#EAF1E4] disabled:opacity-45"
        >
          {muhtarLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 shrink-0" />}
          <span className="truncate">Muhtar</span>
        </button>
      </div>

      {post.comments.length > 0 && (
        <div className="mt-4 space-y-3">
          {post.comments.map((comment, commentIndex) => (
            <div key={`${post.id}-${commentIndex}`} className={`flex gap-3 ${comment.isMuhtar ? "rounded-2xl border border-[#C8D8BD] bg-[#EAF1E4] p-3" : ""}`}>
              <Avatar photo={comment.authorPhoto || ""} name={comment.author} isMuhtar={comment.isMuhtar} />
              <div className={`min-w-0 flex-1 rounded-2xl px-4 py-3 ${comment.isMuhtar ? "bg-white/82" : "border border-[#E7DCCB] bg-[#FAF7F2]"}`}>
                <div className="mb-1 flex items-center justify-between gap-3">
                  <span className={`line-clamp-1 text-xs font-black ${comment.isMuhtar ? "text-[#2C4C3B]" : "text-[#2A211A]"}`}>{comment.author}</span>
                  <span className="shrink-0 text-[10px] font-semibold text-[#8B7355]">{comment.time}</span>
                </div>
                {editingComment?.postId === post.id && editingComment.index === commentIndex ? (
                  <div>
                    <input
                      value={editingCommentText}
                      onChange={(event) => onEditCommentText(event.target.value)}
                      className="h-10 w-full rounded-2xl border border-[#DED1BC] bg-white px-3 text-sm outline-none focus:border-[#2C4C3B]"
                    />
                    <div className="mt-2 flex justify-end gap-3">
                      <button type="button" onClick={onCancelCommentEdit} className="text-xs font-black text-[#8B7355]">
                        İptal
                      </button>
                      <button type="button" onClick={onSaveCommentEdit} className="text-xs font-black text-[#2C4C3B]">
                        Kaydet
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <span className="min-w-0 flex-1 whitespace-pre-wrap break-words text-sm font-medium leading-6 text-[#3D3228]">{comment.text}</span>
                    {isOwnComment(comment) && (
                      <span className="flex shrink-0 gap-1">
                        <button type="button" onClick={() => onStartEditComment(commentIndex, comment.text)} className="text-[#8B7355] hover:text-[#2C4C3B]" aria-label="Yorumu düzenle">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => onDeleteComment(commentIndex)} className="text-[#8B7355] hover:text-[#B42318]" aria-label="Yorumu sil">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {currentUser && (
        <div className="mt-4 flex items-center gap-2">
          <Avatar photo={currentUser.photo} name={currentUser.name} />
          <input
            type="text"
            placeholder="Yorum yaz..."
            className="h-11 min-w-0 flex-1 rounded-full border border-[#DED1BC] bg-[#FAF7F2] px-4 text-sm font-medium text-[#2A211A] outline-none placeholder:text-[#8B7355] focus:border-[#2C4C3B] focus:bg-white"
            value={commentText}
            onChange={(event) => onCommentTextChange(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && onCommentSubmit()}
          />
          <button
            type="button"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#2C4C3B] transition hover:bg-[#EAF1E4] disabled:opacity-45"
            onClick={onCommentSubmit}
            disabled={!commentText.trim()}
            aria-label="Yorum gönder"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      )}
    </motion.article>
  )
}

function PulseStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[#E7DCCB] bg-[#FAF7F2] p-3 text-center">
      <div className="text-lg font-black text-[#2C4C3B]">{value}</div>
      <div className="mt-1 truncate text-[10px] font-black uppercase tracking-[0.12em] text-[#8B7355]">{label}</div>
    </div>
  )
}

function ActionButton({ active, icon: Icon, label, onClick }: { active?: boolean; icon: typeof Heart; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-10 min-w-0 items-center justify-center gap-2 rounded-2xl text-sm font-black transition ${
        active ? "bg-red-50 text-[#B42318]" : "text-[#6E5A42] hover:bg-[#FAF7F2] hover:text-[#2C4C3B]"
      }`}
    >
      <Icon className={`h-4 w-4 shrink-0 ${active ? "fill-current" : ""}`} />
      <span className="truncate">{label}</span>
    </button>
  )
}

function Avatar({ photo, name, size = "sm", isMuhtar }: { photo: string; name: string; size?: "sm" | "lg"; isMuhtar?: boolean }) {
  const dimension = size === "lg" ? "h-11 w-11" : "h-9 w-9"
  const initial = name ? name.charAt(0).toLocaleUpperCase("tr-TR") : "Ü"

  return (
    <div
      className={`flex ${dimension} shrink-0 items-center justify-center overflow-hidden rounded-full border ${
        isMuhtar ? "border-[#2C4C3B]/25 bg-[#2C4C3B] text-white" : "border-[#E7DCCB] bg-[#FAF7F2] text-[#8B7355]"
      }`}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt="" className="h-full w-full object-cover" />
      ) : isMuhtar ? (
        <Sparkles className="h-4 w-4" />
      ) : name ? (
        <span className="text-xs font-black">{initial}</span>
      ) : (
        <User className="h-4 w-4" />
      )}
    </div>
  )
}

function MediaLabel({
  icon: Icon,
  label,
  accept,
  onChange,
}: {
  icon: typeof ImageIcon
  label: string
  accept: string
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <label className="flex h-10 cursor-pointer items-center gap-2 rounded-2xl border border-[#D6C7B1] bg-[#FAF7F2] px-4 text-sm font-black text-[#5C4A3D] transition hover:bg-[#EAF1E4] hover:text-[#2C4C3B]">
      <Icon className="h-4 w-4" />
      {label}
      <input type="file" accept={accept} className="hidden" onChange={onChange} />
    </label>
  )
}

function RemoveMediaButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#B42318] text-white shadow-md"
      aria-label={label}
    >
      <X className="h-4 w-4" />
    </button>
  )
}

function IconButton({ label, onClick, icon: Icon, danger }: { label: string; onClick: () => void; icon: typeof Pencil; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center rounded-full transition ${danger ? "text-[#B42318] hover:bg-red-50" : "text-[#6E5A42] hover:bg-[#FAF7F2]"}`}
      aria-label={label}
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}
