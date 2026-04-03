import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"
import AppLayout from "../components/layout/AppLayout"

function Feed() {
  const { user, profile } = useAuth()

  const [posts, setPosts] = useState([])
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState("")
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [commentInputs, setCommentInputs] = useState({})

  const fetchPosts = async () => {
    setError("")

    const { data: announcementsData, error: announcementsError } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false })

    if (announcementsError) {
      setError(announcementsError.message)
      return
    }

    const { data: likesData, error: likesError } = await supabase
      .from("announcement_likes")
      .select("*")

    if (likesError) {
      setError(likesError.message)
      return
    }

    const { data: commentsData, error: commentsError } = await supabase
      .from("announcement_comments")
      .select("*")
      .order("created_at", { ascending: true })

    if (commentsError) {
      setError(commentsError.message)
      return
    }

    const mergedPosts = (announcementsData || []).map((post) => {
      const postLikes = (likesData || []).filter(
        (like) => like.announcement_id === post.id
      )

      const postComments = (commentsData || []).filter(
        (comment) => comment.announcement_id === post.id
      )

      const likedByMe = postLikes.some((like) => like.user_id === user?.id)

      return {
        ...post,
        likes: postLikes,
        comments: postComments,
        likedByMe,
      }
    })

    setPosts(mergedPosts)
  }

  useEffect(() => {
    if (user?.id) {
      fetchPosts()
    }
  }, [user?.id])

  const resetForm = () => {
    setTitle("")
    setContent("")
    setSelectedImage(null)
    setImagePreview("")
    setEditingId(null)
    setError("")
    setMessage("")
  }

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
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${fileExt}`
    const filePath = `posts/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from("feed-images")
      .upload(filePath, file)

    if (uploadError) {
      throw new Error(uploadError.message)
    }

    const { data } = supabase.storage
      .from("feed-images")
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setMessage("")

    if (!title.trim() || !content.trim()) {
      setError("Title and content দাও")
      return
    }

    if (!profile?.company_id || !user?.id) {
      setError("User বা company info পাওয়া যায়নি")
      return
    }

    setLoading(true)

    try {
      let imageUrl = null

      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage)
      }

      if (editingId) {
        const payload = {
          title: title.trim(),
          content: content.trim(),
        }

        if (imageUrl) {
          payload.image_url = imageUrl
        }

        const { error } = await supabase
          .from("announcements")
          .update(payload)
          .eq("id", editingId)

        if (error) {
          setError(error.message)
          setLoading(false)
          return
        }

        await supabase.from("activity_logs").insert([
          {
            company_id: profile.company_id,
            user_id: user.id,
            action: "Updated Announcement",
            entity: "announcement",
          },
        ])

        setMessage("Post updated successfully")
      } else {
        const { error } = await supabase.from("announcements").insert([
          {
            company_id: profile.company_id,
            title: title.trim(),
            content: content.trim(),
            image_url: imageUrl,
            created_by: user.id,
          },
        ])

        if (error) {
          setError(error.message)
          setLoading(false)
          return
        }

        await supabase.from("activity_logs").insert([
          {
            company_id: profile.company_id,
            user_id: user.id,
            action: "Created Announcement",
            entity: "announcement",
          },
        ])

        setMessage("Post created successfully")
      }

      resetForm()
      fetchPosts()
    } catch (err) {
      console.error("Feed submit error:", err)
      setError(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (post) => {
    setEditingId(post.id)
    setTitle(post.title || "")
    setContent(post.content || "")
    setSelectedImage(null)
    setImagePreview(post.image_url || "")
    setError("")
    setMessage("")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleDelete = async (id) => {
    const ok = window.confirm("Delete this post?")
    if (!ok) return

    setError("")
    setMessage("")

    const { error } = await supabase
      .from("announcements")
      .delete()
      .eq("id", id)

    if (error) {
      setError(error.message)
      return
    }

    await supabase.from("activity_logs").insert([
      {
        company_id: profile.company_id,
        user_id: user.id,
        action: "Deleted Announcement",
        entity: "announcement",
      },
    ])

    setMessage("Post deleted successfully")
    fetchPosts()
  }

  const handleToggleLike = async (post) => {
    setError("")
    setMessage("")

    if (!profile?.company_id || !user?.id) return

    if (post.likedByMe) {
      const myLike = post.likes.find((like) => like.user_id === user.id)
      if (!myLike) return

      const { error } = await supabase
        .from("announcement_likes")
        .delete()
        .eq("id", myLike.id)

      if (error) {
        setError(error.message)
        return
      }
    } else {
      const { error } = await supabase.from("announcement_likes").insert([
        {
          announcement_id: post.id,
          company_id: profile.company_id,
          user_id: user.id,
        },
      ])

      if (error) {
        setError(error.message)
        return
      }
    }

    fetchPosts()
  }

  const handleCommentChange = (postId, value) => {
    setCommentInputs((prev) => ({
      ...prev,
      [postId]: value,
    }))
  }

  const handleAddComment = async (postId) => {
    setError("")
    setMessage("")

    const text = commentInputs[postId]?.trim()

    if (!text) {
      setError("Comment লিখো")
      return
    }

    if (!profile?.company_id || !user?.id) {
      setError("User বা company info পাওয়া যায়নি")
      return
    }

    const { error } = await supabase.from("announcement_comments").insert([
      {
        announcement_id: postId,
        company_id: profile.company_id,
        user_id: user.id,
        comment_text: text,
      },
    ])

    if (error) {
      setError(error.message)
      return
    }

    await supabase.from("activity_logs").insert([
      {
        company_id: profile.company_id,
        user_id: user.id,
        action: "Commented On Announcement",
        entity: "announcement",
      },
    ])

    setCommentInputs((prev) => ({
      ...prev,
      [postId]: "",
    }))

    fetchPosts()
  }

  const handleShare = async (postId) => {
    try {
      const shareUrl = `${window.location.origin}/feed?post=${postId}`

      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl)
      } else {
        const textArea = document.createElement("textarea")
        textArea.value = shareUrl
        textArea.style.position = "fixed"
        textArea.style.left = "-999999px"
        textArea.style.top = "-999999px"
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand("copy")
        textArea.remove()
      }

      setMessage("Post link copied successfully")
      setError("")

      await supabase.from("activity_logs").insert([
        {
          company_id: profile.company_id,
          user_id: user.id,
          action: "Shared Announcement",
          entity: "announcement",
        },
      ])
    } catch (err) {
      console.error("Share error:", err)
      setError("Share failed")
    }
  }

  return (
    <AppLayout title="Company Feed" subtitle="Facebook-style corporate social feed">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                {profile?.full_name?.charAt(0)?.toUpperCase() || "A"}
              </div>

              <div className="flex-1 bg-slate-100 rounded-full px-5 py-3 text-slate-500">
                What's on your company mind, {profile?.full_name?.split(" ")[0] || "Admin"}?
              </div>
            </div>

            <div className="mt-4 border-t border-slate-200 pt-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Post title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-slate-300 px-4 py-3 rounded-2xl outline-none focus:border-blue-500"
                />

                <textarea
                  placeholder="Write your company update..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full border border-slate-300 px-4 py-4 rounded-2xl outline-none focus:border-blue-500 resize-none"
                  rows="4"
                />

                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Add Photo
                  </label>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-slate-600"
                  />

                  {imagePreview && (
                    <div className="mt-4 rounded-2xl overflow-hidden border border-slate-200">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full max-h-[350px] object-cover"
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium"
                  >
                    {loading ? "Saving..." : editingId ? "Update Post" : "Post"}
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-6 py-3 rounded-xl font-medium"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
              {message && <p className="text-green-600 text-sm mt-4">{message}</p>}
            </div>
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <p className="text-slate-500">No announcements yet</p>
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="h-11 w-11 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                      {profile?.companies?.name?.charAt(0)?.toUpperCase() || "C"}
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-800">
                        {profile?.companies?.name || "Company"}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(post.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleEdit(post)}
                      className="text-blue-600 text-sm font-medium hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="text-red-600 text-sm font-medium hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="text-lg font-semibold text-slate-800">
                    {post.title}
                  </h4>
                  <p className="text-slate-700 mt-3 whitespace-pre-line leading-7">
                    {post.content}
                  </p>
                </div>

                {post.image_url && (
                  <div className="mt-4 rounded-2xl overflow-hidden border border-slate-200">
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="w-full max-h-[500px] object-cover"
                    />
                  </div>
                )}

                <div className="mt-5 flex items-center justify-between text-sm text-slate-500">
                  <p>{post.likes.length} likes</p>
                  <p>{post.comments.length} comments</p>
                </div>
              </div>

              <div className="border-t border-slate-200 grid grid-cols-3">
                <button
                  onClick={() => handleToggleLike(post)}
                  className={`py-3 text-sm font-medium transition ${
                    post.likedByMe
                      ? "text-blue-600 bg-blue-50"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  👍 {post.likedByMe ? "Liked" : "Like"}
                </button>

                <button
                  onClick={() =>
                    document.getElementById(`comment-input-${post.id}`)?.focus()
                  }
                  className="py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  💬 Comment
                </button>

                <button
                  onClick={() => handleShare(post.id)}
                  className="py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  ↗ Share
                </button>
              </div>

              <div className="p-5 bg-slate-50">
                <div className="flex gap-3">
                  <div className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                    {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
                  </div>

                  <input
                    id={`comment-input-${post.id}`}
                    type="text"
                    placeholder="Write a comment..."
                    value={commentInputs[post.id] || ""}
                    onChange={(e) => handleCommentChange(post.id, e.target.value)}
                    className="flex-1 border border-slate-300 px-4 py-3 rounded-full outline-none focus:border-blue-500 bg-white"
                  />

                  <button
                    onClick={() => handleAddComment(post.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-full font-medium"
                  >
                    Post
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {post.comments.length === 0 ? (
                    <p className="text-sm text-slate-400">No comments yet</p>
                  ) : (
                    post.comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-300 flex items-center justify-center text-sm font-semibold text-slate-700">
                          U
                        </div>

                        <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 flex-1">
                          <p className="text-sm text-slate-700">
                            {comment.comment_text}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(comment.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </AppLayout>
  )
}

export default Feed