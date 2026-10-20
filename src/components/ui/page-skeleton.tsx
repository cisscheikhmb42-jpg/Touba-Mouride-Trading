/** Squelette affiché pendant le premier rendu d'une page. */
export function PageSkeleton() {
  return (
    <div className="container-page py-8 sm:py-12" aria-busy="true">
      <div className="skeleton h-4 w-48 rounded" />
      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-14">
        <div className="skeleton aspect-[4/5] rounded-[1.5rem]" />
        <div className="space-y-4">
          <div className="skeleton h-10 w-3/4 rounded" />
          <div className="skeleton h-6 w-1/3 rounded" />
          <div className="skeleton h-12 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}
