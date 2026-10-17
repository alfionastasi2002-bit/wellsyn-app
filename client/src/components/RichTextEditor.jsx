import { Image } from '@tiptap/extension-image';
import { TableKit } from '@tiptap/extension-table';
import { TextAlign } from '@tiptap/extension-text-align';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { AlignCenter, AlignLeft, AlignRight, Bold, ImagePlus, Italic, Link, List, ListOrdered, Redo2, Table, Underline, Undo2, Unlink } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { t } from '../i18n/index.js';
import { Popover } from './DatePicker.jsx';

// Editor di testo formattato (introduzione dei piani alimentari). Il server ripulisce sempre l'HTML salvato.

const MAX_IMAGE_SIDE = 960;

/** Riduce un'immagine scelta dal computer (lato massimo 960 px, JPEG) per non appesantire il piano. */
function imageToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(t('Impossibile leggere l’immagine.')));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error(t('Formato immagine non supportato.')));
      img.onload = () => {
        const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function ToolButton({ icon: Icon, label, active, disabled, onClick, children }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={`grid h-8 min-w-8 place-items-center rounded-md px-1.5 text-ink-700 transition hover:bg-hover disabled:opacity-35 ${active ? 'bg-brand-50 text-brand-800' : ''}`}
    >
      {Icon ? <Icon className="h-4 w-4" strokeWidth={2.2} /> : children}
    </button>
  );
}

const Divider = () => <span aria-hidden="true" className="mx-1 h-5 w-px bg-line" />;

/**
 * Campo di testo con barra degli strumenti (stile, grassetto, elenchi, allineamento, link, immagini, tabelle).
 * value: HTML iniziale (letto solo alla creazione); onChange(html) a ogni modifica ('' se vuoto).
 */
