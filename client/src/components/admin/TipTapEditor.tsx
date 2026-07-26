import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TiptapLink from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Youtube from '@tiptap/extension-youtube';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import { createLowlight, common } from 'lowlight';
import { useState, useCallback, useRef } from 'react';
import {
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter,
  AlignRight, AlignJustify, List, ListOrdered, Quote, Code, Code2,
  Link2, Image as ImageIcon, Youtube as YoutubeIcon, Table as TableIcon,
  Heading1, Heading2, Heading3, HighlighterIcon, Undo, Redo, Minus,
  Palette, FileCode,
} from 'lucide-react';

const lowlight = createLowlight(common);

interface TipTapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  dir?: 'ltr' | 'rtl';
  minHeight?: number;
}

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, active, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        borderRadius: 4,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: active ? 'rgba(212,160,23,0.15)' : 'transparent',
        color: active ? '#d4a017' : disabled ? '#52525b' : '#a1a1aa',
        transition: 'background 0.15s, color 0.15s',
      }}
      onMouseEnter={(e) => {
        if (!disabled && !active) {
          (e.currentTarget as HTMLButtonElement).style.background = '#27272a';
          (e.currentTarget as HTMLButtonElement).style.color = '#fafafa';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          (e.currentTarget as HTMLButtonElement).style.color = disabled ? '#52525b' : '#a1a1aa';
        }
      }}
    >
      {children}
    </button>
  );
}

function Divider() {
  return (
    <div style={{ width: 1, height: 20, background: '#3f3f46', margin: '0 4px', flexShrink: 0 }} />
  );
}

// Preset text colors
const TEXT_COLORS = [
  '#ffffff', '#f5a623', '#ef4444', '#22c55e', '#3b82f6',
  '#a855f7', '#ec4899', '#14b8a6', '#f97316', '#84cc16',
  '#06b6d4', '#6366f1', '#000000', '#6b7280', '#fbbf24',
];

