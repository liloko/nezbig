import { useLanguage } from "../context/LanguageContext";

export default function Privacy() {
  const { lang } = useLanguage();

  return (
    <div className="max-w-container-max mx-auto px-gutter py-8 md:py-12 flex flex-col gap-8 relative z-10 fade-in">
      <div>
        <h1 className="font-display-lg text-display-lg font-bold text-white mb-2">
          {lang === "uk" ? "Політика конфіденційності" : "Privacy Policy"}
        </h1>
        <p className="text-label-sm text-on-surface-variant">
          {lang === "uk" ? "Останнє оновлення: 2026 рік" : "Last updated: 2026"}
        </p>
      </div>

      <div className="glass-panel rounded-2xl p-8 md:p-10 border border-white/10 flex flex-col gap-8 text-on-surface-variant text-body-md leading-relaxed">
        <section>
          <h2 className="text-headline-md font-headline-md text-emerald-glow mb-3 font-semibold">
            {lang === "uk" ? "1. Загальні положення" : "1. General Provisions"}
          </h2>
          <p>
            {lang === "uk" ? (
              <>
                Сервіс <strong className="text-white">НЕЗБІГ 2.0</strong> поважає вашу приватність та прагне забезпечити максимальний рівень захисту ваших персональних даних та перевірених документів. Ця Політика пояснює, як ми збираємо, використовуємо та захищаємо інформацію.
              </>
            ) : (
              <>
                <strong className="text-white">NEZBIG 2.0</strong> respects your privacy and is committed to protecting your personal information and scanned documents. This policy explains our zero-retention data practices.
              </>
            )}
          </p>
        </section>

        <section>
          <h2 className="text-headline-md font-headline-md text-emerald-glow mb-3 font-semibold">
            {lang === "uk" ? "2. Конфіденційність перевірених текстів" : "2. Document Privacy & Zero Retention"}
          </h2>
          <p className="mb-3">
            {lang === "uk" ? "Ми суворо дотримуємося принципу нульового збереження документів на серверах:" : "We enforce strict zero-storage standards:"}
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong className="text-white">{lang === "uk" ? "Без збереження текстів:" : "No Document Storage:"}</strong>{" "}
              {lang === "uk" ? "Ваші тексти та файли (DOCX, PDF) обробляються виключно в оперативній пам'яті під час перевірки і не зберігаються у базах даних нашого сервера." : "Your uploaded documents and texts (DOCX, PDF, TXT) are processed strictly in RAM during scanning and are never written to permanent databases."}
            </li>
            <li>
              <strong className="text-white">{lang === "uk" ? "Без використання для навчання AI:" : "No AI Model Training:"}</strong>{" "}
              {lang === "uk" ? "Ми ніколи не використовуємо ваші матеріали для донавчання моделей штучного інтелекту." : "We never train machine learning or AI models on user submissions."}
            </li>
            <li>
              <strong className="text-white">{lang === "uk" ? "Локальна історія:" : "Local History Only:"}</strong>{" "}
              {lang === "uk" ? "Історія ваших перевірок зберігається локально у сховищі вашого браузера (localStorage), що гарантує повний контроль над вашими даними." : "Your scan history is stored locally within your own browser (localStorage) unless you choose to sync via your personal account."}
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-headline-md font-headline-md text-emerald-glow mb-3 font-semibold">
            {lang === "uk" ? "3. Облікові записи та авторизація" : "3. Accounts and Authentication"}
          </h2>
          <p className="mb-3">
            {lang === "uk" ? "Якщо ви створюєте обліковий запис або входите через Google OAuth:" : "If you create an account or sign in with Google OAuth:"}
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>{lang === "uk" ? "Ми зберігаємо лише базову інформацію: ім'я, адресу електронної пошти та аватар профілю." : "We store only basic identity data: name, email address, and avatar."}</li>
            <li>{lang === "uk" ? "Паролі шифруються за допомогою надійних односторонніх криптографічних алгоритмів (bcrypt)." : "Passwords are encrypted using industry-standard bcrypt hashing."}</li>
            <li>{lang === "uk" ? "Сесії автентифікації захищені сучасними захищеними куками (HTTP-only)." : "Authentication sessions use secure, HTTP-only cookies."}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-headline-md font-headline-md text-emerald-glow mb-3 font-semibold">
            {lang === "uk" ? "4. Безпека передачі даних" : "4. Transport Security"}
          </h2>
          <p>
            {lang === "uk"
              ? "Усі запити між вашим браузером і нашими серверами передаються виключно через зашифровані канали з використанням протоколу HTTPS/TLS."
              : "All communication between your browser and our servers is secured end-to-end via HTTPS/TLS with strict Content Security Policies."}
          </p>
        </section>

        <section>
          <h2 className="text-headline-md font-headline-md text-emerald-glow mb-3 font-semibold">
            {lang === "uk" ? "5. Ваші права" : "5. Your Rights"}
          </h2>
          <p>
            {lang === "uk"
              ? "Ви маєте повне право видалити свою локальну історію в один клік у розділі «Історія перевірок», а також звернутися до нас для видалення вашого облікового запису в будь-який момент."
              : "You have full control to clear your scan history anytime in one click, and can request full deletion of your user account upon request."}
          </p>
        </section>
      </div>
    </div>
  );
}
