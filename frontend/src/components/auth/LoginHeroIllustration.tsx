export function LoginHeroIllustration() {
  return (
    <div className="relative mx-auto flex h-44 w-full max-w-xs items-end justify-center">
      <div className="absolute inset-x-8 bottom-0 h-24 rounded-t-[2rem] bg-gradient-to-t from-primary/20 to-primary/5" />
      <svg viewBox="0 0 280 160" className="relative h-full w-full" aria-hidden>
        <ellipse cx="140" cy="148" rx="90" ry="10" fill="#E5E7EB" />
        <rect x="108" y="88" width="64" height="44" rx="8" fill="#5D5FEF" opacity="0.15" />
        <rect
          x="118"
          y="96"
          width="44"
          height="28"
          rx="4"
          fill="#fff"
          stroke="#5D5FEF"
          strokeWidth="2"
        />
        <circle cx="95" cy="72" r="22" fill="#FDE68A" />
        <circle cx="185" cy="68" r="24" fill="#BFDBFE" />
        <rect x="72" y="92" width="46" height="52" rx="10" fill="#5D5FEF" />
        <rect x="162" y="90" width="50" height="54" rx="10" fill="#7C3AED" />
      </svg>
    </div>
  );
}
