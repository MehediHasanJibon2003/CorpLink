import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"
import AppLayout from "../components/layout/AppLayout"
import { logAdminActivity } from "../utils/logger"

const POST_TYPES = [
  { value: "announcement", label: "Announcement", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "promotion", label: "Product Promotion", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "event", label: "Event / Campaign", color: "bg-orange-50 text-orange-700 border-orange-200" },
  { value: "internal", label: "Internal Alert", color: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700" }
]

function Feed() {
  const { user, profile } = useAuth()

  const [posts, setPosts] = useState([])
  const [filter, setFilter] = useState("all") // all, internal, public, campaigns
  
  // Form State
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [visibility, setVisibility] = useState("internal")
  const [postType, setPostType] = useState("announcement")
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState("")
  const [editingId, setEditingId] = useState(null)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [expandedComments, setExpandedComments] = useState([])
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [commentInputs, setCommentInputs] = useState({})

  const fetchPosts = async () => {
    setError("")

    // Fetch posts with company names joined
    const { data: announcementsData, error: announcementsError } = await supabase
      .from("announcements")
      .select("*, companies(name)")
      .order("created_at", { ascending: false })

    if (announcementsError) {
      setError(announcementsError.message)
      return
    }

    const { data: likesData } = await supabase.from("announcement_likes").select("*")
    const { data: commentsData } = await supabase.from("announcement_comments").select("*").order("created_at", { ascending: true })

    const mergedPosts = (announcementsData || []).map((post) => {
      const postLikes = (likesData || []).filter((like) => like.announcement_id === post.id)
      const postComments = (commentsData || []).filter((comment) => comment.announcement_id === post.id)
      const likedByMe = postLikes.some((like) => like.user_id === user?.id)

      return {
        ...post,
        likesCount: postLikes.length,
        commentsCount: postComments.length,
        comments: postComments,
        likedByMe,
      }
    })

    setPosts(mergedPosts)
  }

  useEffect(() => {
    if (user?.id) fetchPosts()
  }, [user?.id])

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) {
      setSelectedImage(null)
      setImagePreview("")
      return
    }
    setSelectedImage(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const uploadImage = async (file) => {
    if (!file) return null
    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
    const filePath = `posts/${fileName}`
    const { error: uploadError } = await supabase.storage.from("feed-images").upload(filePath, file)
    if (uploadError) throw new Error(uploadError.message)
    const { data } = supabase.storage.from("feed-images").getPublicUrl(filePath)
    return data.publicUrl
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setMessage("")

    if (!title.trim() || !content.trim()) { setError("Title and content are required"); return }
    if (!profile?.company_id || !user?.id) return

    setLoading(true)

    try {
      let imageUrl = null
      if (selectedImage) imageUrl = await uploadImage(selectedImage)

      if (editingId) {
        const payload = {
          title: title.trim(),
          content: content.trim(),
          visibility: visibility,
          post_type: postType,
        }
        if (imageUrl) payload.image_url = imageUrl

        const { error } = await supabase.from("announcements").update(payload).eq("id", editingId)
        if (error) throw new Error(error.message)
        setMessage("Post updated successfully!")
        
        await logAdminActivity({
          company_id: profile.company_id, user_id: user.id,
          action: "Updated a corporate feed post", entity: "announcement", severity: "info"
        })
      } else {
        const { error } = await supabase.from("announcements").insert([{
          company_id: profile.company_id,
          title: title.trim(),
          content: content.trim(),
          image_url: imageUrl,
          visibility: visibility,
          post_type: postType,
          created_by: user.id,
        }])
        if (error) throw new Error(error.message)
        setMessage("Post created successfully!")
        
        await logAdminActivity({
          company_id: profile.company_id, user_id: user.id,
          action: "Published a new post to the feed", entity: "announcement", severity: "info"
        })
      }

      setTitle(""); setContent(""); setVisibility("internal"); setPostType("announcement")
      setSelectedImage(null); setImagePreview(""); setEditingId(null)
      fetchPosts()
    } catch (err) {
      setError(err.message || "Failed to post")
    } finally {
      setLoading(false)
      setTimeout(() => setMessage(""), 3000)
    }
  }

  const handleEdit = (post) => {
    setEditingId(post.id)
    setTitle(post.title || "")
    setContent(post.content || "")
    setVisibility(post.visibility || "internal")
    setPostType(post.post_type || "announcement")
    setSelectedImage(null)
    setImagePreview(post.image_url || "")
    setError("")
    setMessage("")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this post permanently?")) return
    setError(""); setMessage("")
    
    const { error } = await supabase.from("announcements").delete().eq("id", id)
    if (error) {
      setError(error.message)
    } else {
      setMessage("Post deleted.")
      await logAdminActivity({
        company_id: profile.company_id, user_id: user.id,
        action: "Deleted a feed post", entity: "announcement", severity: "warning"
      })
      fetchPosts()
    }
  }

  // Optimistic UI updates for likes to make it feel fast
  const handleToggleLike = async (post) => {
    // 1. Optimistically update local state
    setPosts(prev => prev.map(p => {
      if (p.id === post.id) {
        return {
          ...p,
          likedByMe: !p.likedByMe,
          likesCount: p.likedByMe ? p.likesCount - 1 : p.likesCount + 1
        }
      }
      return p
    }))

    // 2. Perform DB operation in background
    if (post.likedByMe) {
      await supabase.from("announcement_likes")
        .delete()
        .match({ announcement_id: post.id, user_id: user.id })
    } else {
      await supabase.from("announcement_likes").insert([{
        announcement_id: post.id,
        company_id: profile.company_id,
        user_id: user.id,
      }])
      
      await logAdminActivity({
        company_id: profile.company_id, user_id: user.id,
        action: "Liked a post", entity: "announcement", severity: "info"
      })
    }
  }

  // Optimistic UI for comments
  const handleAddComment = async (post) => {
    const text = commentInputs[post.id]?.trim()
    if (!text || !user?.id) return

    // Immediately update UI count
    setPosts(prev => prev.map(p => {
      if (p.id === post.id) {
        return {
          ...p,
          commentsCount: p.commentsCount + 1,
          comments: [...p.comments, { id: 'temp', comment_text: text, created_at: new Date().toISOString() }]
        }
      }
      return p
    }))
    
    // Clear input
    setCommentInputs(prev => ({ ...prev, [post.id]: "" }))

    // DB Insert
    await supabase.from("announcement_comments").insert([{
      announcement_id: post.id,
      company_id: profile.company_id,
      user_id: user.id,
      comment_text: text,
    }])
    
    await logAdminActivity({
      company_id: profile.company_id, user_id: user.id,
      action: "Commented on a post", entity: "announcement", severity: "info"
    })
    
    // Silent re-fetch
    fetchPosts()
  }

  const toggleComments = (postId) => {
    setExpandedComments(prev => 
      prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]
    )
    
    // Optional: focus the input after opening
    setTimeout(() => {
      if (!expandedComments.includes(postId)) {
        document.getElementById(`comment-${postId}`)?.focus()
      }
    }, 100)
  }

  // Modern robust Share approach
  const handleShare = async (postId) => {
    const shareUrl = `${window.location.origin}/feed?post=${postId}`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'CorpLink Post', url: shareUrl })
      } else {
        await navigator.clipboard.writeText(shareUrl)
        alert("Link copied to clipboard!")
      }
      
      // Bonus: Increment views slightly upon interaction as an analytics simulation
      const post = posts.find(p => p.id === postId)
      if (post) {
        await supabase.from("announcements").update({ views_count: (post.views_count || 0) + 1 }).eq("id", postId)
      }
      
    } catch (err) {
      console.error("Share failed", err)
    }
  }

  // Filter posts logic
  const filteredPosts = posts.filter(post => {
    if (filter === "all") return true
    if (filter === "internal") return post.visibility === "internal" && post.company_id === profile?.company_id
    if (filter === "public") return post.visibility === "public"
    if (filter === "campaigns") return post.post_type === "promotion" || post.post_type === "event"
    return true
  })

  return (
    <AppLayout title="Corporate Feed" subtitle="News, Campaigns & Updates">
      <div className="max-w-3xl mx-auto space-y-6 pb-20">
        
        {/* CREATE POST SECTION */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-5">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                {profile?.full_name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 leading-tight">Create an Update</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Share with your company or the public</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-4 mb-2">
                <select 
                  value={visibility} onChange={(e) => setVisibility(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500 font-medium text-slate-700 dark:text-slate-200"
                >
                  <option value="internal">🔒 Internal Only</option>
                  <option value="public">🌍 Public (All Companies)</option>
                </select>

                <select 
                  value={postType} onChange={(e) => setPostType(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500 font-medium text-slate-700 dark:text-slate-200"
                >
                  {POST_TYPES.map(pt => <option key={pt.value} value={pt.value}>{pt.label}</option>)}
                </select>
              </div>

              <input
                type="text" placeholder="Campaign or update title" value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 px-4 py-3 rounded-xl outline-none focus:border-blue-500 font-medium"
              />
              <textarea
                placeholder="Write your corporate update..." value={content} onChange={(e) => setContent(e.target.value)} rows="3"
                className="w-full border border-slate-300 dark:border-slate-600 px-4 py-4 rounded-xl outline-none focus:border-blue-500 resize-none text-sm"
              />

              <div className="flex items-center gap-4">
                <label className="cursor-pointer flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 px-4 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-200 transition">
                  <span>📸 Add Media</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
                {imagePreview && <span className="text-sm text-green-600 font-medium">Image attached</span>}
                
                <button type="submit" disabled={loading} className="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-semibold transition">
                  {loading ? "Saving..." : editingId ? "Update Post" : "Publish Post"}
                </button>
                {editingId && (
                  <button type="button" onClick={() => {
                    setEditingId(null); setTitle(""); setContent(""); setSelectedImage(null); setImagePreview("")
                  }} className="bg-slate-200 hover:bg-slate-300 text-slate-800 dark:text-slate-100 px-6 py-2.5 rounded-xl font-semibold transition">
                    Cancel
                  </button>
                )}
              </div>
              {(error || message) && (
                <div className={`p-3 rounded-lg text-sm ${error ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                  {error || message}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* FEED FILTER TABS */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {["All News", "Internal", "Public Hub", "Campaigns"].map((tab, idx) => {
            const keys = ["all", "internal", "public", "campaigns"]
            const isActive = filter === keys[idx]
            return (
              <button
                key={keys[idx]}
                onClick={() => setFilter(keys[idx])}
                className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-semibold transition border ${
                  isActive ? "bg-slate-800 text-white border-slate-800 shadow-sm" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-900/50"
                }`}
              >
                {tab}
              </button>
            )
          })}
        </div>

        {/* FEED TIMELINE */}
        {filteredPosts.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-10 text-center">
            <div className="text-4xl mb-2">📰</div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">No posts found for this filter.</p>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const typeConfig = POST_TYPES.find(t => t.value === post.post_type) || POST_TYPES[0]
            const isMyCompany = post.company_id === profile?.company_id
            
            return (
              <div key={post.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mt-4">
                {/* Header */}
                <div className="p-5 flex items-start justify-between border-b border-slate-50 relative">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                      {post.companies?.name?.charAt(0)?.toUpperCase() || "C"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900 dark:text-white leading-tight">
                          {post.companies?.name || "Corporate User"}
                        </h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${typeConfig.color}`}>
                          {typeConfig.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {new Date(post.created_at).toLocaleDateString([], { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          {post.visibility === 'public' ? '🌍 Public' : '🔒 Internal'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 3-Dot Menu */}
                  {post.created_by === user?.id && (
                    <div className="relative">
                      <button 
                        onClick={() => setOpenMenuId(openMenuId === post.id ? null : post.id)} 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:bg-slate-800 transition focus:outline-none"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z"/></svg>
                      </button>
                      
                      {openMenuId === post.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)}></div>
                          <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 z-20 py-1 overflow-hidden">
                            <button 
                              onClick={() => { handleEdit(post); setOpenMenuId(null); }} 
                              className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:bg-slate-900/50 flex items-center gap-2 transition"
                            >
                              ✏️ Edit Post
                            </button>
                            <button 
                              onClick={() => { handleDelete(post.id); setOpenMenuId(null); }} 
                              className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 transition"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="px-5 py-4">
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{post.title}</h4>
                  <p className="text-slate-700 dark:text-slate-200 whitespace-pre-line text-[15px] leading-relaxed">
                    {post.content}
                  </p>
                </div>

                {/* Media */}
                {post.image_url && (
                  <div className="w-full bg-slate-50 dark:bg-slate-900/50 border-y border-slate-100 dark:border-slate-800">
                    <img src={post.image_url} alt={post.title} className="w-full max-h-[400px] object-contain" />
                  </div>
                )}

                {/* Analytics & Interaction Bar */}
                <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <div className="flex gap-4">
                    <span>❤️ {post.likesCount}</span>
                    <span>💬 {post.commentsCount}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900/50 px-2 py-1 rounded">
                    <span>📈</span>
                    <span>{Number(post.views_count || 0) + Number(post.likesCount || 0) + Number(post.commentsCount || 0)} views</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 divide-x divide-slate-100">
                  <button onClick={() => handleToggleLike(post)} className={`py-3 flex items-center justify-center gap-2 text-sm font-semibold transition ${post.likedByMe ? "text-blue-600 bg-blue-50/50" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900/50"}`}>
                    {post.likedByMe ? '💙 Liked' : '🤍 Like'}
                  </button>
                  <button onClick={() => toggleComments(post.id)} className={`py-3 flex items-center justify-center gap-2 text-sm font-semibold transition ${expandedComments.includes(post.id) ? "text-blue-600 bg-blue-50/50" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900/50"}`}>
                    💬 Comment
                  </button>
                  <button onClick={() => handleShare(post.id)} className="py-3 flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900/50 transition">
                    ↗ Share
                  </button>
                </div>

                {/* Comments Section (Facebook style toggle) */}
                {expandedComments.includes(post.id) && (
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex gap-3 text-sm">
                      <input
                        id={`comment-${post.id}`} type="text" placeholder="Write a comment..."
                        value={commentInputs[post.id] || ""}
                        onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post)}
                        className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-full outline-none focus:border-blue-500 shadow-sm transition"
                      />
                      <button onClick={() => handleAddComment(post)} className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-full font-semibold transition">
                        Post
                      </button>
                    </div>
                    
                    {/* Active Comments Render */}
                    {post.comments.length > 0 && (
                      <div className="mt-4 space-y-3">
                        {post.comments.map((comment) => (
                          <div key={comment.id} className="flex gap-2">
                            <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 mt-0.5">U</div>
                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 shadow-sm flex-1">
                              {/* If you add user names to comments later, put it here as a bold tag before the text */}
                              {comment.comment_text}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </AppLayout>
  )
}

export default Feed