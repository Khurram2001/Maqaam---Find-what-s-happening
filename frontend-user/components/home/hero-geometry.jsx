/** Subtle eight-fold star motif — decorative only, low contrast */
export function HeroGeometry() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full text-primary/10"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern
          id="maqaam-star-grid"
          width="120"
          height="120"
          patternUnits="userSpaceOnUse"
          patternTransform="scale(1) rotate(0)"
        >
          <path
            fill="currentColor"
            d="M60 4 L68 28 L92 20 L80 42 L104 52 L80 62 L92 84 L68 76 L60 100 L52 76 L28 84 L40 62 L16 52 L40 42 L28 20 L52 28 Z"
            opacity="0.35"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#maqaam-star-grid)" />
    </svg>
  );
}
