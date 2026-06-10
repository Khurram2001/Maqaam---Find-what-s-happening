export function AboutMissionSection() {
  return (
    <section id="about-us" className="scroll-mt-20 bg-[#FAF6F0] pt-6 pb-14 sm:pt-8 sm:pb-16 lg:pt-10 lg:pb-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-12 lg:gap-16">
          <div>
            <span className="mb-2 block text-xs uppercase tracking-widest text-[#0B4D53]/60">
              OUR MISSION
            </span>
            <h2 className="font-heading text-2xl font-semibold leading-snug text-[#0B4D53] sm:text-3xl">
              Bringing Muslim Communities Closer, Wherever They Are.
            </h2>
          </div>

          <div className="md:col-span-2">
            <p className="text-base leading-relaxed text-[#0B4D53]/85 sm:text-[1.05rem]">
              Maqaam is a global, non-profit Islamic event discovery platform built to bridge the
              gap for Muslim communities living in non-Islamic countries. We understand that finding
              local gatherings, Islamic lectures, and spiritual circles in foreign environments can be
              challenging. Maqaam solves this by offering a centralized, secure digital space to
              unite the community.
            </p>
            <p className="mt-6 text-base leading-relaxed text-[#0B4D53]/85 sm:text-[1.05rem]">
              At the heart of Maqaam is our precise map integration, ensuring users can discover and
              pin exact physical event locations seamlessly. To protect the integrity and safety of our
              community spaces, every single gathering goes through a strict admin verification
              process before going live. Organizing requires a secure log-in, while discovering
              remains completely public, seamless, and frictionless—no accounts required for viewers.
            </p>
            <p className="mt-6 text-sm italic text-[#0B4D53]/80">
              100% Free. Completely Non-Profit. Built for the Ummah.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
