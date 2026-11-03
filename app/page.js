import SupabaseStatus from "./components/supabase-status";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-10 sm:px-10">
      <header className="border-b border-slate-200 pb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">
          Hope Inc.
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          ERP workspace
        </h1>
      </header>

      <section className="grid flex-1 content-center gap-8 py-12 md:grid-cols-[1.2fr_0.8fr] md:items-center">
        <div>
          <p className="text-sm font-medium text-indigo-600">Base application</p>
          <h2 className="mt-3 max-w-xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            A solid foundation for the team&apos;s tools.
          </h2>
          <p className="mt-5 max-w-lg text-lg leading-8 text-slate-600">
            The app is running. This workspace is ready for features built on
            Next.js, Tailwind CSS, and Supabase.
          </p>
        </div>
        <SupabaseStatus />
      </section>

      <footer className="border-t border-slate-200 pt-5 text-sm text-slate-500">
        Hope Inc. ERP
      </footer>
    </main>
  );
}
