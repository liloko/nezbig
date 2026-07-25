import type { ScanReport } from "../../shared/types";
import { ProviderIcon } from "./ProviderIcon";

function providerDiagnosticLabel(provider: NonNullable<ScanReport["searchDiagnostics"]>["providers"][number]): string {
  if (provider.attempted === 0) return provider.skippedReason?.startsWith("не налаштовано") ? "не підключено" : "пропущено";
  if (provider.succeeded === 0) return "недоступний";
  return `${provider.succeeded}/${provider.attempted} · ${provider.results} рез.`;
}

export function ProviderDiagnostics({ diagnostics }: { diagnostics: ScanReport["searchDiagnostics"] }) {
  if (!diagnostics) return null;

  return (
    <div className="provider-health" aria-label="Стан пошукових провайдерів">
      {diagnostics.providers.map((provider) => (
        <span
          className={provider.succeeded === 0 ? "provider-health-issue" : ""}
          key={provider.provider}
          title={provider.skippedReason ?? `${provider.failed} помилок, ${provider.timedOut} timeout`}
        >
          <div className="provider-health-metric">
            <strong>
              <ProviderIcon provider={provider.provider} /> {provider.provider}
            </strong>
            {providerDiagnosticLabel(provider)}
          </div>
        </span>
      ))}
      <span title="Сторінки, текст яких сервер зміг прочитати для підтвердження збігу">
        <strong>Сторінки</strong>
        {diagnostics.pages.verified} підтвердж. · {diagnostics.pages.unavailable} недоступ.
      </span>
    </div>
  );
}
