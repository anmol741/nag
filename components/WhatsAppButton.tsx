import { WhatsAppIcon } from "./icons";

const phoneDigits = "17782787727"; // +1 778 278 7727, verified business number
const prefilledMessage = "Hello Nag's Beauty, I have a question about your products or courses.";
const whatsappUrl = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(prefilledMessage)}`;

/**
 * Floating WhatsApp contact button, shown on every page (mounted once in
 * the root layout). Plain outbound `wa.me` link — no third-party tracking
 * or chat-widget script. `fixed` positioning is relative to the viewport,
 * so this never contributes to page scrollWidth; sizing/offsets are tuned
 * down at the smallest widths per design spec (~16px from each edge,
 * slightly smaller under 640px) and padded for iOS safe-area insets.
 */
export default function WhatsAppButton() {
  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Nag's Beauty on WhatsApp (opens in a new tab)"
      className="fixed z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:h-14 sm:w-14"
      style={{
        right: "calc(env(safe-area-inset-right, 0px) + 1rem)",
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)",
      }}
    >
      <WhatsAppIcon className="h-6 w-6 sm:h-7 sm:w-7" />
    </a>
  );
}
