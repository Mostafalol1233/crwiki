import { useState } from 'react';
import { Plus, Trash2, GripVertical, Images } from 'lucide-react';

export interface GalleryItem {
  url: string;
  description?: string;
}

interface GalleryManagerProps {
  value: GalleryItem[];
  onChange: (items: GalleryItem[]) => void;
}

export default function GalleryManager({ value, onChange }: GalleryManagerProps) {
  const [newUrl, setNewUrl] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const add = () => {
    if (!newUrl.trim()) return;
    onChange([...value, { url: newUrl.trim(), description: newDesc.trim() }]);
    setNewUrl('');
    setNewDesc('');
  };

  const remove = (i: number) => {
    onChange(value.filter((_, idx) => idx !== i));
  };

  const update = (i: number, field: 'url' | 'description', val: string) => {
    const next = [...value];
    next[i] = { ...next[i], [field]: val };
    onChange(next);
  };

  const onDragStart = (i: number) => setDragIdx(i);
  const onDragEnter = (i: number) => setDragOver(i);
  const onDragEnd = () => {
    if (dragIdx !== null && dragOver !== null && dragIdx !== dragOver) {
      const next = [...value];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(dragOver, 0, moved);
      onChange(next);
    }
    setDragIdx(null);
    setDragOver(null);
  };

  const inp: React.CSSProperties = {
    background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4,
    color: '#fafafa', padding: '6px 10px', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Images size={13} color="#f5a623" />
        <span style={{ fontSize: 12, fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Gallery Images
        </span>
        <span style={{ fontSize: 11, color: '#52525b', marginLeft: 4 }}>
          ({value.length} image{value.length !== 1 ? 's' : ''}) — click to zoom on public page
        </span>
      </div>

      {/* Existing items */}
      {value.map((item, i) => (
        <div
          key={i}
          draggable
          onDragStart={() => onDragStart(i)}
          onDragEnter={() => onDragEnter(i)}
          onDragEnd={onDragEnd}
          onDragOver={(e) => e.preventDefault()}
          style={{
            display: 'flex', gap: 8, alignItems: 'flex-start',
            padding: '10px', background: '#09090b',
            border: `1px solid ${dragOver === i ? '#f5a623' : '#27272a'}`,
            borderRadius: 6, transition: 'border-color 0.15s',
            opacity: dragIdx === i ? 0.5 : 1,
          }}
        >
          {/* Drag handle + thumbnail */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, paddingTop: 2 }}>
            <GripVertical size={14} color="#3f3f46" style={{ cursor: 'grab' }} />
            {item.url && (
              <img
                src={item.url}
                alt=""
                style={{ width: 44, height: 36, objectFit: 'cover', borderRadius: 3, border: '1px solid #27272a' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
          </div>

          {/* Fields */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input
              type="url"
              placeholder="Image URL (https://...)"
              value={item.url}
              onChange={(e) => update(i, 'url', e.target.value)}
              style={inp}
            />
            <input
              type="text"
              placeholder="Description (shown on zoom, optional)"
              value={item.description || ''}
              onChange={(e) => update(i, 'description', e.target.value)}
              style={{ ...inp, fontSize: 12, color: '#a1a1aa' }}
            />
          </div>

          {/* Remove */}
          <button
            type="button"
            onClick={() => remove(i)}
            style={{
              padding: '6px', background: 'transparent', border: '1px solid #27272a',
              borderRadius: 4, color: '#ef4444', cursor: 'pointer', flexShrink: 0,
            }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      ))}

      {/* Add new row */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 10, background: '#09090b', border: '1px dashed #27272a', borderRadius: 6 }}>
        <input
          type="url"
          placeholder="New image URL (https://...)"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          style={inp}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="Description (optional)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            style={{ ...inp, flex: 1 }}
          />
          <button
            type="button"
            onClick={add}
            disabled={!newUrl.trim()}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 14px', background: newUrl.trim() ? '#d4a017' : '#27272a',
              border: 'none', borderRadius: 4, color: newUrl.trim() ? '#09090b' : '#52525b',
              cursor: newUrl.trim() ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 500, flexShrink: 0,
            }}
          >
            <Plus size={13} /> Add
          </button>
        </div>
      </div>

      {value.length > 1 && (
        <p style={{ fontSize: 11, color: '#52525b', margin: 0 }}>
          💡 Drag rows to reorder. Images appear as a grid on the page; clicking opens a zoom viewer with description.
        </p>
      )}
    </div>
  );
}
