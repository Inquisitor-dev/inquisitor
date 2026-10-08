'use client';

import { use } from 'react';
import NpcDialogueScreen from '@/components/DialogueScreen/NpcDialogueScreen';

export default function InteractPage({ params }: { params: Promise<{ npcId: string }> }) {
  const { npcId } = use(params);
  return <NpcDialogueScreen npcKey={npcId} />;
}
