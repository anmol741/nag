type IconProps = { className?: string };

export function PhoneIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 5.5C3 4.67 3.67 4 4.5 4h2.6c.5 0 .93.33 1.07.81l1.1 3.66a1.1 1.1 0 01-.3 1.13l-1.6 1.5a13.3 13.3 0 006.03 6.03l1.5-1.6a1.1 1.1 0 011.13-.3l3.66 1.1c.48.14.81.57.81 1.07v2.6c0 .83-.67 1.5-1.5 1.5h-1C9.6 21.5 2.5 14.4 2.5 5.5v-1z"
      />
    </svg>
  );
}

export function InstagramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function MenuIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}>
      <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}>
      <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function BagIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 8h12l-1 12H7L6 8z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 8V6a3 3 0 016 0v2" />
    </svg>
  );
}

export function HeartIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 20s-7-4.35-9.5-8.5C.75 8 2.4 5 5.6 5c1.9 0 3.3 1 4.4 2.4C11.1 6 12.5 5 14.4 5c3.2 0 4.85 3 3.1 6.5C15 15.65 12 20 12 20z"
      />
    </svg>
  );
}

export function UserIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}>
      <circle cx="12" cy="8" r="3.5" />
      <path strokeLinecap="round" d="M4.5 20c1.3-3.5 4.2-5.5 7.5-5.5s6.2 2 7.5 5.5" />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function MapPinIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21s7-6.5 7-11.5A7 7 0 105 9.5C5 14.5 12 21 12 21z"
      />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path strokeLinecap="round" d="M20 20l-4.8-4.8" />
    </svg>
  );
}

export function CompareIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}>
      <rect x="3" y="4" width="8" height="16" rx="1.5" />
      <rect x="13" y="4" width="8" height="16" rx="1.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 9v6M17 9v6" />
    </svg>
  );
}

export function BoxIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 8l8.5-4 8.5 4-8.5 4-8.5-4z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 8v8l8.5 4 8.5-4V8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v8" />
    </svg>
  );
}

export function ClipboardIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}>
      <rect x="5" y="4.5" width="14" height="17" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5V4a2 2 0 014 0v.5" />
      <path strokeLinecap="round" d="M8.5 12h7M8.5 16h7" />
    </svg>
  );
}

export function WhatsAppIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.47 14.38c-.29-.15-1.7-.84-1.97-.93-.26-.1-.46-.15-.65.15-.2.29-.75.93-.92 1.13-.17.19-.34.22-.63.07-.29-.15-1.22-.45-2.32-1.43-.86-.76-1.44-1.71-1.6-2-.17-.29-.02-.45.13-.6.13-.13.29-.34.44-.51.15-.17.19-.29.29-.48.1-.2.05-.36-.02-.51-.07-.15-.65-1.57-.9-2.15-.24-.57-.48-.49-.65-.5h-.56c-.19 0-.51.07-.78.36-.26.29-1.02 1-1.02 2.43 0 1.44 1.05 2.82 1.19 3.02.15.19 2.05 3.13 4.97 4.39.69.3 1.24.48 1.66.61.7.22 1.34.19 1.84.12.56-.08 1.7-.7 1.94-1.37.24-.68.24-1.26.17-1.38-.07-.12-.26-.19-.55-.34z" />
      <path d="M12.02 2C6.5 2 2 6.48 2 12c0 1.83.49 3.61 1.42 5.17L2 22l4.96-1.3A9.95 9.95 0 0012.02 22C17.53 22 22 17.52 22 12S17.53 2 12.02 2zm0 18.14c-1.7 0-3.36-.46-4.81-1.32l-.34-.2-2.94.77.79-2.86-.22-.3A8.14 8.14 0 013.86 12c0-4.5 3.67-8.15 8.16-8.15S20.18 7.5 20.18 12s-3.67 8.14-8.16 8.14z" />
    </svg>
  );
}
