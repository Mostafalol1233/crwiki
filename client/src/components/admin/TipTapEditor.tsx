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
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { createLowlight, common } from 'lowlight';
import { useState, useCallback, useEffect, useRef, type CSSProperties } from 'react';
import { toast } from 'sonner';
import { mergeAttributes } from '@tiptap/core';
import {
  Bold, Italic, Strikethrough, AlignLeft, AlignCenter, AlignRight,
  AlignJustify, List, ListOrdered, Quote, Code, Code2, Link2,
  Image as ImageIcon, Youtube as YoutubeIcon, Table as TableIcon,
  Heading1, Heading2, Heading3, HighlighterIcon, Undo, Redo, Minus,
  Palette, FileCode, Upload, Pencil, Maximize2, Braces, Eye, Columns3, ImagePlus,
} from 'lucide-react';
import { ImageEditorModal } from '@/components/ImageEditorModal';
import { uploadToSupabase } from '@/lib/uploadToSupabase';
import { isAdvancedHtml } from '@/components/AdvancedHtmlRenderer';

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
      aria-label={title}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 30, height: 30, borderRadius: 4, border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: active ? 'rgba(212,160,23,0.18)' : 'transparent',
        color: active ? '#d4a017' : disabled ? '#52525b' : '#a1a1aa',
      }}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div style={{ width: 1, height: 20, background: '#3f3f46', margin: '0 4px', flexShrink: 0 }} />;
}

const TEXT_COLORS = [
  '#ffffff', '#f5a623', '#ef4444', '#22c55e', '#3b82f6',
  '#a855f7', '#ec4899', '#14b8a6', '#f97316', '#84cc16',
  '#06b6d4', '#6366f1', '#000000', '#6b7280', '#fbbf24',
];

/*
 * TipTap's normal Image extension drops width/height when HTML is parsed.
 * These attributes keep the common image sizing controls editable in visual mode.
 * Full layouts, CSS, custom elements, and scripts are kept byte-for-byte in Source
 * mode instead of being forced through TipTap's schema.
 */
const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('width'),
        renderHTML: (attributes: Record<string, string | null>) => attributes.width ? { width: attributes.width } : {},
      },
      height: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('height'),
        renderHTML: (attributes: Record<string, string | null>) => attributes.height ? { height: attributes.height } : {},
      },
      style: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('style'),
        renderHTML: (attributes: Record<string, string | null>) => attributes.style ? { style: attributes.style } : {},
      },
    };
  },
  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },
});

const inputStyle: CSSProperties = {
  background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4,
  color: '#fafafa', padding: '6px 9px', fontSize: 12, outline: 'none',
};

