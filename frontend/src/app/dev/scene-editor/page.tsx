'use client';

import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import { getInterior } from '@/config/interiorConfig';
import styles from './page.module.scss';

// Arama sahnesi işaretleme aracı (yalnızca geliştirmede): görselin üstünde sürükleyerek kutu çizilir,
// nesneye ad verilir; çıktı backend/src/search/scenes/<evren>.ts dosyasına yapıştırılır.

type Box = [number, number, number, number];
type Item = { id: string; label: string; box: Box; final: boolean; prompt: string };
type Draft = { universe: string; locationId: string; areaId: string; image: string; items: Item[] };

const STORAGE_KEY = 'inquisitor-scene-editor-draft';
const EMPTY: Draft = { universe: 'medieval', locationId: 'tavern', areaId: 'barrels', image: '', items: [] };

const round = (n: number) => Math.round(n * 10) / 10;
const clamp = (n: number) => Math.min(100, Math.max(0, n));

// Türkçe adın id'si: "Kalay kupa" → "kalay_kupa"
const slug = (label: string) =>
  label
    .toLocaleLowerCase('tr-TR')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .replace(/â/g, 'a')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

function loadDraft(): Draft {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Draft) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

function toCode(d: Draft): string {
  const q = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  const box = (b: Box) => `[${b.map(round).join(', ')}]`;
  const objects = d.items
    .filter((i) => !i.final)
    .map((i) => `      { id: ${q(i.id)}, label: ${q(i.label)}, box: ${box(i.box)} },`)
    .join('\n');
  const finals = d.items
    .filter((i) => i.final)
    .map((i) => `      {\n        id: ${q(i.id)},\n        box: ${box(i.box)},\n        prompt: ${q(i.prompt)},\n      },`)
    .join('\n');
  return `  {
    universe: ${q(d.universe)},
    locationId: ${q(d.locationId)},
    areaId: ${q(d.areaId)},
    image: ${q(d.image)},
    status: 'DRAFT',
    objects: [
${objects}
    ],
    finalSpots: [
${finals}
    ],
  },`;
}

