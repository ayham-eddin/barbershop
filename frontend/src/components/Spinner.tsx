type Props = {
  size?: number;        // px
  className?: string;
  'aria-label'?: string;
};

/**
 * Minimal, accessible spinner (no Tailwind color hardcoding).
 * Inherit text color from parent; size via prop.
 */
export default function Spinner({ size = 16, className = '', ...rest }: Props) {
  const s = `${size}px`;
  return (
    <span
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`inline-block align-middle ${className}`}
      {...rest}
    >
      <svg
        width={s}
        height={s}
        viewBox="0 0 24 24"
        className="animate-spin"
        style={{ display: 'block' }}
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          opacity="0.25"
        />
        <path
          d="M22 12a10 10 0 0 1-10 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.9"
        />
      </svg>
      <span className="sr-only">Loading…</span>
    </span>
  );
}


// Usage example:

// {cancelling ? (
//  <span className="inline-flex items-center gap-2">
//    <Spinner aria-label="Cancelling" />
//    Cancelling…
//  </span>
// ) : 'Cancel'}