export default function TipTapEditor({
  content,
  onChange,
  placeholder = 'Start writing...',
  dir = 'ltr',
  minHeight = 320,
}: TipTapEditorProps) {
  const [sourceMode, setSourceMode] = useState(false);
  const [sourceHtml, setSourceHtml] = useState(content || '');
  const [sourceNotice, setSourceNotice] = useState('');
  const [showSourcePreview, setShowSourcePreview] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showImageTools, setShowImageTools] = useState(false);
  const [imageEditorOpen, setImageEditorOpen] = useState(false);
  const [editingImageSrc, setEditingImageSrc] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sourceFileInputRef = useRef<HTMLInputElement>(null);
  const lastPropContent = useRef(content || '');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      ResizableImage.configure({ inline: false, allowBase64: true }),
      TiptapLink.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
      Table.configure({ resizable: true }),
      TableRow, TableCell, TableHeader,
      CodeBlockLowlight.configure({ lowlight }),
      Youtube.configure({ controls: true, nocookie: true }),
      Placeholder.configure({ placeholder }),
      CharacterCount,
      TextAlign.configure({ types: ['heading', 'paragraph', 'image'] }),
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
    ],
    content: content || '',
    onUpdate({ editor: nextEditor }) {
      const html = nextEditor.getHTML();
      setSourceHtml(html);
      onChange(html);
    },
    editorProps: {
      attributes: {
        dir,
        spellcheck: 'true',
        style: `min-height:${minHeight}px; outline:none; padding:16px; color:#fafafa; font-family:Inter,sans-serif; font-size:15px; line-height:1.7;`,
      },
    },
  });

  // The managers load a record after the editor has mounted. Keep both modes in sync.
  useEffect(() => {
    if (!editor || sourceMode) return;
    const next = content || '';
    if (next !== lastPropContent.current && next !== editor.getHTML()) {
      editor.commands.setContent(next, { emitUpdate: false });
      setSourceHtml(next);
    }
    lastPropContent.current = next;
  }, [content, editor, sourceMode, sourceHtml]);

  const setSource = useCallback((value: string) => {
    setSourceHtml(value);
    onChange(value);
  }, [onChange]);

  const toggleSourceMode = useCallback(() => {
    if (!editor) return;
    if (!sourceMode) {
      setSourceHtml(content || editor.getHTML());
      setSourceNotice('');
      setSourceMode(true);
      return;
    }

    // Do not call insertContent here. setContent is the only safe way to replace
    // the whole document, and the original source remains available if the schema
    // cannot represent a custom element or full-page layout.
    editor.commands.setContent(sourceHtml || '', { emitUpdate: false });
    lastPropContent.current = sourceHtml || '';
    setSourceMode(false);
    setSourceNotice(
      isAdvancedHtml(sourceHtml)
        ? 'Advanced markup is preserved in Source mode. Visual mode shows the parts supported by the rich editor.'
        : '',
    );
  }, [content, editor, sourceHtml, sourceMode]);


  const importSourceFile = useCallback(async (file: File) => {
    const text = await file.text();
    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith('.css')) {
      setSource(`${sourceHtml}\n<style>\n${text}\n</style>`);
      toast.success('CSS file added to Source mode');
    } else if (lowerName.endsWith('.js')) {
      setSource(`${sourceHtml}\n<script>\n${text}\n</script>`);
      toast.success('JavaScript file added to Source mode');
    } else {
      setSource(text);
      toast.success('HTML file loaded into Source mode');
    }
    setSourceMode(true);
    setShowSourcePreview(true);
    if (sourceFileInputRef.current) sourceFileInputRef.current.value = '';
  }, [setSource, sourceHtml]);

  const insertThreeImageGrid = useCallback(() => {
    const snippet = `\n<section class="crwiki-image-grid" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px;margin:32px 0;">\n  <figure style="margin:0;border:1px solid rgba(212,160,23,.35);border-radius:16px;overflow:hidden;background:#202020;">\n    <img src="https://placehold.co/900x520" alt="Image one" style="width:100%;height:220px;object-fit:cover;display:block;" />\n    <figcaption style="padding:14px;text-align:center;color:#d4a017;font-weight:800;">First image</figcaption>\n  </figure>\n  <figure style="margin:0;border:1px solid rgba(212,160,23,.35);border-radius:16px;overflow:hidden;background:#202020;">\n    <img src="https://placehold.co/900x520" alt="Image two" style="width:100%;height:220px;object-fit:cover;display:block;" />\n    <figcaption style="padding:14px;text-align:center;color:#d4a017;font-weight:800;">Second image</figcaption>\n  </figure>\n  <figure style="margin:0;border:1px solid rgba(212,160,23,.35);border-radius:16px;overflow:hidden;background:#202020;">\n    <img src="https://placehold.co/900x520" alt="Image three" style="width:100%;height:220px;object-fit:cover;display:block;" />\n    <figcaption style="padding:14px;text-align:center;color:#d4a017;font-weight:800;">Third image</figcaption>\n  </figure>\n</section>`;
    setSourceMode(true);
    setSource(`${sourceHtml || editor?.getHTML() || ''}${snippet}`);
    toast.success('3-image row template inserted');
  }, [editor, setSource, sourceHtml]);

  const insertHeroLayout = useCallback(() => {
    const snippet = `<section dir="rtl" style="min-height:720px;background:linear-gradient(rgba(8,8,12,.76),rgba(8,8,12,.9)),url('https://placehold.co/1920x1080') center/cover fixed;color:#f8fafc;padding:80px 24px;font-family:Inter,Tahoma,sans-serif;">\n  <div style="max-width:1180px;margin:0 auto;text-align:center;">\n    <img src="https://placehold.co/220x80" alt="Logo" style="width:170px;border-radius:8px;margin-bottom:38px;" />\n    <h1 style="font-size:clamp(42px,7vw,82px);line-height:1.1;margin:0 0 24px;color:#d4a017;text-shadow:0 6px 20px #000;font-weight:900;">الموسوعة الأسطورية: GOD ZONE</h1>\n    <p style="font-size:26px;margin:0 0 52px;color:#e5e7eb;">الدليل الشامل لتفعيل لعب الآلهة</p>\n    <div style="background:#151515;border:1px solid rgba(255,255,255,.12);border-radius:26px;padding:48px;box-shadow:0 22px 60px rgba(0,0,0,.45);">\n      <h2 style="color:#d4a017;font-size:38px;margin:0 0 28px;border-bottom:2px solid #d4a017;padding-bottom:18px;">1. حكاية السحاب وأرض الأساطير 🏯</h2>\n      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:34px;align-items:center;">\n        <img src="https://placehold.co/900x520" alt="Map" style="width:100%;border:2px solid #d4a017;border-radius:18px;" />\n        <p style="font-size:20px;line-height:2;text-align:right;">اكتب المحتوى هنا. يمكنك تغيير الخلفية، الحدود، حجم الصور، وإضافة أي CSS أو JavaScript في Source mode.</p>\n      </div>\n    </div>\n  </div>\n</section>`;
    setSourceMode(true);
    setSource(snippet);
    setShowSourcePreview(true);
    toast.success('Full-page hero template inserted');
  }, [setSource]);

  const setLink = useCallback(() => {
    if (!editor) return;
    if (linkUrl.trim()) editor.chain().focus().setLink({ href: linkUrl.trim() }).run();
    else editor.chain().focus().unsetLink().run();
    setShowLinkInput(false);
    setLinkUrl('');
  }, [editor, linkUrl]);

  const insertImage = useCallback(() => {
    if (!editor || !imageUrl.trim()) return;
    editor.chain().focus().setImage({ src: imageUrl.trim() }).run();
    setShowImageInput(false);
    setImageUrl('');
  }, [editor, imageUrl]);

  const insertYoutube = useCallback(() => {
    if (!editor || !youtubeUrl.trim()) return;
    editor.chain().focus().setYoutubeVideo({ src: youtubeUrl.trim() }).run();
    setShowYoutubeInput(false);
    setYoutubeUrl('');
  }, [editor, youtubeUrl]);

  const setColor = useCallback((color: string) => {
    if (!editor) return;
    if (color === 'reset') editor.chain().focus().unsetColor().run();
    else editor.chain().focus().setColor(color).run();
    setShowColorPicker(false);
  }, [editor]);

  const uploadImage = useCallback(async (file: File) => {
    if (!editor) return;
    try {
      const url = await uploadToSupabase(file, 'editor');
      editor.chain().focus().setImage({ src: url, alt: file.name }).run();
      toast.success('Image uploaded');
    } catch (error: any) {
      toast.error(error?.message || 'Image upload failed');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [editor]);

  const selectedImage = editor?.isActive('image') ? editor.getAttributes('image') : null;
  const updateImageSize = (key: 'width' | 'height', value: string) => {
    if (!editor || !selectedImage) return;
    editor.chain().focus().updateAttributes('image', { [key]: value || null }).run();
  };

  const openImageEditor = () => {
    if (!editor || !selectedImage?.src) return;
    setEditingImageSrc(selectedImage.src);
    setImageEditorOpen(true);
  };

  const saveEditedImage = (newSrc: string) => {
    editor?.chain().focus().updateAttributes('image', { src: newSrc }).run();
  };

  if (!editor) return null;

  const charCount = editor.storage.characterCount?.characters() ?? 0;
  const wordCount = editor.storage.characterCount?.words() ?? 0;
  const currentColor = editor.getAttributes('textStyle').color || '#ffffff';
  const visualNotice = sourceNotice || 'Use Source mode to import or edit complete HTML/CSS layouts without losing spacing, classes, colors, embeds, or image dimensions.';

  return (
    <div style={{ border: '1px solid #3f3f46', borderRadius: 6, background: '#18181b', overflow: 'hidden' }}>
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 2, padding: '8px 10px',
        borderBottom: '1px solid #3f3f46', background: '#09090b', alignItems: 'center',
      }}>
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo"><Undo size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo"><Redo size={14} /></ToolbarButton>
        <Divider />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1"><Heading1 size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2"><Heading2 size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3"><Heading3 size={14} /></ToolbarButton>
        <Divider />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><Bold size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><Italic size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough"><Strikethrough size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Highlight"><HighlighterIcon size={14} /></ToolbarButton>
        <div style={{ position: 'relative' }}>
          <ToolbarButton onClick={() => setShowColorPicker((value) => !value)} active={showColorPicker} title="Text Color"><Palette size={13} /></ToolbarButton>
          {showColorPicker && (
            <div style={{ position: 'absolute', top: 34, left: 0, zIndex: 100, background: '#18181b', border: '1px solid #3f3f46', borderRadius: 6, padding: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.5)', minWidth: 180 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, marginBottom: 8 }}>
                {TEXT_COLORS.map((color) => <button key={color} type="button" title={color} onClick={() => setColor(color)} style={{ width: 24, height: 24, borderRadius: 4, border: currentColor === color ? '2px solid #d4a017' : '1px solid rgba(255,255,255,0.15)', background: color, cursor: 'pointer' }} />)}
              </div>
              <input type="color" value={currentColor} onChange={(event) => setColor(event.target.value)} style={{ width: '100%', height: 26, cursor: 'pointer' }} />
              <button type="button" onClick={() => setColor('reset')} style={{ width: '100%', marginTop: 6, padding: 4, background: '#27272a', border: '1px solid #3f3f46', borderRadius: 3, color: '#a1a1aa', fontSize: 11 }}>Reset color</button>
            </div>
          )}
        </div>
        <Divider />
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align Left"><AlignLeft size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align Center"><AlignCenter size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align Right"><AlignRight size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justify"><AlignJustify size={14} /></ToolbarButton>
        <Divider />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List"><List size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered List"><ListOrdered size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Quote"><Quote size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline Code"><Code size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code Block"><Code2 size={14} /></ToolbarButton>
        <Divider />
        <ToolbarButton onClick={() => setShowLinkInput((value) => !value)} active={editor.isActive('link')} title="Link"><Link2 size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => setShowImageInput((value) => !value)} title="Insert Image URL"><ImageIcon size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => fileInputRef.current?.click()} title="Upload Image"><Upload size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => setShowYoutubeInput((value) => !value)} title="YouTube Embed"><YoutubeIcon size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} active={editor.isActive('table')} title="Insert Table"><TableIcon size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule"><Minus size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => setShowImageTools((value) => !value)} active={showImageTools || !!selectedImage} disabled={!selectedImage} title="Image Size & Edit"><Maximize2 size={14} /></ToolbarButton>
        <Divider />
        <ToolbarButton onClick={insertHeroLayout} title="Insert full-page hero layout"><ImagePlus size={14} /></ToolbarButton>
        <ToolbarButton onClick={insertThreeImageGrid} title="Insert 3 images in one row"><Columns3 size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => sourceFileInputRef.current?.click()} title="Upload HTML, CSS, or JavaScript file"><FileCode size={14} /></ToolbarButton>
        <button type="button" onClick={toggleSourceMode} title={sourceMode ? 'Return to visual editor' : 'Edit complete HTML source'} style={{ display: 'flex', alignItems: 'center', gap: 5, height: 30, padding: '0 9px', borderRadius: 4, border: `1px solid ${sourceMode ? '#d4a017' : '#3f3f46'}`, background: sourceMode ? 'rgba(212,160,23,0.15)' : '#18181b', color: sourceMode ? '#d4a017' : '#a1a1aa', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
          {sourceMode ? <Eye size={13} /> : <Braces size={13} />} {sourceMode ? 'Visual' : 'HTML Source'}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) uploadImage(file); }} />
        <input ref={sourceFileInputRef} type="file" accept=".html,.htm,.css,.js,text/html,text/css,text/javascript,application/javascript" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void importSourceFile(file); }} />
      </div>

      {showLinkInput && !sourceMode && (
        <div style={{ display: 'flex', gap: 8, padding: '8px 12px', borderBottom: '1px solid #3f3f46', background: '#09090b' }}>
          <input type="url" placeholder="https://..." value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && setLink()} autoFocus style={{ ...inputStyle, flex: 1 }} />
          <button type="button" onClick={setLink} style={{ padding: '4px 12px', background: '#d4a017', border: 'none', borderRadius: 4, color: '#09090b', fontSize: 12, fontWeight: 600 }}>Apply</button>
        </div>
      )}
      {showImageInput && !sourceMode && (
        <div style={{ display: 'flex', gap: 8, padding: '8px 12px', borderBottom: '1px solid #3f3f46', background: '#09090b' }}>
          <input type="url" placeholder="Image URL..." value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && insertImage()} autoFocus style={{ ...inputStyle, flex: 1 }} />
          <button type="button" onClick={insertImage} style={{ padding: '4px 12px', background: '#d4a017', border: 'none', borderRadius: 4, color: '#09090b', fontSize: 12, fontWeight: 600 }}>Insert</button>
        </div>
      )}
      {showYoutubeInput && !sourceMode && (
        <div style={{ display: 'flex', gap: 8, padding: '8px 12px', borderBottom: '1px solid #3f3f46', background: '#09090b' }}>
          <input type="url" placeholder="YouTube URL..." value={youtubeUrl} onChange={(event) => setYoutubeUrl(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && insertYoutube()} autoFocus style={{ ...inputStyle, flex: 1 }} />
          <button type="button" onClick={insertYoutube} style={{ padding: '4px 12px', background: '#d4a017', border: 'none', borderRadius: 4, color: '#09090b', fontSize: 12, fontWeight: 600 }}>Embed</button>
        </div>
      )}
      {showImageTools && selectedImage && !sourceMode && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid #3f3f46', background: '#111113' }}>
          <span style={{ color: '#a1a1aa', fontSize: 11, fontWeight: 600 }}>Selected image</span>
          <label style={{ color: '#71717a', fontSize: 11 }}>Width <input value={selectedImage.width || ''} onChange={(event) => updateImageSize('width', event.target.value)} placeholder="auto" style={{ ...inputStyle, width: 74, marginLeft: 4 }} /></label>
          <label style={{ color: '#71717a', fontSize: 11 }}>Height <input value={selectedImage.height || ''} onChange={(event) => updateImageSize('height', event.target.value)} placeholder="auto" style={{ ...inputStyle, width: 74, marginLeft: 4 }} /></label>
          <button type="button" onClick={openImageEditor} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 9px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#d4a017', fontSize: 11 }}><Pencil size={12} /> Crop / resize / filters</button>
          <button type="button" onClick={() => editor.chain().focus().updateAttributes('image', { width: null, height: null }).run()} style={{ padding: '6px 9px', background: 'transparent', border: '1px solid #3f3f46', borderRadius: 4, color: '#a1a1aa', fontSize: 11 }}>Reset size</button>
        </div>
      )}

      {sourceMode ? (
        <div style={{ background: '#09090b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderBottom: '1px solid #27272a', color: '#a1a1aa', fontSize: 11 }}>
            <FileCode size={13} color="#d4a017" />
            <span style={{ flex: 1 }}>Complete HTML source — HTML, CSS, embeds, custom attributes, and code are preserved.</span>
            <button type="button" onClick={() => setShowSourcePreview((value) => !value)} style={{ padding: '4px 8px', background: showSourcePreview ? '#d4a017' : '#27272a', color: showSourcePreview ? '#09090b' : '#a1a1aa', border: '1px solid #3f3f46', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{showSourcePreview ? 'Hide preview' : 'Live preview'}</button>
          </div>
          {showSourcePreview && (
            <iframe title="Source preview" srcDoc={sourceHtml} sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms" style={{ width: '100%', minHeight: 420, border: 0, borderBottom: '1px solid #27272a', background: '#111' }} />
          )}
          <textarea
            value={sourceHtml}
            onChange={(event) => setSource(event.target.value)}
            spellCheck={false}
            aria-label="Complete HTML source"
            style={{ display: 'block', width: '100%', minHeight, boxSizing: 'border-box', resize: 'vertical', padding: 16, border: 0, outline: 0, background: '#09090b', color: '#e4e4e7', fontFamily: '"Fira Code", "SFMono-Regular", Consolas, monospace', fontSize: 13, lineHeight: 1.65, tabSize: 2 }}
            placeholder={'<section class="layout">\n  <h2>Paste complete HTML here</h2>\n</section>'}
          />
        </div>
      ) : (
        <div className="tiptap-admin" onClick={() => setShowColorPicker(false)}>
          <EditorContent editor={editor} />
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '6px 14px', borderTop: '1px solid #27272a', background: '#09090b' }}>
        <span style={{ color: '#52525b', fontSize: 11 }}>{sourceMode ? 'Source mode: nothing is normalized or stripped' : visualNotice}</span>
        {!sourceMode && <span style={{ display: 'flex', gap: 16, color: '#52525b', fontSize: 12, whiteSpace: 'nowrap' }}>{wordCount} words · {charCount} characters</span>}
      </div>

      <ImageEditorModal
        isOpen={imageEditorOpen}
        onClose={() => setImageEditorOpen(false)}
        imageSrc={editingImageSrc}
        onSave={saveEditedImage}
        toast={(value: any) => value?.variant === 'destructive' ? toast.error(value.description || value.title) : toast.success(value.title || 'Image saved')}
      />
    </div>
  );
}