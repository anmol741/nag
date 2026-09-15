import { FACEBOOK_URL, INSTAGRAM_URL, SOCIAL_HANDLE_DISPLAY_NAME } from "@/lib/site-config";
import { FacebookIcon, InstagramIcon } from "./icons";

/**
 * Instagram + Facebook icons for @NagsBeautySupply, plus the shared handle
 * text. Both profile URLs are client-confirmed (see lib/site-config.ts).
 */
export default function SocialLinks({
  className = "",
  iconClassName = "h-4 w-4",
  showHandle = true,
}: {
  className?: string;
  iconClassName?: string;
  showHandle?: boolean;
}) {
  const platforms = [
    { url: INSTAGRAM_URL, Icon: InstagramIcon, label: "Visit Nag’s Beauty Supply on Instagram" },
    { url: FACEBOOK_URL, Icon: FacebookIcon, label: "Visit Nag’s Beauty Supply on Facebook" },
  ] as const;

  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <span className="flex items-center gap-2">
        {platforms.map(({ url, Icon, label }) => (
          <a
            key={label}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="hover:text-gold-light"
          >
            <Icon className={iconClassName} />
          </a>
        ))}
      </span>
      {showHandle && <span>{SOCIAL_HANDLE_DISPLAY_NAME}</span>}
    </span>
  );
}
