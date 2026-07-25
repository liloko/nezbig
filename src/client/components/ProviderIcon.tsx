import { siDuckduckgo, siGoogle, siBrave, siWikipedia, siSemanticscholar } from "simple-icons";

export function ProviderIcon({ provider, className }: { provider: string; className?: string }) {
  let icon;
  switch (provider.toLowerCase()) {
    case "duckduckgo": icon = siDuckduckgo; break;
    case "google": icon = siGoogle; break;
    case "brave": icon = siBrave; break;
    case "wikipedia": icon = siWikipedia; break;
    case "semantic scholar": icon = siSemanticscholar; break;
    default: return null;
  }
  return (
    <svg className={className} role="img" viewBox="0 0 24 24" width="16" height="16" style={{ fill: "currentColor", display: "inline-block", verticalAlign: "middle", marginRight: "6px" }} xmlns="http://www.w3.org/2000/svg">
      <path d={icon.path} />
    </svg>
  );
}
