import { useState } from 'react';
import TipTapEditor from './TipTapEditor';

interface BilingualValue {
  en: string;
  ar: string;
}

interface BilingualFieldProps {
  label: string;
  value: BilingualValue;
  onChange: (lang: 'en' | 'ar', val: string) => void;
  type?: 'input' | 'textarea' | 'rich';
  placeholder?: string;
  required?: boolean;
}

export default function BilingualField({ label, value, onChange, type = 'input', placeholder, required }: BilingualFieldProps) {
  const [lang, setLang] = useState<'en' | 'ar'>('en');

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#27272a',
    border: '1px solid #3f3f46',
    borderRadius: 4,
    color: '#fafafa',
    padding: '8px 12px',
    fontSize: 14,
    outline: 'none',
    fontFamily: 'Inter, sans-serif',
    direction: lang === 'ar' ? 'rtl' : 'ltr',
    boxSizing: 'border-box',
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '3px 10px',
    fontSize: 12,
    fontWeight: 500,
    border: '1px solid',
    borderColor: active ? '#d4a017' : '#3f3f46',
    borderRadius: 3,
    background: active ? 'rgba(212,160,23,0.1)' : 'transparent',
    color: active ? '#d4a017' : '#a1a1aa',
    cursor: 'pointer',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: '#a1a1aa' }}>
          {label}{required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
        </label>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button type="button" onClick={() => setLang('en')} style={tabStyle(lang === 'en')}>EN</button>
          <button type="button" onClick={() => setLang('ar')} style={tabStyle(lang === 'ar')}>AR</button>
          <button
            type="button"
            onClick={() => onChange('ar', value.en)}
            style={{ padding: '3px 10px', fontSize: 12, border: '1px solid #3f3f46', borderRadius: 3, background: 'transparent', color: '#52525b', cursor: 'pointer' }}
            title="Copy English content to Arabic"
          >
            EN → AR
          </button>
        </div>
      </div>

      {type === 'input' && (
        <input
          type="text"
          value={lang === 'en' ? value.en : value.ar}
          onChange={(e) => onChange(lang, e.target.value)}
          placeholder={placeholder || `${label} (${lang.toUpperCase()})`}
          style={inputStyle}
          required={required && lang === 'en'}
        />
      )}

      {type === 'textarea' && (
        <textarea
          value={lang === 'en' ? value.en : value.ar}
          onChange={(e) => onChange(lang, e.target.value)}
          placeholder={placeholder || `${label} (${lang.toUpperCase()})`}
          rows={4}
          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
        />
      )}

      {type === 'rich' && (
        <TipTapEditor
          key={lang}
          content={lang === 'en' ? value.en : value.ar}
          onChange={(html) => onChange(lang, html)}
          placeholder={placeholder || `${label} (${lang.toUpperCase()})`}
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
        />
      )}
    </div>
  );
}
