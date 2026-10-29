import { Sparkles, Wand2, Tags } from 'lucide-react';
import { useState } from 'react';

import { api } from '../api/client';
import type { TagResponse } from '../types';

export function AIPanel({
  title,
  contentHtml,
  onApplySummary,
  onApplyTags,
  onApplySuggestion,
}: {
  title: string;
  contentHtml: string;
  onApplySummary: (summary: string) => void;
  onApplyTags: (payload: TagResponse) => void;
  onApplySuggestion: (suggestion: string) => void;
}) {
  const [instruction, setInstruction] = useState('Expand the argument with a practical next step.');
  const [loading, setLoading] = useState<'summary' | 'tags' | 'assist' | null>(null);
  const [error, setError] = useState('');

  async function summarize() {
    setLoading('summary');
    setError('');
    try {
      const response = await api.post<{ summary: string }>('/ai/summarize', { title, content_html: contentHtml });
      onApplySummary(response.data.summary);
    } catch {
      setError('AI summary failed. Check your auth or API key.');
    } finally {
      setLoading(null);
    }
  }

  async function suggestTags() {
    setLoading('tags');
    setError('');
    try {
      const response = await api.post<TagResponse>('/ai/tags', { title, content_html: contentHtml });
      onApplyTags(response.data);
    } catch {
      setError('Tag suggestions failed.');
    } finally {
      setLoading(null);
    }
  }

  async function assistWriting() {
    setLoading('assist');
    setError('');
    try {
      const response = await api.post<{ suggestion: string }>('/ai/assist', { title, content_html: contentHtml, instruction });
      onApplySuggestion(response.data.suggestion);
    } catch {
      setError('Writing assistance failed.');
    } finally {
      setLoading(null);
    }
  }

  return (
    <aside className="glass-panel space-y-4 rounded-[1.75rem] p-5">
      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
        <Sparkles className="h-4 w-4" /> AI Assistant
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300">Generate summaries, continue drafts, and infer tags directly from the article content.</p>
      <label className="space-y-2 text-sm">
        <span className="font-medium">Writing prompt</span>
        <textarea value={instruction} onChange={(event) => setInstruction(event.target.value)} className="input-shell min-h-[96px]" />
      </label>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button type="button" onClick={summarize} className="btn-secondary gap-2" disabled={loading !== null}>
          <Sparkles className="h-4 w-4" /> {loading === 'summary' ? '...' : 'Summarize'}
        </button>
        <button type="button" onClick={assistWriting} className="btn-secondary gap-2" disabled={loading !== null}>
          <Wand2 className="h-4 w-4" /> {loading === 'assist' ? '...' : 'Continue'}
        </button>
        <button type="button" onClick={suggestTags} className="btn-secondary gap-2" disabled={loading !== null}>
          <Tags className="h-4 w-4" /> {loading === 'tags' ? '...' : 'Tags'}
        </button>
      </div>
      {error ? <p className="text-sm text-rose-500">{error}</p> : null}
      <p className="text-xs text-slate-500 dark:text-slate-400">The panel falls back to deterministic suggestions when no AI key is configured.</p>
    </aside>
  );
}