export default function SceneEditorPage() {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [drag, setDrag] = useState<{ x: number; y: number; box: Box } | null>(null);
  const [copied, setCopied] = useState(false);
  const frameRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- taslak yalnızca tarayıcıda okunabilir
    setDraft(loadDraft());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // Depolama kapalıysa taslak yalnızca bu sekmede kalır
    }
  }, [draft, loaded]);

  if (process.env.NODE_ENV === 'production') {
    return <div className={styles.page}>Bu araç yalnızca geliştirme ortamında açılır.</div>;
  }

  const pointAt = (e: React.PointerEvent) => {
    const rect = frameRef.current!.getBoundingClientRect();
    return {
      x: clamp(((e.clientX - rect.left) / rect.width) * 100),
      y: clamp(((e.clientY - rect.top) / rect.height) * 100),
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!draft.image) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = pointAt(e);
    setDrag({ x: p.x, y: p.y, box: [p.x, p.y, 0, 0] });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag) return;
    const p = pointAt(e);
    setDrag({
      ...drag,
      box: [Math.min(drag.x, p.x), Math.min(drag.y, p.y), Math.abs(p.x - drag.x), Math.abs(p.y - drag.y)],
    });
  };

  const onPointerUp = () => {
    if (!drag) return;
    const [, , w, h] = drag.box;
    setDrag(null);
    // Yanlışlıkla yapılan tıklama kutu sayılmaz
    if (w < 0.5 || h < 0.5) return;
    const n = draft.items.length + 1;
    setDraft({
      ...draft,
      items: [...draft.items, { id: `nesne_${n}`, label: '', box: drag.box.map(round) as Box, final: false, prompt: '' }],
    });
    setSelected(draft.items.length);
  };

  const update = (index: number, patch: Partial<Item>) =>
    setDraft({ ...draft, items: draft.items.map((item, i) => (i === index ? { ...item, ...patch } : item)) });

  const remove = (index: number) => {
    setDraft({ ...draft, items: draft.items.filter((_, i) => i !== index) });
    setSelected(null);
  };

  // Arama alanı iç mekânın NPC olmayan bir tıklama noktasıdır
  const areaOptions = (getInterior(draft.universe, draft.locationId)?.hotspots ?? []).filter((h) => h.category !== 'npc');
  const code = toCode(draft);
  const objectCount = draft.items.filter((i) => !i.final).length;
  const finalCount = draft.items.length - objectCount;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.heading}>Arama sahnesi işaretleme</h1>
        <label className={styles.field}>
          Evren
          <select value={draft.universe} onChange={(e) => setDraft({ ...draft, universe: e.target.value })}>
            {['medieval', 'modern', 'cyberpunk', 'china', 'winter'].map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          Mekân
          <select value={draft.locationId} onChange={(e) => setDraft({ ...draft, locationId: e.target.value })}>
            {['tavern', 'church', 'graveyard', 'mill', 'farm', 'clinic'].map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          Alan
          <select value={draft.areaId} onChange={(e) => setDraft({ ...draft, areaId: e.target.value })}>
            {!areaOptions.some((h) => h.id === draft.areaId) && <option value={draft.areaId}>{draft.areaId || '—'}</option>}
            {areaOptions.map((h) => (
              <option key={h.id} value={h.id}>
                {h.id} · {h.title}
              </option>
            ))}
          </select>
        </label>
        <label className={`${styles.field} ${styles.grow}`}>
          Görsel yolu
          <input
            value={draft.image}
            placeholder="/search-scenes/medieval/tavern/barrels.webp"
            onChange={(e) => setDraft({ ...draft, image: e.target.value.trim() })}
          />
        </label>
        <button type="button" className={styles.button} onClick={() => confirm('Bütün kutular silinsin mi?') && setDraft({ ...draft, items: [] })}>
          Temizle
        </button>
      </header>

      <p className={styles.help}>
        Görselin üstünde sürükleyerek kutu çiz, sağda adını yaz. Asıl yer (gizli bölme) kutularını &ldquo;Asıl yer&rdquo;
        olarak işaretle ve yönlendirmesini yaz. En az 10 nesne ve 1 asıl yer gerekir ({objectCount} nesne,{' '}
        {finalCount} asıl yer).
      </p>

      <div className={styles.workspace}>
        <div className={styles.canvas}>
          {draft.image ? (
            <div
              ref={frameRef}
              className={styles.frame}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            >
              <img src={draft.image} alt="" className={styles.image} draggable={false} />
              {draft.items.map((item, i) => (
                <span
                  key={i}
                  className={`${styles.box} ${item.final ? styles.boxFinal : ''} ${selected === i ? styles.boxSelected : ''}`}
                  style={{ left: `${item.box[0]}%`, top: `${item.box[1]}%`, width: `${item.box[2]}%`, height: `${item.box[3]}%` }}
                >
                  <span className={styles.boxLabel}>{item.label || item.id}</span>
                </span>
              ))}
              {drag && (
                <span
                  className={`${styles.box} ${styles.boxSelected}`}
                  style={{ left: `${drag.box[0]}%`, top: `${drag.box[1]}%`, width: `${drag.box[2]}%`, height: `${drag.box[3]}%` }}
                />
              )}
            </div>
          ) : (
            <p className={styles.help}>Önce public klasöründeki görselin yolunu yaz.</p>
          )}
        </div>

        <aside className={styles.side}>
          <ol className={styles.list}>
            {draft.items.map((item, i) => (
              <li key={i} className={selected === i ? styles.itemSelected : styles.item} onClick={() => setSelected(i)}>
                <input
                  value={item.label}
                  placeholder="Ad (ör. Kalay kupa)"
                  onChange={(e) => update(i, { label: e.target.value, id: slug(e.target.value) || item.id })}
                />
                <label className={styles.check}>
                  <input type="checkbox" checked={item.final} onChange={(e) => update(i, { final: e.target.checked })} />
                  Asıl yer
                </label>
                {item.final && (
                  <input
                    value={item.prompt}
                    placeholder="Yönlendirme (ör. Tahtalardan biri oynamış.)"
                    onChange={(e) => update(i, { prompt: e.target.value })}
                  />
                )}
                <button type="button" className={styles.remove} onClick={() => remove(i)}>
                  Sil
                </button>
              </li>
            ))}
          </ol>
          <div className={styles.output}>
            <button type="button" className={styles.button} onClick={copy}>
              {copied ? 'Kopyalandı' : 'Kodu kopyala'}
            </button>
            <textarea readOnly value={code} rows={12} />
          </div>
        </aside>
      </div>
    </div>
  );
}
