import { Bookmark, Clock3, Heart, MessageCircle, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { Post } from '../types';

export function PostCard({ post, compact = false }: { post: Post; compact?: boolean }) {
  return (
    <article className="group overflow-hidden rounded-[1.75rem] border border-white/50 bg-white/75 shadow-glass backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-2xl dark:border-white/10 dark:bg-slate-950/60">
      {post.cover_image ? <img src={post.cover_image} alt={post.title} className="h-52 w-full object-cover" /> : null}
      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          {post.category ? <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-white/5">{post.category}</span> : null}
          <span className="rounded-full bg-sky-500/10 px-3 py-1 text-sky-700 dark:text-sky-300">{post.status}</span>
        </div>
        <div className="space-y-2">
          <Link to={`/posts/${post.slug}`} className="text-xl font-semibold tracking-tight text-slate-950 transition group-hover:text-ember dark:text-white">
            {post.title}
          </Link>
          <p className="line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{post.excerpt || post.summary}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {post.tags.slice(0, compact ? 3 : 5).map((tag) => (
            <span key={tag} className="rounded-full bg-ink-950 px-3 py-1 text-xs font-medium text-white dark:bg-white/10">
              #{tag}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><Clock3 className="h-4 w-4" />{post.reading_time_minutes} min</span>
            <span className="flex items-center gap-1"><Heart className="h-4 w-4" />{post.likes_count}</span>
            <span className="flex items-center gap-1"><MessageCircle className="h-4 w-4" />{post.comments_count}</span>
          </div>
          <Link to={`/posts/${post.slug}`} className="inline-flex items-center gap-1 font-semibold text-slate-900 dark:text-white">
            Read <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
        <Link to={`/author/${post.author_username}`} className="font-medium text-slate-700 hover:text-ember dark:text-slate-200">
          {post.author_name}
        </Link>
        <span className="flex items-center gap-1"><Bookmark className="h-4 w-4" />{post.bookmarks_count}</span>
      </div>
    </article>
  );
}