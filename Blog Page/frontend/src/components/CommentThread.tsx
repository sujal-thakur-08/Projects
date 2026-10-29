import { useMemo, useState } from 'react';
import { CornerDownRight, Send } from 'lucide-react';

import type { Comment } from '../types';

function CommentItem({ comment, onReply }: { comment: Comment; onReply: (parentId: string, content: string) => Promise<void> }) {
  const [reply, setReply] = useState('');
  const [showReply, setShowReply] = useState(false);

  async function submitReply() {
    if (!reply.trim()) return;
    await onReply(comment.id, reply);
    setReply('');
    setShowReply(false);
  }

  return (
    <div className="space-y-3 rounded-[1.5rem] border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-slate-950 text-sm font-semibold text-white dark:bg-sand dark:text-ink-950">
          {comment.author_name.slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
            <span>{comment.author_name}</span>
            <span className="text-slate-500 dark:text-slate-400">@{comment.author_username}</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">{comment.content}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 pl-12">
        <button type="button" className="text-xs font-semibold text-sky-600 dark:text-sky-300" onClick={() => setShowReply((value) => !value)}>
          Reply
        </button>
      </div>
      {showReply ? (
        <div className="pl-12 space-y-3">
          <textarea value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Write a reply..." className="input-shell min-h-[96px]" />
          <button type="button" onClick={submitReply} className="btn-primary gap-2">
            <Send className="h-4 w-4" /> Reply
          </button>
        </div>
      ) : null}
      {comment.replies.length ? (
        <div className="pl-10 space-y-3 border-l border-slate-200 dark:border-white/10">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} onReply={onReply} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function CommentThread({ comments, onReply, onSubmit }: { comments: Comment[]; onReply: (parentId: string, content: string) => Promise<void>; onSubmit: (content: string) => Promise<void> }) {
  const [comment, setComment] = useState('');
  const sorted = useMemo(() => comments, [comments]);

  async function submitTopLevel() {
    if (!comment.trim()) return;
    await onSubmit(comment);
    setComment('');
  }

  return (
    <section className="space-y-5">
      <div className="space-y-3 rounded-[1.75rem] border border-slate-200 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5">
        <h3 className="text-lg font-semibold">Leave a comment</h3>
        <textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Share a thoughtful response..." className="input-shell min-h-[120px]" />
        <button type="button" onClick={submitTopLevel} className="btn-primary gap-2">
          <Send className="h-4 w-4" /> Post comment
        </button>
      </div>
      <div className="space-y-4">
        {sorted.map((entry) => (
          <CommentItem key={entry.id} comment={entry} onReply={onReply} />
        ))}
      </div>
    </section>
  );
}