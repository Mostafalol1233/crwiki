import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export function useAutoSave(key: string, data: unknown, interval = 30000) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      try {
        localStorage.setItem(`autosave-${key}`, JSON.stringify({ data, savedAt: new Date().toISOString() }));
        setLastSaved(new Date());
        toast.info('Draft auto-saved', { duration: 2000 });
      } catch (_) {}
    }, interval);
    return () => clearInterval(timer);
  }, [data, key, interval]);

  const restore = () => {
    try {
      const raw = localStorage.getItem(`autosave-${key}`);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  };

  const clear = () => {
    try { localStorage.removeItem(`autosave-${key}`); } catch (_) {}
  };

  return { lastSaved, restore, clear };
}
