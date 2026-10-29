import { use } from 'react';
import SearchScene from '@/features/search/SearchScene';

// ?alan=<hotspot id>: iç mekânda seçilen arama alanı
export default function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locationId: string }>;
  searchParams: Promise<{ alan?: string }>;
}) {
  const { locationId } = use(params);
  const { alan } = use(searchParams);

  return <SearchScene key={`${locationId}-${alan ?? ''}`} locationId={locationId} areaId={alan ?? null} />;
}
