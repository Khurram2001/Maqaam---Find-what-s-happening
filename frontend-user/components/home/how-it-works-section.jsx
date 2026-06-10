import { CalendarCheck2, MapPinned, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";

export function HowItWorksSection() {
  const steps = [
    {
      number: "1",
      title: "Create & Pin",
      description:
        "Log in securely to add event details, upload flyers, and precisely mark the venue location on our interactive map.",
      Icon: MapPinned,
      enterDelay: "motion-safe:animate-[fadeIn_0.5s_ease-out_0.2s_forwards]",
    },
    {
      number: "2",
      title: "Admin Review",
      description:
        "Our moderation team carefully reviews the submitted gathering details to ensure strict trust, safety, and community alignment.",
      Icon: ShieldCheck,
      enterDelay: "motion-safe:animate-[fadeIn_0.5s_ease-out_0.4s_forwards]",
    },
    {
      number: "3",
      title: "Live & Discoverable",
      description:
        "Once approved, the event instantly goes live on the public map—accessible to everyone globally without needing a login.",
      Icon: CalendarCheck2,
      enterDelay: "motion-safe:animate-[fadeIn_0.5s_ease-out_0.6s_forwards]",
    },
  ];

  return (
    <section id="how-it-works" className="scroll-mt-20 bg-[#FAF6F0] pt-12 pb-8 sm:pt-16 sm:pb-10 lg:pt-20 lg:pb-12">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-8 max-w-2xl text-center sm:mb-12 md:mb-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0B4D53]/70">
            Our Listing Process
          </p>
          <h2 className="mt-2 font-heading text-xl font-semibold tracking-tight text-[#0B4D53] sm:text-2xl md:text-3xl">
            How a Gathering Goes Live
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#0B4D53]/70 sm:text-base">
            A safe, structured flow ensuring accurate discovery for the community.
          </p>
        </div>

        <div className="relative">
          <div className="absolute left-[16.66%] right-[16.66%] top-7 hidden h-px border-t border-dashed border-[#0B4D53]/20 md:block" />
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-10">
            {steps.map((step) => {
              const Icon = step.Icon;
              return (
                <article
                  key={step.number}
                  className={cn("text-center motion-safe:opacity-0", step.enterDelay)}
                >
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#0B4D53] text-xl font-semibold text-[#F4F6F6] shadow-[0_8px_24px_rgba(11,77,83,0.22)] motion-safe:transform-gpu motion-safe:transition-transform motion-safe:duration-300 motion-safe:hover:scale-110">
                    {step.number}
                  </div>
                  <div className="mt-6 flex justify-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-[#0B4D53] ring-1 ring-[#D4E6F1]">
                      <Icon className="size-5" aria-hidden />
                    </span>
                  </div>
                  <h3 className="mt-4 font-heading text-lg font-semibold text-[#0B4D53] sm:text-xl md:text-2xl">
                    {step.title}
                  </h3>
                  <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-[#0B4D53]/75">
                    {step.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>

        <p className="mt-10 text-center text-xs font-medium uppercase tracking-[0.18em] text-[#0B4D53]/65 sm:mt-12">
          Precision location mapping powered by OpenStreetMap
        </p>
      </div>
    </section>
  );
}
