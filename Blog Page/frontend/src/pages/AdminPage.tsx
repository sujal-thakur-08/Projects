import { useEffect, useMemo, useState } from 'react';

import { api } from '../api/client';
import type { DashboardStats, Post, User } from '../types';

export function AdminPage() {
  const [stats, setStats] = useState<DashboardStats>({ posts: 0 });
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Array<{ id: string; post_id: string; author_name: string; content: string; reason?: string | null }>>([]);
  const [tab, setTab] = useState<'overview' | 'users' | 'posts' | 'comments'>('overview');

  async function loadAll() {
    const [overviewResponse, usersResponse, postsResponse, commentsResponse] = await Promise.all([
      api.get<DashboardStats>('/admin/overview'),
      api.get<User[]>('/admin/users'),
      api.get<Post[]>('/admin/posts'),
      api.get<Array<{ id: string; post_id: string; author_name: string; content: string; reason?: string | null }>>('/admin/comments/reported'),
    ]);
    setStats(overviewResponse.data);
    setUsers(usersResponse.data);
    setPosts(postsResponse.data);
    setComments(commentsResponse.data);
  }

  useEffect(() => {
    void loadAll();
  }, []);

  const cards = useMemo(
    () => [
      { label: 'Users', value: stats.users ?? users.length },
      { label: 'Posts', value: stats.posts },
      { label: 'Published', value: stats.published_posts ?? posts.filter((post) => post.status === 'published').length },
      { label: 'Reported comments', value: stats.reported_comments ?? comments.length },
    ],
    [comments.length, posts, stats, users.length],
  );

  async function promoteUser(userId: string, role: 'author' | 'admin') {
    await api.patch(`/admin/users/${userId}`, null, { params: { role } });
    await loadAll();
  }

  async function removeComment(commentId: string) {
    await api.delete(`/admin/comments/${commentId}`);
    await loadAll();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="glass-panel rounded-[2rem] p-6">
        <h1 className="text-3xl font-semibold tracking-tight">Admin panel</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">User management, content oversight, and moderation.</p>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        {(['overview', 'users', 'posts', 'comments'] as const).map((item) => (
          <button key={item} type="button" onClick={() => setTab(item)} className={tab === item ? 'btn-primary' : 'btn-secondary'}>
            {item}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <div key={card.label} className="glass-panel rounded-[1.5rem] p-5">
              <div className="text-sm text-slate-500 dark:text-slate-400">{card.label}</div>
              <div className="mt-2 text-3xl font-semibold">{card.value}</div>
            </div>
          ))}
        </div>
      ) : null}

      {tab === 'users' ? (
        <div className="mt-6 space-y-3">
          {users.map((user) => (
            <div key={user.id} className="glass-panel flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] p-5">
              <div>
                <div className="font-semibold">{user.name}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">@{user.username} · {user.email} · {user.role}</div>
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn-secondary" onClick={() => promoteUser(user.id, 'author')}>Author</button>
                <button type="button" className="btn-primary" onClick={() => promoteUser(user.id, 'admin')}>Admin</button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {tab === 'posts' ? (
        <div className="mt-6 space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="glass-panel rounded-[1.5rem] p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="font-semibold">{post.title}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{post.author_name} · {post.status} · {post.likes_count} likes</div>
                </div>
                <a href={`/posts/${post.slug}`} className="text-sm font-medium text-sky-600 dark:text-sky-300">Open</a>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {tab === 'comments' ? (
        <div className="mt-6 space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="glass-panel flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] p-5">
              <div>
                <div className="font-semibold">{comment.author_name}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">{comment.content}</div>
                {comment.reason ? <div className="mt-1 text-xs text-rose-500">Reported: {comment.reason}</div> : null}
              </div>
              <button type="button" className="btn-secondary" onClick={() => removeComment(comment.id)}>Remove</button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}