import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Bookmark, Heart, MessageCircle, Share2, ArrowLeft } from 'lucide-react';

import { api } from '../api/client';
import { CommentThread } from '../components/CommentThread';
import { PostCard } from '../components/PostCard';
import { useAuth } from '../contexts/AuthContext';
import type { Comment, Post, RelatedPost } from '../types';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value));
}

export function PostPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [related, setRelated] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    if (!slug) return;
    const postResponse = await api.get<Post>(`/posts/${slug}`);
    setPost(postResponse.data);
    const [commentsResponse, relatedResponse] = await Promise.all([
      api.get<Comment[]>(`/posts/${postResponse.data.id}/comments`),
      api.get<RelatedPost[]>(`/posts/${postResponse.data.id}/related`),
    ]);
    setComments(commentsResponse.data);
    setRelated(relatedResponse.data);
  }

  useEffect(() => {
    setLoading(true);
    void loadAll().finally(() => setLoading(false));
  }, [slug]);

  const stats = useMemo(
    () => [
      { label: 'Reading time', value: `${post?.reading_time_minutes ?? 0} min` },
      { label: 'Comments', value: post?.comments_count ?? 0 },
      { label: 'Likes', value: post?.likes_count ?? 0 },
    ],
    [post],
  );

  async function toggleLike() {
    if (!post) return;
    if (!user) {
      navigate('/login');
      return;
    }
    const response = await api.post<{ liked: boolean; likes_count: number }>(`/posts/${post.id}/like`);
    setPost({ ...post, is_liked: response.data.liked, likes_count: response.data.likes_count });
  }

  async function toggleBookmark() {
    if (!post) return;
    if (!user) {
      navigate('/login');
      return;
    }
    const response = await api.post<{ bookmarked: boolean; bookmarks_count: number }>(`/posts/${post.id}/bookmark`);
    setPost({ ...post, is_bookmarked: response.data.bookmarked, bookmarks_count: response.data.bookmarks_count });
  }

  async function addComment(content: string, parentId?: string) {
    if (!post) return;
    if (!user) {
      navigate('/login');
      return;
    }
    await api.post(`/posts/${post.id}/comments`, { content, parent_id: parentId ?? null });
    const commentsResponse = await api.get<Comment[]>(`/posts/${post.id}/comments`);
    setComments(commentsResponse.data);
    const refreshed = await api.get<Post>(`/posts/${post.slug}`);
    setPost(refreshed.data);
  }

  if (loading) {
    return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-slate-500 dark:text-slate-400">Loading article...</div>;
  }

  if (!post) {
    return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-slate-500 dark:text-slate-400">Post not found.</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <button type="button" onClick={() => navigate(-1)} className="btn-secondary mb-6 gap-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <article className="overflow-hidden rounded-[2rem] border border-white/40 bg-white/75 shadow-glass backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/55">
        {post.cover_image ? <img src={post.cover_image} alt={post.title} className="max-h-[520px] w-full object-cover" /> : null}
        <div className="grid gap-8 p-6 lg:grid-cols-[1fr_320px] lg:p-8">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              {post.category ? <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-white/5">{post.category}</span> : null}
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-700 dark:text-emerald-300">{post.status}</span>
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{post.title}</h1>
              <p className="max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">{post.summary || post.excerpt}</p>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
              <Link to={`/author/${post.author_username}`} className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-white dark:bg-sand dark:text-ink-950">{post.author_name.slice(0, 1)}</div>
                <div>
                  <div className="font-semibold">{post.author_name}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">@{post.author_username} · {formatDate(post.published_at || post.created_at)}</div>
                </div>
              </Link>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={toggleLike} className={post.is_liked ? 'btn-primary gap-2' : 'btn-secondary gap-2'}>
                  <Heart className="h-4 w-4" /> {post.likes_count}
                </button>
                <button type="button" onClick={toggleBookmark} className={post.is_bookmarked ? 'btn-primary gap-2' : 'btn-secondary gap-2'}>
                  <Bookmark className="h-4 w-4" /> {post.bookmarks_count}
                </button>
                <button type="button" className="btn-secondary gap-2" onClick={() => navigator.clipboard.writeText(window.location.href)}>
                  <Share2 className="h-4 w-4" /> Share
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-[1.25rem] border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{stat.label}</div>
                  <div className="mt-2 text-xl font-semibold">{stat.value}</div>
                </div>
              ))}
            </div>
            <div className="prose max-w-none rounded-[1.75rem] border border-slate-200 bg-white/80 p-6 prose-slate dark:border-white/10 dark:bg-white/5 dark:prose-invert" dangerouslySetInnerHTML={{ __html: post.content_html }} />
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Link key={tag} to={`/search?tag=${encodeURIComponent(tag)}`} className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
          <aside className="space-y-4">
            <div className="glass-panel rounded-[1.5rem] p-5">
              <h3 className="text-lg font-semibold">Related posts</h3>
              <div className="mt-4 space-y-4">
                {related.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                    <Link to={`/posts/${item.slug}`} className="font-medium text-slate-900 dark:text-white">{item.title}</Link>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 line-clamp-3">{item.excerpt}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </article>

      <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="glass-panel rounded-[1.75rem] p-6">
          <h2 className="text-2xl font-semibold">Comments</h2>
          <div className="mt-6">
            <CommentThread comments={comments} onSubmit={(content) => addComment(content)} onReply={(parentId, content) => addComment(content, parentId)} />
          </div>
        </div>
        <div className="glass-panel rounded-[1.75rem] p-6">
          <h3 className="text-lg font-semibold">Reading notes</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <li>Reading time is calculated from article length.</li>
            <li>Likes and bookmarks are synced to the current account.</li>
            <li>Nested replies are stored as parent-child comment chains.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}