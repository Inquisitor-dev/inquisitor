import { DoorOpen, Eye, MessageCircle, ScrollText, Search } from 'lucide-react';
import type { InteriorHotspot } from '@/config/interiors/types';

export const isSearchSpot = (hotspot: InteriorHotspot) => hotspot.category === 'clue' && !hotspot.clueSnippet;

// İnceleme noktasının simgesi türüne göre seçilir: her nesneye ayrı emoji yerine tutarlı, oyunun
// diline uyan çizgi simgeler. Nesnenin adı zaten noktanın üstüne gelince yazıyor.
export default function HotspotGlyph({ hotspot, size }: { hotspot: InteriorHotspot; size: number }) {
  const props = { size, strokeWidth: 1.7, 'aria-hidden': true } as const;
  switch (hotspot.category) {
    case 'npc':
      return <MessageCircle {...props} />;
    case 'passage':
      return <DoorOpen {...props} />;
    case 'clue':
      return isSearchSpot(hotspot) ? <Search {...props} /> : <ScrollText {...props} />;
    default:
      return <Eye {...props} />;
  }
}
