import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload } from 'lucide-react';

import { api } from '../api/client';
import { AIPanel } from '../components/AIPanel';
import { RichTextEditor } from '../components/RichTextEditor';
import { SidebarNav } from '../components/SidebarNav';
import { useAuth } from '../contexts/AuthContext';
import type { Post, PostEditorPayload, TagResponse } from '../types';

export function EditorPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { savePost } = useAuth();
  const [title, setTitle] = useState('');
  const [contentHtml, setContentHtml] = useState('<p>Start writing here...</p>');
  const [excerpt, setExcerpt] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [category, setCategory] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [summary, setSummary] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(Boolean(postId));
  const [error, setError] = useState('');
  const [assistantOutput, setAssistantOutput] = useState('');

  useEffect(() => {
    async function loadPost() {
      if (!postId) {
        setLoading(false);
        return;
      }
      try {
        const response = await api.get<Post>(`/posts/id/${postId}`);
        const post = response.data;
        setTitle(post.title);
        setContentHtml(post.content_html);
        setExcerpt(post.excerpt || '');
        setTagsText(post.tags.join(', '));
        setCategory(post.category || '');
        setCoverImage(post.cover_image || '');
        setStatus(post.status);
        setSummary(post.summary || '');
      } finally {
        setLoading(false);
      }
    }
    void loadPost();
  }, [postId]);

  const payload: PostEditorPayload = useMemo(
    () => ({
      title,
      content_html: contentHtml,
      excerpt,
      tags: tagsText.split(',').map((tag) => tag.trim()).filter(Boolean),
      category: category || undefined,
      cover_image: coverImage || undefined,
      status,
      ai_summary: summary || undefined,
    }),
    [title, contentHtml, excerpt, tagsText, category, coverImage, status, summary],
  );

  async function handleFileUpload(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{ url: string }>('/uploads', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    setCoverImage(response.data.url);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const post = await savePost(payload, postId);
      navigate(`/posts/${post.slug}`, { replace: true });
    } catch {
      setError('Unable to save post. Check your connection and validation fields.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[280px_1fr_360px]">
        <SidebarNav />
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="glass-panel rounded-[1.75rem] p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Post editor</div>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">{postId ? 'Edit post' : 'Create a new post'}</h1>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setStatus('draft')} className={status === 'draft' ? 'btn-primary' : 'btn-secondary'}>
                  Draft
                </button>
                <button type="button" onClick={() => setStatus('published')} className={status === 'published' ? 'btn-primary' : 'btn-secondary'}>
                  Publish
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-[1.75rem] border border-slate-200 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5">
            <label className="block space-y-2 text-sm font-medium">
              <span>Title</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} className="input-shell text-2xl font-semibold" placeholder="Write a compelling headline" />
            </label>
            <label className="block space-y-2 text-sm font-medium">
              <span>Excerpt</span>
              <textarea value={excerpt} onChange={(event) => setExcerpt(event.target.value)} className="input-shell min-h-[100px]" placeholder="A short preview for cards and previews" />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2 text-sm font-medium">
                <span>Tags</span>
                <input value={tagsText} onChange={(event) => setTagsText(event.target.value)} className="input-shell" placeholder="ai, design, product" />
              </label>
              <label className="block space-y-2 text-sm font-medium">
                <span>Category</span>
                <input value={category} onChange={(event) => setCategory(event.target.value)} className="input-shell" placeholder="Engineering" />
              </label>
            </div>
            <label className="block space-y-2 text-sm font-medium">
              <span>Cover image URL</span>
              <div className="flex gap-3">
                <input value={coverImage} onChange={(event) => setCoverImage(event.target.value)} className="input-shell flex-1" placeholder="https://..." />
                <label className="btn-secondary cursor-pointer gap-2">
                  <Upload className="h-4 w-4" /> Upload
                  <input type="file" accept="image/*" className="hidden" onChange={(event) => event.target.files?.[0] && void handleFileUpload(event.target.files[0])} />
                </label>
              </div>
            </label>
            {coverImage ? <img src={coverImage} alt="Cover preview" className="max-h-72 w-full rounded-3xl object-cover" /> : null}
          </div>

          <div className="space-y-4">
            {loading ? <div className="text-sm text-slate-500 dark:text-slate-400">Loading post...</div> : null}
            <RichTextEditor content={contentHtml} onChange={setContentHtml} onImageInsert={(url) => setAssistantOutput(`Inserted image: ${url}`)} />
          </div>

          {summary ? (
            <div className="rounded-[1.5rem] border border-sky-200 bg-sky-500/10 p-5 text-slate-900 dark:border-sky-500/20 dark:text-slate-100">
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700 dark:text-sky-300">AI summary</div>
              <p className="mt-3 leading-7">{summary}</p>
            </div>
          ) : null}

          {assistantOutput ? (
            <div className="rounded-[1.5rem] border border-amber-200 bg-amber-500/10 p-5 text-slate-900 dark:border-amber-500/20 dark:text-slate-100">
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">Assistant output</div>
              <p className="mt-3 leading-7 whitespace-pre-line">{assistantOutput}</p>
            </div>
          ) : null}

          {error ? <p className="text-sm text-rose-500">{error}</p> : null}
          <div className="flex flex-wrap gap-3">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : postId ? 'Update post' : 'Create post'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => navigate('/dashboard')}>
              Back to dashboard
            </button>
          </div>
        </form>

        <AIPanel
          title={title}
          contentHtml={contentHtml}
          onApplySummary={(nextSummary) => setSummary(nextSummary)}
          onApplyTags={(response: TagResponse) => {
            setTagsText(response.tags.join(', '));
            setCategory(response.category);
          }}
          onApplySuggestion={(suggestion) => {
            setAssistantOutput(suggestion);
            setContentHtml((current) => `${current}<p>${suggestion}</p>`);
          }}
        />
      </div>
    </div>
  );
}