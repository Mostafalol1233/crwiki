import { SEOHead } from "@/components/SEOHead";
import { buildComparisonRows, getRegionBreadcrumbs, getRegionBySlug, getRegionLanding, getWeaponBreadcrumbs, getWeaponBySlug, REGIONS } from "../../../shared/crossfire-regions.js";

interface GlobalWikiProps {
  params?: {
    region?: string;
    slug?: string;
  };
}

export default function GlobalWiki({ params }: GlobalWikiProps) {
  const regionSlug = params?.region?.toLowerCase();
  const weaponSlug = params?.slug?.toLowerCase();

  if (regionSlug && weaponSlug) {
    const region = getRegionBySlug(regionSlug);
    const weapon = getWeaponBySlug(weaponSlug);

    if (!region || !weapon) {
      return (
        <div className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
          <SEOHead title="CrossFire region page unavailable" description="The requested section is not available yet." />
          <div className="mx-auto max-w-3xl rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
            <p className="text-sm uppercase tracking-[0.3em] text-amber-400">Global wiki</p>
            <h1 className="mt-4 text-3xl font-semibold">This region or weapon page is still being prepared.</h1>
            <p className="mt-4 text-slate-300">The new multi-region architecture is live, and this path will be expanded with richer data soon.</p>
          </div>
        </div>
      );
    }

    const regionMeta = weapon.regions ? (weapon.regions as Record<string, { available?: boolean; damage?: number | string; notes?: string }>)[region.slug] : undefined;
    const breadcrumbs = getWeaponBreadcrumbs(regionSlug, weaponSlug);

    return (
      <div className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
        <SEOHead title={`${region.name} ${weapon.name} | CrossFire Global Wiki`} description={`Region-specific coverage for ${weapon.name} in ${region.name}.`} breadcrumbs={breadcrumbs} />
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="rounded-3xl border border-amber-400/30 bg-slate-900/70 p-8">
            <p className="text-sm uppercase tracking-[0.35em] text-amber-400">{region.shortName}</p>
            <h1 className="mt-3 text-4xl font-semibold">{weapon.name}</h1>
            <p className="mt-4 max-w-2xl text-slate-300">{weapon.description}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="text-xl font-semibold">Region facts</h2>
              <ul className="mt-4 space-y-2 text-sm text-slate-300">
                <li><strong>Base:</strong> {region.base}</li>
                <li><strong>Focus:</strong> {region.focus}</li>
                <li><strong>Status:</strong> {region.status}</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="text-xl font-semibold">Local coverage</h2>
              <p className="mt-3 text-sm text-slate-300">{regionMeta?.notes || "Coverage for this region is being expanded in the global wiki."}</p>
              <div className="mt-4 text-sm text-slate-300">
                <strong>Availability:</strong> {regionMeta?.available ? "Verified in this region" : "Pending verification"}
              </div>
              {typeof regionMeta?.damage === "number" ? (
                <div className="mt-2 text-sm text-slate-300"><strong>Damage:</strong> {regionMeta.damage}</div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (regionSlug) {
    const landing = getRegionLanding(regionSlug);

    if (!landing) {
      return (
        <div className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
          <SEOHead title="Region not found" description="The requested CrossFire region is not available in the global wiki yet." />
          <div className="mx-auto max-w-3xl rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
            <h1 className="text-3xl font-semibold">Unknown region</h1>
            <p className="mt-4 text-slate-300">Use one of the core regions to browse the new structure: West, China, Vietnam, Brazil, Philippines, Korea, or Russia.</p>
          </div>
        </div>
      );
    }

    const breadcrumbs = getRegionBreadcrumbs(regionSlug);

    return (
      <div className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
        <SEOHead title={`${landing.region.name} | CrossFire Global Wiki`} description={`Regional overview for ${landing.region.name} in the global CrossFire wiki.`} breadcrumbs={breadcrumbs} />
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="rounded-3xl border border-amber-400/30 bg-slate-900/70 p-8">
            <p className="text-sm uppercase tracking-[0.35em] text-amber-400">Global wiki</p>
            <h1 className="mt-3 text-4xl font-semibold">{landing.region.name}</h1>
            <p className="mt-4 max-w-2xl text-slate-300">{landing.summary}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {landing.featuredWeapons.map((weapon) => (
              <div key={weapon.slug} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                <h2 className="text-xl font-semibold">{weapon.name}</h2>
                <p className="mt-3 text-sm text-slate-300">{weapon.description}</p>
                <a href={`/${landing.region.slug}/weapons/${weapon.slug}`} className="mt-4 inline-flex text-sm font-medium text-amber-400 underline underline-offset-4">
                  View region weapon page →
                </a>
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
            <h2 className="text-xl font-semibold">Regions table</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 pr-4">Region</th>
                    <th className="pb-3 pr-4">Base</th>
                    <th className="pb-3">Focus</th>
                  </tr>
                </thead>
                <tbody>
                  {REGIONS.map((region) => (
                    <tr key={region.slug} className="border-b border-slate-800/70">
                      <td className="py-3 pr-4 font-medium text-slate-100"><a className="text-amber-400 underline underline-offset-4" href={`/${region.slug}`}>{region.name}</a></td>
                      <td className="py-3 pr-4 text-slate-300">{region.base}</td>
                      <td className="py-3 text-slate-300">{region.focus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const compareRows = buildComparisonRows('ak47-beast');

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
      <SEOHead title="CrossFire Global Wiki" description="A global, multi-region CrossFire archive with comparison pages and region-based content structure." />
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-3xl border border-amber-400/30 bg-slate-900/70 p-8">
          <p className="text-sm uppercase tracking-[0.35em] text-amber-400">Global wiki</p>
          <h1 className="mt-3 text-4xl font-semibold">CrossFire Global Wiki</h1>
          <p className="mt-4 max-w-3xl text-slate-300">This launch page introduces the new region-based structure for West, China, Vietnam, Brazil, Philippines, Korea, and Russia so the project can grow from a single-region wiki into a true global archive.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {REGIONS.map((region) => (
            <a key={region.slug} href={`/${region.slug}`} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition hover:border-amber-400/50">
              <div className="text-sm uppercase tracking-[0.25em] text-amber-400">{region.shortName}</div>
              <h2 className="mt-2 text-xl font-semibold">{region.name}</h2>
              <p className="mt-3 text-sm text-slate-300">{region.focus}</p>
            </a>
          ))}
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Expand the archive</h2>
              <p className="mt-2 text-sm text-slate-300">Add new content sections and page templates from the new content hub as the global wiki grows.</p>
            </div>
            <a href="/content-hub" className="rounded-full bg-amber-500 px-4 py-2 text-sm font-medium text-slate-950">
              Open content hub
            </a>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">AK47 Beast comparison</h2>
              <p className="mt-2 text-sm text-slate-300">A simple example of the new comparison pages that make regional differences visible.</p>
            </div>
            <a href="/compare/ak47-beast" className="rounded-full bg-amber-500 px-4 py-2 text-sm font-medium text-slate-950">
              Open comparison
            </a>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 pr-4">Region</th>
                  <th className="pb-3 pr-4">Available</th>
                  <th className="pb-3 pr-4">Damage</th>
                  <th className="pb-3">Notes</th>
                </tr>
              </thead>
              <tbody>
                {compareRows.map((row) => (
                  <tr key={row.region} className="border-b border-slate-800/70">
                    <td className="py-3 pr-4 font-medium text-slate-100">{row.name}</td>
                    <td className="py-3 pr-4">{row.available ? "✅" : "❌"}</td>
                    <td className="py-3 pr-4">{row.damage}</td>
                    <td className="py-3 text-slate-300">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
