'use client';

import Notebook from '@/components/Notebook/Notebook';

// Not Defteri ev, harita ve diyalog ekranından aynı şekilde açılır
export default function NotebookModal({ onClose }: { onClose: () => void }) {
  return <Notebook onClose={onClose} />;
}
