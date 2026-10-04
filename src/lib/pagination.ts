// WP pagination contract: posts_per_page = 10 (Settings › Reading), and the
// theme prints nav.navigation.pagination only when the query returns >1 page.
// The port mirrors that: archives split at PER_PAGE and render the pagination
// nav only when total > 1. Page 1 lives at the archive root, page N at
// <archive>/page/N/ — exactly WP's permalink shape (/all-articles/page/2/).
export const PER_PAGE = 10;

export function paginate<T>(items: T[], perPage: number = PER_PAGE): T[][] {
  if (items.length === 0) return [[]];
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += perPage) pages.push(items.slice(i, i + perPage));
  return pages;
}
