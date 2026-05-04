import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
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
} from "lucide-react";

// ─── Skeleton ──────────────────────────────────────────────────────
function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded-lg ${className}`}
    />
  );
}

// ─── Time Ago ──────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ─── Post Type Config ──────────────────────────────────────────────
const typeConfig = {
  announcement: {
    label: "Announcement",
    class: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    icon: Megaphone,
  },
  event: {
    label: "Event",
    class:
      "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
    icon: Calendar,
  },
  promotion: {
    label: "Promotion",
    class:
      "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    icon: Radio,
  },
  general: {
    label: "General",
    class: "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
    icon: Radio,
  },
};

// ─── Comment Section ───────────────────────────────────────────────
function CommentSection({ post, user, profile }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [post.id]);

  const fetchComments = async () => {
    const { data } = await supabase
      .from("post_comments")
      .select("id, content, created_at, employee_id")
      .eq("post_id", post.id)
      .order("created_at", { ascending: true })
      .limit(20);
    setComments(data || []);
    setLoading(false);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await supabase
        .from("post_comments")
        .insert([
          {
            post_id: post.id,
            employee_id: user.id,
            content: newComment.trim(),
            company_id: profile.company_id,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();
      if (data) setComments((prev) => [...prev, data]);
      setNewComment("");
    } catch (_) {}
    setSubmitting(false);
  };

  return (
    <div className="mt-8 pt-8 border-t-2 border-slate-100 dark:border-slate-700">
      {loading ? (
        <Skeleton className="h-12 w-full rouneded-2xl" />
      ) : (
        <>
          {comments.length > 0 && (
            <div className="space-y-4 mb-6">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl px-6 py-4"
                >
                  <p className="text-sm md:text-base font-bold text-slate-700 dark:text-slate-300">
                    {c.content}
                  </p>
                  <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">
                    {timeAgo(c.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
          <form onSubmit={handleComment} className="flex gap-4">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-6 py-4 text-sm md:text-base bg-slate-100 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-2xl md:rounded-[2rem] text-slate-800 dark:text-slate-200 font-bold placeholder-slate-400 outline-none focus:ring-4 focus:ring-blue-500/20"
            />
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl md:rounded-[2rem] transition disabled:opacity-50 shrink-0"
            >
              <Send className="h-5 w-5 md:h-6 md:w-6" />
            </button>
          </form>
        </>
      )}
    </div>
  );
}

// ─── Post Card ─────────────────────────────────────────────────────
function PostCard({ post, user, profile }) {
  const [liked, setLiked] = useState(post.userLiked || false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  const tConf = typeConfig[post.type] || typeConfig.general;
  const TypeIcon = tConf.icon;

  const toggleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    try {
      if (liked) {
        await supabase
          .from("post_reactions")
          .delete()
          .eq("post_id", post.id)
          .eq("employee_id", user.id);
        setLikeCount((c) => c - 1);
      } else {
        await supabase.from("post_reactions").insert([
          {
            post_id: post.id,
            employee_id: user.id,
            type: "like",
            company_id: profile.company_id,
          },
        ]);
        setLikeCount((c) => c + 1);
      }
      setLiked(!liked);
    } catch (_) {}
    setLikeLoading(false);
  };

  return (
    <div className="border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-3xl md:rounded-[3rem] shadow-sm p-8 md:p-12 hover:shadow-xl transition-shadow group">
      {/* Author row */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-[1.2rem] bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 flex items-center justify-center font-black text-xl shrink-0 group-hover:scale-110 transition-transform">
            {(post.authorName || "A").charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-lg md:text-xl font-black text-slate-800 dark:text-slate-100">
              {post.authorName || "Admin"}
            </p>
            <p className="text-xs md:text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">
              {timeAgo(post.created_at)}
            </p>
          </div>
        </div>
        <span
          className={`text-xs md:text-sm font-black px-4 py-1.5 rounded-full flex items-center gap-2 uppercase tracking-widest ${tConf.class}`}
        >
          <TypeIcon className="h-4 w-4 md:h-5 md:w-5" />
          {tConf.label}
        </span>
      </div>

      {/* Content */}
      {post.title && (
        <h3 className="font-black text-slate-800 dark:text-white text-xl md:text-2xl mb-3">
          {post.title}
        </h3>
      )}
      <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
        {post.content}
      </p>

      {/* Media */}
      {post.media_url && (
        <img
          src={post.media_url}
          alt="Post media"
          className="mt-6 rounded-2xl md:rounded-[2rem] w-full object-cover max-h-96 border-2 border-slate-100 dark:border-slate-700"
        />
      )}

      {/* Actions */}
      <div className="flex items-center gap-6 mt-8 pt-6 border-t-2 border-slate-100 dark:border-slate-700">
        <button
          onClick={toggleLike}
          className={`flex items-center gap-2 text-sm md:text-lg font-black uppercase tracking-widest transition px-4 py-2 rounded-xl ${
            liked
              ? "text-red-500 bg-red-50 dark:bg-red-900/20"
              : "text-slate-500 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-700"
          }`}
        >
          <Heart
            className={`h-5 w-5 md:h-6 md:w-6 ${liked ? "fill-current" : ""}`}
          />
          <span>{likeCount}</span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-sm md:text-lg font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition px-4 py-2 rounded-xl"
        >
          <MessageCircle className="h-5 w-5 md:h-6 md:w-6" />
          <span>Comment</span>
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <CommentSection post={post} user={user} profile={profile} />
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────
function CorporateFeed() {
  const { user, profile } = useAuth();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchFeed = useCallback(async () => {
    if (!user?.id || !profile?.company_id) return;
    setLoading(true);
    setError(null);

    try {
      // Try the announcements table (existing in DB)
      const { data: announcements, error: aErr } = await supabase
        .from("announcements")
        .select("id, title, content, type, created_at, created_by")
        .eq("company_id", profile.company_id)
        .order("created_at", { ascending: false })
        .limit(30);

      if (aErr && aErr.code !== "42P01") throw aErr;

      // Also try posts table (may or may not exist)
      let postsData = [];
      try {
        const { data: pd } = await supabase
          .from("posts")
          .select("id, title, content, type, media_url, created_at, author_id")
          .eq("corporate_id", profile.company_id)
          .order("created_at", { ascending: false })
          .limit(30);
        postsData = pd || [];
      } catch (_) {}

      // Normalize announcements
      const normalizedAnnouncements = (announcements || []).map((a) => ({
        id: `ann-${a.id}`,
        title: a.title,
        content: a.content,
        type: a.type || "announcement",
        created_at: a.created_at,
        authorName: "Admin",
        likeCount: 0,
        userLiked: false,
        media_url: null,
      }));

      // Normalize posts
      const normalizedPosts = postsData.map((p) => ({
        id: `post-${p.id}`,
        title: p.title,
        content: p.content,
        type: p.type || "general",
        created_at: p.created_at,
        authorName: "Team",
        likeCount: 0,
        userLiked: false,
        media_url: p.media_url,
      }));

      // Merge and sort
      const merged = [...normalizedAnnouncements, ...normalizedPosts].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
      );

      setPosts(merged);
    } catch (err) {
      console.error("CorporateFeed error:", err);
      setError("Could not load the company feed.");
    } finally {
      setLoading(false);
    }
  }, [user, profile, refreshKey]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const filteredPosts =
    typeFilter === "all" ? posts : posts.filter((p) => p.type === typeFilter);

  const filterTabs = [
    { value: "all", label: "All Posts" },
    { value: "announcement", label: "Announcements" },
    { value: "event", label: "Events" },
    { value: "promotion", label: "Promotions" },
  ];

  return (
    <div className="space-y-8 md:space-y-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white flex items-center gap-4 tracking-tight">
            <Radio className="h-8 w-8 text-emerald-500" />
            Corporate Feed
          </h1>
          <p className="text-base md:text-xl text-slate-500 dark:text-slate-400 mt-2 font-bold">
            Company news, announcements & updates
          </p>
        </div>
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          className="flex items-center gap-3 text-sm md:text-lg font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 px-6 py-3 md:px-8 md:py-4 rounded-xl md:rounded-full border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          <RefreshCw className="h-5 w-5 md:h-6 md:w-6" />
          Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setTypeFilter(tab.value)}
            className={`shrink-0 px-6 py-3 md:px-8 md:py-4 rounded-2xl text-sm md:text-lg font-black uppercase tracking-widest transition ${
              typeFilter === tab.value
                ? "bg-blue-600 text-white shadow-md border-2 border-blue-600"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      {loading ? (
        <div className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800 rounded-3xl md:rounded-[3rem] p-12 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-700 dark:text-red-400 font-bold text-lg md:text-xl">
            {error}
          </p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-3xl md:rounded-[3rem] shadow-sm flex flex-col items-center justify-center py-24 text-center px-6">
          <Radio className="h-20 w-20 text-slate-300 dark:text-slate-600 mb-6" />
          <h3 className="font-black text-slate-600 dark:text-slate-300 text-2xl">
            Nothing here yet
          </h3>
          <p className="text-slate-400 dark:text-slate-500 text-lg mt-2 font-medium">
            {typeFilter === "all"
              ? "No company posts or announcements yet."
              : `No ${typeFilter} posts found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} user={user} profile={profile} />
          ))}
        </div>
      )}
    </div>
  );
}

export default CorporateFeed;
