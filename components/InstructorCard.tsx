interface Instructor {
  name: string;
  role: string;
  bio: string;
}

const instructors: Instructor[] = [
  {
    name: "Jen Barnes",
    role: "Sugaring Instructor, Tamara's Sugar Western Canada",
    bio: "Leads our Sugaring Certification Course, covering sugaring theory and history, product protocol, and hands-on practice with ongoing support after class.",
  },
];

export default function InstructorSection() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl text-ink">Learn From Industry Experts</h2>
          <p className="mt-3 text-ink/60">
            Our instructors bring real specialty experience into the training room.
          </p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {instructors.map((i) => (
            <div key={i.name} className="rounded-xl border border-ink/10 p-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold/10 font-display text-xl text-gold-dark">
                {i.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <h3 className="mt-4 font-display text-lg text-ink">{i.name}</h3>
              <p className="text-sm font-medium text-gold-dark">{i.role}</p>
              <p className="mt-2 text-sm text-ink/60">{i.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
