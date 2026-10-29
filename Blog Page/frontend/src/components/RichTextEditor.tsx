import { type ReactNode, useEffect, useRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { Bold, Code2, Heading1, Heading2, ImagePlus, Italic, Link2, List, ListOrdered, Quote, Strikethrough } from 'lucide-react';

function ToolbarButton({ label, onClick, active = false, icon }: { label: string; onClick: () => void; active?: boolean; icon: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium transition',
        active ? 'bg-slate-950 text-white dark:bg-sand dark:text-ink-950' : 'bg-white/70 text-slate-700 hover:bg-white dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10',
      ].join(' ')}
      title={label}
    >
      {icon}
    </button>
  );
}

export function RichTextEditor({
  content,
  onChange,
  onImageInsert,
}: {
  content: string;
  onChange: (html: string) => void;
  onImageInsert: (url: string) => void;
}) {
  const htmlRef = useRef(content);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: {},
      }),
      Image.configure({ inline: false }),
      Link.configure({ openOnClick: false, autolink: true }),
      Underline,
      Placeholder.configure({ placeholder: 'Write your story... use headings, code blocks, quotes, and images.' }),
    ],
    content,
    onUpdate({ editor: tiptapEditor }) {
      const html = tiptapEditor.getHTML();
      htmlRef.current = html;
      onChange(html);
    },
  });

  useEffect(() => {
    if (editor && content !== htmlRef.current) {
      editor.commands.setContent(content, false);
      htmlRef.current = content;
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const activeEditor = editor;

  function applyLink() {
    const previousUrl = activeEditor.getAttributes('link').href as string;
    const url = window.prompt('Enter a link', previousUrl || 'https://');
    if (url === null) return;
    if (!url) {
      activeEditor.chain().focus().unsetLink().run();
      return;
    }
    activeEditor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }

  function insertImage() {
    const url = window.prompt('Enter image URL');
    if (url) {
      onImageInsert(url);
      activeEditor.chain().focus().setImage({ src: url }).run();
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 rounded-[1.5rem] border border-slate-200 bg-white/70 p-3 dark:border-white/10 dark:bg-slate-950/40">
        <ToolbarButton label="Heading 1" onClick={() => activeEditor.chain().focus().toggleHeading({ level: 1 }).run()} active={activeEditor.isActive('heading', { level: 1 })} icon={<Heading1 className="h-4 w-4" />} />
        <ToolbarButton label="Heading 2" onClick={() => activeEditor.chain().focus().toggleHeading({ level: 2 }).run()} active={activeEditor.isActive('heading', { level: 2 })} icon={<Heading2 className="h-4 w-4" />} />
        <ToolbarButton label="Bold" onClick={() => activeEditor.chain().focus().toggleBold().run()} active={activeEditor.isActive('bold')} icon={<Bold className="h-4 w-4" />} />
        <ToolbarButton label="Italic" onClick={() => activeEditor.chain().focus().toggleItalic().run()} active={activeEditor.isActive('italic')} icon={<Italic className="h-4 w-4" />} />
        <ToolbarButton label="Underline" onClick={() => activeEditor.chain().focus().toggleUnderline().run()} active={activeEditor.isActive('underline')} icon={<Strikethrough className="h-4 w-4" />} />
        <ToolbarButton label="Bullet list" onClick={() => activeEditor.chain().focus().toggleBulletList().run()} active={activeEditor.isActive('bulletList')} icon={<List className="h-4 w-4" />} />
        <ToolbarButton label="Numbered list" onClick={() => activeEditor.chain().focus().toggleOrderedList().run()} active={activeEditor.isActive('orderedList')} icon={<ListOrdered className="h-4 w-4" />} />
        <ToolbarButton label="Blockquote" onClick={() => activeEditor.chain().focus().toggleBlockquote().run()} active={activeEditor.isActive('blockquote')} icon={<Quote className="h-4 w-4" />} />
        <ToolbarButton label="Code block" onClick={() => activeEditor.chain().focus().toggleCodeBlock().run()} active={activeEditor.isActive('codeBlock')} icon={<Code2 className="h-4 w-4" />} />
        <ToolbarButton label="Link" onClick={applyLink} active={activeEditor.isActive('link')} icon={<Link2 className="h-4 w-4" />} />
        <ToolbarButton label="Image" onClick={insertImage} icon={<ImagePlus className="h-4 w-4" />} />
      </div>
      <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white/80 dark:border-white/10 dark:bg-slate-950/40">
        <EditorContent editor={activeEditor} className="prose max-w-none px-5 py-5 prose-slate dark:prose-invert" />
      </div>
    </div>
  );
}