export function RichTextEditor({ value, onChange, placeholder, label }) {
  const fileRef = useRef(null);
  const linkRef = useRef(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [imageError, setImageError] = useState('');
  const ids = useId();
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: 'https', protocols: ['http', 'https', 'mailto'] },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image.configure({ allowBase64: true }),
      TableKit.configure({ table: { resizable: false } }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'rich-text min-h-[140px] px-4 py-3 text-[15px] leading-relaxed text-ink-900 outline-none',
        'aria-label': label ?? t('Testo'),
        'aria-multiline': 'true',
        role: 'textbox',
        ...(placeholder && { 'data-placeholder': placeholder }),
      },
    },
    onUpdate: ({ editor: e }) => onChangeRef.current?.(e.isEmpty ? '' : e.getHTML()),
  });

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e && {
        block: e.isActive('heading', { level: 2 }) ? 'h2' : e.isActive('heading', { level: 3 }) ? 'h3' : 'p',
        bold: e.isActive('bold'),
        italic: e.isActive('italic'),
        underline: e.isActive('underline'),
        bullet: e.isActive('bulletList'),
        ordered: e.isActive('orderedList'),
        align: ['center', 'right'].find((a) => e.isActive({ textAlign: a })) ?? 'left',
        link: e.isActive('link'),
        table: e.isActive('table'),
        canUndo: e.can().undo(),
        canRedo: e.can().redo(),
        empty: e.isEmpty,
        chars: e.state.doc.textContent.length,
      },
  });

  if (!editor || !state) return <div className="min-h-[190px] rounded-xl border border-line bg-surface" />;
  const chain = () => editor.chain().focus();

  function setBlock(v) {
    if (v === 'p') chain().setParagraph().run();
    else chain().setHeading({ level: v === 'h2' ? 2 : 3 }).run();
  }

  function openLink() {
    if (state.link) {
      chain().extendMarkRange('link').unsetLink().run();
      return;
    }
    setLinkUrl(editor.getAttributes('link').href ?? '');
    setLinkOpen(true);
  }

  function applyLink(e) {
    e.preventDefault();
    let url = linkUrl.trim();
    if (url && !/^(https?:|mailto:)/i.test(url)) url = `https://${url}`;
    if (url) chain().extendMarkRange('link').setLink({ href: url }).run();
    setLinkOpen(false);
  }

  async function addImage(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImageError('');
    if (!file.type.startsWith('image/')) return setImageError(t('Scegli un file immagine (JPG, PNG o WebP).'));
    try {
      const src = await imageToDataUrl(file);
      chain().setImage({ src, alt: file.name.replace(/\.[^.]+$/, '') }).run();
    } catch (err) {
      setImageError(err.message);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface transition focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100">
      <div role="toolbar" aria-label={t('Formattazione del testo')} className="flex flex-wrap items-center gap-0.5 border-b border-line bg-soft/60 px-2 py-1.5">
        <label className="sr-only" htmlFor={`${ids}-block`}>
          {t('Stile del testo')}
        </label>
        <select
          id={`${ids}-block`}
          value={state.block}
          onChange={(e) => setBlock(e.target.value)}
          className="mr-1 h-8 rounded-md border border-line bg-surface px-2 text-[13px] text-ink-700 outline-none focus:border-brand-500"
        >
          <option value="p">{t('Paragrafo')}</option>
          <option value="h2">{t('Titolo')}</option>
          <option value="h3">{t('Sottotitolo')}</option>
        </select>
        <ToolButton icon={Bold} label={t('Grassetto')} active={state.bold} onClick={() => chain().toggleBold().run()} />
        <ToolButton icon={Italic} label={t('Corsivo')} active={state.italic} onClick={() => chain().toggleItalic().run()} />
        <ToolButton icon={Underline} label={t('Sottolineato')} active={state.underline} onClick={() => chain().toggleUnderline().run()} />
        <Divider />
        <ToolButton icon={List} label={t('Elenco puntato')} active={state.bullet} onClick={() => chain().toggleBulletList().run()} />
        <ToolButton icon={ListOrdered} label={t('Elenco numerato')} active={state.ordered} onClick={() => chain().toggleOrderedList().run()} />
        <Divider />
        <ToolButton icon={AlignLeft} label={t('Allinea a sinistra')} active={state.align === 'left'} onClick={() => chain().setTextAlign('left').run()} />
        <ToolButton icon={AlignCenter} label={t('Centra')} active={state.align === 'center'} onClick={() => chain().setTextAlign('center').run()} />
        <ToolButton icon={AlignRight} label={t('Allinea a destra')} active={state.align === 'right'} onClick={() => chain().setTextAlign('right').run()} />
        <Divider />
        <span ref={linkRef} className="inline-flex">
          <ToolButton icon={state.link ? Unlink : Link} label={state.link ? t('Rimuovi link') : t('Inserisci link')} active={state.link} onClick={openLink} />
        </span>
        <ToolButton icon={ImagePlus} label={t('Inserisci immagine')} onClick={() => fileRef.current?.click()} />
        <ToolButton
          icon={Table}
          label={t('Inserisci tabella')}
          active={state.table}
          onClick={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          disabled={state.table}
        />
        {state.table && (
          <span className="ml-1 flex items-center gap-0.5 rounded-md bg-surface px-1 text-[12px] font-medium text-ink-700">
            <ToolButton label={t('Aggiungi riga')} onClick={() => chain().addRowAfter().run()}>
              {t('+ riga')}
            </ToolButton>
            <ToolButton label={t('Aggiungi colonna')} onClick={() => chain().addColumnAfter().run()}>
              {t('+ colonna')}
            </ToolButton>
            <ToolButton label={t('Elimina tabella')} onClick={() => chain().deleteTable().run()}>
              <span className="text-danger">{t('Elimina')}</span>
            </ToolButton>
          </span>
        )}
        <span className="ml-auto flex items-center gap-0.5">
          <ToolButton icon={Undo2} label={t('Annulla')} disabled={!state.canUndo} onClick={() => chain().undo().run()} />
          <ToolButton icon={Redo2} label={t('Ripeti')} disabled={!state.canRedo} onClick={() => chain().redo().run()} />
        </span>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={addImage} />
      </div>

      <div className="relative">
        {state.empty && placeholder && <p className="pointer-events-none absolute top-3 left-4 text-[15px] text-ink-300">{placeholder}</p>}
        <EditorContent editor={editor} />
      </div>
      {imageError && <p className="px-4 pb-2 text-sm text-danger">{imageError}</p>}

      <Popover anchorRef={linkRef} open={linkOpen} onClose={() => setLinkOpen(false)} className="w-80 p-3">
        <form onSubmit={applyLink} className="space-y-2">
          <label className="block text-sm font-medium text-ink-700" htmlFor={`${ids}-link`}>
            {t('Indirizzo del link')}
          </label>
          <input
            id={`${ids}-link`}
            autoFocus
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://"
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-soft px-3 py-1.5" onClick={() => setLinkOpen(false)}>
              {t('Annulla')}
            </button>
            <button type="submit" className="btn-primary px-4 py-1.5">
              {t('Applica')}
            </button>
          </div>
        </form>
      </Popover>
      <CharCount n={state.chars} />
    </div>
  );
}

function CharCount({ n }) {
  return <p className="border-t border-line px-4 py-1.5 text-right text-xs text-ink-400">{t('{n} caratteri', { n: n.toLocaleString() })}</p>;
}