export default function TipTapEditor({ content, onChange, placeholder = 'Start writing...', dir = 'ltr', minHeight = 320 }: TipTapEditorProps) {
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHtmlInput, setShowHtmlInput] = useState(false);
  const [htmlInput, setHtmlInput] = useState('');
  const colorPickerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Image.configure({ inline: false, allowBase64: true }),
      TiptapLink.configure({ openOnClick: false, autolink: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      CodeBlockLowlight.configure({ lowlight }),
      Youtube.configure({ controls: true, nocookie: true }),
      Placeholder.configure({ placeholder }),
      CharacterCount,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
    ],
    content,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        dir,
        style: `min-height:${minHeight}px; outline:none; padding:16px; color:#fafafa; font-family:Inter,sans-serif; font-size:15px; line-height:1.7;`,
      },
    },
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
    } else {
      editor.chain().focus().unsetLink().run();
    }
    setShowLinkInput(false);
    setLinkUrl('');
  }, [editor, linkUrl]);

  const insertImage = useCallback(() => {
    if (!editor || !imageUrl) return;
    editor.chain().focus().setImage({ src: imageUrl }).run();
    setShowImageInput(false);
    setImageUrl('');
  }, [editor, imageUrl]);

  const insertYoutube = useCallback(() => {
    if (!editor || !youtubeUrl) return;
    editor.chain().focus().setYoutubeVideo({ src: youtubeUrl }).run();
    setShowYoutubeInput(false);
    setYoutubeUrl('');
  }, [editor, youtubeUrl]);

  const insertHtml = useCallback(() => {
    if (!editor || !htmlInput.trim()) return;
    editor.chain().focus().insertContent(htmlInput).run();
    setShowHtmlInput(false);
    setHtmlInput('');
  }, [editor, htmlInput]);

  const setColor = useCallback((color: string) => {
    if (!editor) return;
    if (color === 'reset') {
      editor.chain().focus().unsetColor().run();
    } else {
      editor.chain().focus().setColor(color).run();
    }
    setShowColorPicker(false);
  }, [editor]);

  if (!editor) return null;

  const charCount = editor.storage.characterCount?.characters() ?? 0;
  const wordCount = editor.storage.characterCount?.words() ?? 0;
  const currentColor = editor.getAttributes('textStyle').color || '#ffffff';

  return (
    <div style={{ border: '1px solid #3f3f46', borderRadius: 6, background: '#18181b', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 2, padding: '8px 10px',
        borderBottom: '1px solid #3f3f46', background: '#09090b', alignItems: 'center',
      }}>
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
          <Undo size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
          <Redo size={14} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
          <Heading1 size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
          <Heading2 size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
          <Heading3 size={14} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
          <Bold size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
          <Italic size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
          <Strikethrough size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Highlight">
          <HighlighterIcon size={14} />
        </ToolbarButton>

        {/* Font Color */}
        <div style={{ position: 'relative' }} ref={colorPickerRef}>
          <button
            type="button"
            title="Text Color"
            onClick={() => setShowColorPicker((v) => !v)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: 4,
              border: 'none',
              cursor: 'pointer',
              background: showColorPicker ? 'rgba(212,160,23,0.15)' : 'transparent',
              color: '#a1a1aa',
              gap: 1,
              padding: 0,
            }}
          >
            <Palette size={13} />
            <div style={{ width: 14, height: 3, borderRadius: 1, background: currentColor, border: '1px solid rgba(255,255,255,0.2)' }} />
          </button>
          {showColorPicker && (
            <div style={{
              position: 'absolute', top: 32, left: 0, zIndex: 100,
              background: '#18181b', border: '1px solid #3f3f46', borderRadius: 6,
              padding: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              minWidth: 180,
            }}>
              <p style={{ fontSize: 10, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px', fontWeight: 600 }}>Text Color</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, marginBottom: 8 }}>
                {TEXT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    title={c}
                    onClick={() => setColor(c)}
                    style={{
                      width: 24, height: 24, borderRadius: 4, border: currentColor === c ? '2px solid #d4a017' : '1px solid rgba(255,255,255,0.15)',
                      background: c, cursor: 'pointer', padding: 0,
                    }}
                  />
                ))}
              </div>
              {/* Custom color input */}
              <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 6 }}>
                <input
                  type="color"
                  defaultValue={currentColor || '#ffffff'}
                  onChange={(e) => setColor(e.target.value)}
                  style={{ width: 28, height: 24, border: 'none', padding: 0, background: 'none', cursor: 'pointer', borderRadius: 3 }}
                  title="Custom color"
                />
                <span style={{ fontSize: 11, color: '#a1a1aa' }}>Custom</span>
              </div>
              <button
                type="button"
                onClick={() => setColor('reset')}
                style={{ width: '100%', padding: '4px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 3, color: '#a1a1aa', fontSize: 11, cursor: 'pointer' }}
              >
                Reset Color
              </button>
            </div>
          )}
        </div>

        <Divider />

        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align Left">
          <AlignLeft size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align Center">
          <AlignCenter size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align Right">
          <AlignRight size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justify">
          <AlignJustify size={14} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">
          <List size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered List">
          <ListOrdered size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Quote">
          <Quote size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline Code">
          <Code size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code Block">
          <Code2 size={14} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton onClick={() => setShowLinkInput((v) => !v)} active={editor.isActive('link')} title="Link">
          <Link2 size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => setShowImageInput((v) => !v)} active={false} title="Image URL">
          <ImageIcon size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => setShowYoutubeInput((v) => !v)} active={false} title="YouTube">
          <YoutubeIcon size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          active={editor.isActive('table')}
          title="Insert Table"
        >
          <TableIcon size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} active={false} title="Divider">
          <Minus size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => setShowHtmlInput((v) => !v)} active={showHtmlInput} title="Insert Raw HTML">
          <FileCode size={14} />
        </ToolbarButton>
      </div>

      {/* Inline inputs */}
      {showLinkInput && (
        <div style={{ display: 'flex', gap: 8, padding: '8px 12px', borderBottom: '1px solid #3f3f46', background: '#09090b' }}>
          <input
            type="url"
            placeholder="https://..."
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setLink()}
            autoFocus
            style={{
              flex: 1, background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4,
              color: '#fafafa', padding: '4px 10px', fontSize: 13, outline: 'none',
            }}
          />
          <button type="button" onClick={setLink} style={{ padding: '4px 12px', background: '#d4a017', border: 'none', borderRadius: 4, color: '#09090b', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Apply</button>
          <button type="button" onClick={() => setShowLinkInput(false)} style={{ padding: '4px 10px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#a1a1aa', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
        </div>
      )}
      {showImageInput && (
        <div style={{ display: 'flex', gap: 8, padding: '8px 12px', borderBottom: '1px solid #3f3f46', background: '#09090b' }}>
          <input
            type="url"
            placeholder="Image URL..."
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && insertImage()}
            autoFocus
            style={{ flex: 1, background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#fafafa', padding: '4px 10px', fontSize: 13, outline: 'none' }}
          />
          <button type="button" onClick={insertImage} style={{ padding: '4px 12px', background: '#d4a017', border: 'none', borderRadius: 4, color: '#09090b', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Insert</button>
          <button type="button" onClick={() => setShowImageInput(false)} style={{ padding: '4px 10px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#a1a1aa', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
        </div>
      )}
      {showYoutubeInput && (
        <div style={{ display: 'flex', gap: 8, padding: '8px 12px', borderBottom: '1px solid #3f3f46', background: '#09090b' }}>
          <input
            type="url"
            placeholder="YouTube URL..."
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && insertYoutube()}
            autoFocus
            style={{ flex: 1, background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#fafafa', padding: '4px 10px', fontSize: 13, outline: 'none' }}
          />
          <button type="button" onClick={insertYoutube} style={{ padding: '4px 12px', background: '#d4a017', border: 'none', borderRadius: 4, color: '#09090b', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Embed</button>
          <button type="button" onClick={() => setShowYoutubeInput(false)} style={{ padding: '4px 10px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#a1a1aa', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
        </div>
      )}
      {showHtmlInput && (
        <div style={{ padding: '10px 12px', borderBottom: '1px solid #3f3f46', background: '#09090b' }}>
          <p style={{ fontSize: 11, color: '#52525b', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Insert Raw HTML — paste any HTML code (gallery, tables, embeds…)
          </p>
          <textarea
            placeholder='<div class="my-gallery">...</div>'
            value={htmlInput}
            onChange={(e) => setHtmlInput(e.target.value)}
            rows={5}
            autoFocus
            style={{
              width: '100%', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4,
              color: '#fafafa', padding: '8px 10px', fontSize: 12, outline: 'none',
              resize: 'vertical', fontFamily: 'monospace', boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <button type="button" onClick={insertHtml} style={{ padding: '5px 14px', background: '#d4a017', border: 'none', borderRadius: 4, color: '#09090b', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Insert HTML</button>
            <button type="button" onClick={() => { setShowHtmlInput(false); setHtmlInput(''); }} style={{ padding: '5px 10px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#a1a1aa', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Editor area */}
      <div className="tiptap-admin" onClick={() => setShowColorPicker(false)}>
        <EditorContent editor={editor} />
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, padding: '6px 14px', borderTop: '1px solid #27272a', background: '#09090b' }}>
        <span style={{ fontSize: 12, color: '#52525b' }}>{wordCount} words</span>
        <span style={{ fontSize: 12, color: '#52525b' }}>{charCount} characters</span>
      </div>
    </div>
  );
}
