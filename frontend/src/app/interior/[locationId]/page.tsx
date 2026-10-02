import { use } from 'react';
import InteriorViewer from '@/components/InteriorViewer/InteriorViewer';

export default function InteriorPage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = use(params);

  return <InteriorViewer locationId={locationId} />;
}
