import { NavigationGroup, NavigationItem } from '../../core/navigation/navigation.models';

export interface HeaderSearchResult {
  readonly id: string;
  readonly label: string;
  readonly route: string;
  readonly moduleLabel: string;
  readonly parentLabel: string | null;
}

const MAX_FILTERED_RESULTS = 8;

export function buildHeaderSearchResults(
  groups: readonly NavigationGroup[],
  search: string,
): readonly HeaderSearchResult[] {
  const query = normalizeSearch(search);
  const results: HeaderSearchResult[] = [];
  for (const group of groups) {
    const moduleMatches = query.length > 0 && normalizeSearch(group.label).includes(query);
    for (const item of group.items) {
      collectResults(results, item, group.label, null, query, moduleMatches);
    }
  }
  if (!query) return results;
  return results
    .sort((left, right) => {
      const leftLabel = normalizeSearch(left.label);
      const rightLabel = normalizeSearch(right.label);
      return (
        Number(leftLabel !== query) - Number(rightLabel !== query) ||
        Number(!leftLabel.startsWith(query)) - Number(!rightLabel.startsWith(query)) ||
        left.label.localeCompare(right.label)
      );
    })
    .slice(0, MAX_FILTERED_RESULTS);
}

function collectResults(
  results: HeaderSearchResult[],
  item: NavigationItem,
  moduleLabel: string,
  parentLabel: string | null,
  query: string,
  ancestorMatches: boolean,
): void {
  const itemLabel = normalizeSearch(item.label);
  const matches =
    !query ||
    ancestorMatches ||
    itemLabel.includes(query) ||
    normalizeSearch(parentLabel ?? '').includes(query);
  if (matches && item.route) {
    results.push({ id: item.id, label: item.label, route: item.route, moduleLabel, parentLabel });
  }
  const currentMatches = query.length > 0 && itemLabel.includes(query);
  for (const child of item.children) {
    collectResults(
      results,
      child,
      moduleLabel,
      item.label,
      query,
      ancestorMatches || currentMatches,
    );
  }
}

function normalizeSearch(value: string): string {
  return value.trim().toLocaleLowerCase();
}
