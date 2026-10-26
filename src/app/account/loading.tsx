/** Each account segment gets its own boundary so tab-to-tab navigations stay instant (shared-layout Suspense doesn't re-trigger). */
export default function AccountLoading() {
  return <p className="text-ink-soft">Loading…</p>;
}
