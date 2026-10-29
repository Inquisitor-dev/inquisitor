import { use } from 'react';
import SearchScene from '@/features/search/SearchScene';

export default function SearchPage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = use(params);

  return <SearchScene locationId={locationId} />;
}
