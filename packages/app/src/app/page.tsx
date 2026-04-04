import { loadReleaseConsoleData } from '@/lib/release-console/load-console-data';
import { ReleaseConsoleShell } from '@/components/release-console/ReleaseConsoleShell';

type SearchParamValue = string | string[] | undefined;
type SearchParams = Promise<Record<string, SearchParamValue>>;

function getSearchParamValue(value: SearchParamValue) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export const dynamic = 'force-dynamic';

export default async function Page({ searchParams }: { searchParams?: SearchParams }) {
  const resolvedSearchParams = ((await searchParams) ?? {}) as Record<string, SearchParamValue>;
  const requestedAppName = getSearchParamValue(resolvedSearchParams.app);
  const data = await loadReleaseConsoleData(requestedAppName);

  return <ReleaseConsoleShell data={data} />;
}
