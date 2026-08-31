const stats = [
  { value: "22", label: "Certification Courses" },
  { value: "6", label: "Specialty Categories" },
  { value: "5 Days", label: "Storefront Open Weekly" },
  { value: "24/7", label: "Online Shop Access" },
];

export default function StatsBar() {
  return (
    <section className="bg-ink py-12 text-cream">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <p className="font-display text-3xl text-gold-light sm:text-4xl">{s.value}</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-white/60 sm:text-sm">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
