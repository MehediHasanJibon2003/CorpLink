import { useEffect, useState, useCallback } from "react"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../context/AuthContext"
import {
  Radio,
  Heart,
  MessageCircle,
  RefreshCw,
  AlertCircle,
  Megaphone,
  Calendar,
  Filter,
  ChevronDown,
  Send,
  X,
} from "lucide-react"

// ─── Skeleton ──────────────────────────────────────────────────────
function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded-lg ${className}`} />
}

// ─── Time Ago ──────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

// ─── Post Type Config ──────────────────────────────────────────────
const typeConfig = {
  announcement: { label: "Announcement", class: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400", icon: Megaphone },
  event: { label: "Event", class: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400", icon: Calendar },
  promotion: { label: "Promotion", class: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400", icon: Radio },
  general: { label: "General", class: "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300", icon: Radio },
}

// ─── Comment Section ───────────────────────────────────────────────
function CommentSection({ post, user, profile }) {
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchComments()
  }, [post.id])

  const fetchComments = async () => {
    const { data } = await supabase
      .from("post_comments")
      .select("id, content, created_at, employee_id")
      .eq("post_id", post.id)
      .order("created_at", { ascending: true })
      .limit(20)
    setComments(data || [])
    setLoading(false)
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    setSubmitting(true)
    try {
      const { data } = await supabase.from("post_comments").insert([{
        post_id: post.id,
        employee_id: user.id,
        content: newComment.trim(),
        company_id: profile.company_id,
        created_at: new Date().toISOString(),
      }]).select().single()
      if (data) setComments(prev => [...prev, data])
      setNewComment("")
    } catch (_) {}
    setSubmitting(false)
  }

  return (
    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
      {loading ? (
        <Skeleton className="h-10 w-full" />
      ) : (
        <>
          {comments.length > 0 && (
            <div className="space-y-2 mb-3">
              {comments.map(c => (
                <div key={c.id} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl px-3 py-2">
                  <p className="text-xs text-slate-700 dark:text-slate-300">{c.content}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{timeAgo(c.created_at)}</p>
                </div>
              ))}
            </div>
          )}
          <form onSubmit={handleComment} className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-3 py-2 text-xs bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition disabled:opacity-50 shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </>
      )}
    </div>
  )
}

// ─── Post Card ─────────────────────────────────────────────────────
function PostCard({ post, user, profile }) {
  const [liked, setLiked] = useState(post.userLiked || false)
  const [likeCount, setLikeCount] = useState(post.likeCount || 0)
  const [showComments, setShowComments] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)

  const tConf = typeConfig[post.type] || typeConfig.general
  const TypeIcon = tConf.icon

  const toggleLike = async () => {
    if (likeLoading) return
    setLikeLoading(true)
    try {
      if (liked) {
        await supabase.from("post_reactions").delete()
          .eq("post_id", post.id).eq("employee_id", user.id)
        setLikeCount(c => c - 1)
      } else {
        await supabase.from("post_reactions").insert([{
          post_id: post.id,
          employee_id: user.id,
          type: "like",
          company_id: profile.company_id,
        }])
        setLikeCount(c => c + 1)
      }
      setLiked(!liked)
    } catch (_) {}
    setLikeLoading(false)
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 hover:shadow-md transition-shadow">
      {/* Author row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
            {(post.authorName || "A").charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{post.authorName || "Admin"}</p>
            <p className="text-[10px] text-slate-400">{timeAgo(post.created_at)}</p>
          </div>
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${tConf.class}`}>
          <TypeIcon className="h-3 w-3" />
          {tConf.label}
        </span>
      </div>

      {/* Content */}
      {post.title && (
        <h3 className="font-bold text-slate-800 dark:text-white text-base mb-1.5">{post.title}</h3>
      )}
      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{post.content}</p>

      {/* Media */}
      {post.media_url && (
        <img
          src={post.media_url}
          alt="Post media"
          className="mt-3 rounded-xl w-full object-cover max-h-64"
        />
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
        <button
          onClick={toggleLike}
          className={`flex items-center gap-1.5 text-sm font-medium transition ${
            liked ? "text-red-500" : "text-slate-400 hover:text-red-500"
          }`}
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
          <span>{likeCount}</span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-blue-600 transition"
        >
          <MessageCircle className="h-4 w-4" />
          <span>Comment</span>
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <CommentSection post={post} user={user} profile={profile} />
      )}
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────
function CorporateFeed() {
  const { user, profile } = useAuth()

  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [typeFilter, setTypeFilter] = useState("all")
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchFeed = useCallback(async () => {
    if (!user?.id || !profile?.company_id) return
    setLoading(true)
    setError(null)

    try {
      // Try the announcements table (existing in DB)
      const { data: announcements, error: aErr } = await supabase
        .from("announcements")
        .select("id, title, content, type, created_at, created_by")
        .eq("company_id", profile.company_id)
        .order("created_at", { ascending: false })
        .limit(30)

      if (aErr && aErr.code !== "42P01") throw aErr

      // Also try posts table (may or may not exist)
      let postsData = []
      try {
        const { data: pd } = await supabase
          .from("posts")
          .select("id, title, content, type, media_url, created_at, author_id")
          .eq("corporate_id", profile.company_id)
          .order("created_at", { ascending: false })
          .limit(30)
        postsData = pd || []
      } catch (_) {}

      // Normalize announcements
      const normalizedAnnouncements = (announcements || []).map(a => ({
        id: `ann-${a.id}`,
        title: a.title,
        content: a.content,
        type: a.type || "announcement",
        created_at: a.created_at,
        authorName: "Admin",
        likeCount: 0,
        userLiked: false,
        media_url: null,
      }))

      // Normalize posts
      const normalizedPosts = postsData.map(p => ({
        id: `post-${p.id}`,
        title: p.title,
        content: p.content,
        type: p.type || "general",
        created_at: p.created_at,
        authorName: "Team",
        likeCount: 0,
        userLiked: false,
        media_url: p.media_url,
      }))

      // Merge and sort
      const merged = [...normalizedAnnouncements, ...normalizedPosts]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

      setPosts(merged)
    } catch (err) {
      console.error("CorporateFeed error:", err)
      setError("Could not load the company feed.")
    } finally {
      setLoading(false)
    }
  }, [user, profile, refreshKey])

  useEffect(() => {
    fetchFeed()
  }, [fetchFeed])

  const filteredPosts = typeFilter === "all"
    ? posts
    : posts.filter(p => p.type === typeFilter)

  const filterTabs = [
    { value: "all", label: "All Posts" },
    { value: "announcement", label: "Announcements" },
    { value: "event", label: "Events" },
    { value: "promotion", label: "Promotions" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Radio className="h-6 w-6 text-emerald-500" />
            Corporate Feed
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Company news, announcements & updates
          </p>
        </div>
        <button
          onClick={() => setRefreshKey(k => k + 1)}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filterTabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setTypeFilter(tab.value)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              typeFilter === tab.value
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-8 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <p className="text-red-700 dark:text-red-400 font-semibold text-sm">{error}</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center py-20 text-center px-6">
          <Radio className="h-14 w-14 text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="font-bold text-slate-600 dark:text-slate-300 text-lg">Nothing here yet</h3>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">
            {typeFilter === "all"
              ? "No company posts or announcements yet."
              : `No ${typeFilter} posts found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredPosts.map(post => (
            <PostCard key={post.id} post={post} user={user} profile={profile} />
          ))}
        </div>
      )}
    </div>
  )
}

export default CorporateFeed
