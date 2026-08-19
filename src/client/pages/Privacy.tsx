export default function Privacy() {
  return (
    <div className="max-w-container-max mx-auto px-gutter py-8 md:py-12 flex flex-col gap-8 relative z-10 fade-in">
      <div>
        <h1 className="font-display-lg text-display-lg font-bold text-white mb-2">Політика конфіденційності</h1>
        <p className="text-label-sm text-on-surface-variant">Останнє оновлення: 2026 рік</p>
      </div>

      <div className="glass-panel rounded-2xl p-8 md:p-10 border border-white/10 flex flex-col gap-8 text-on-surface-variant text-body-md leading-relaxed">
        <section>
          <h2 className="text-headline-md font-headline-md text-emerald-glow mb-3 font-semibold">1. Загальні положення</h2>
          <p>
            Сервіс <strong className="text-white">НЕЗБІГ 2.0</strong> поважає вашу приватність та прагне забезпечити максимальний рівень захисту ваших персональних даних та перевірених документів. Ця Політика пояснює, як ми збираємо, використовуємо та захищаємо інформацію.
          </p>
        </section>

        <section>
          <h2 className="text-headline-md font-headline-md text-emerald-glow mb-3 font-semibold">2. Конфіденційність перевірених текстів</h2>
          <p className="mb-3">
            Ми суворо дотримуємося принципу нульового збереження документів на серверах:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li><strong className="text-white">Без збереження текстів:</strong> Ваші тексти та файли (DOCX, PDF) обробляються виключно в оперативній пам'яті під час перевірки і не зберігаються у базах даних нашого сервера.</li>
            <li><strong className="text-white">Без використання для навчання AI:</strong> Ми ніколи не використовуємо ваші матеріали для донавчання моделей штучного інтелекту.</li>
            <li><strong className="text-white">Локальна історія:</strong> Історія ваших перевірок зберігається локально у сховищі вашого браузера (localStorage), що гарантує повний контроль над вашими даними.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-headline-md font-headline-md text-emerald-glow mb-3 font-semibold">3. Облікові записи та авторизація</h2>
          <p className="mb-3">
            Якщо ви створюєте обліковий запис або входите через Google OAuth:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>Ми зберігаємо лише базову інформацію: ім'я, адресу електронної пошти та аватар профілю.</li>
            <li>Паролі шифруються за допомогою надійних односторонніх криптографічних алгоритмів (bcrypt) і ніколи не зберігаються у відкритому вигляді.</li>
            <li>Сесії автентифікації захищені сучасними захищеними куками (HTTP-only).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-headline-md font-headline-md text-emerald-glow mb-3 font-semibold">4. Безпека та захист передачі даних</h2>
          <p>
            Усі запити між вашим браузером і нашими серверами передаються виключно через зашифровані канали з використанням протоколу HTTPS/TLS. Ми застосовуємо сучасні стандарти захисту (Content Security Policy, захист від атак перебору тощо).
          </p>
        </section>

        <section>
          <h2 className="text-headline-md font-headline-md text-emerald-glow mb-3 font-semibold">5. Ваші права</h2>
          <p>
            Ви маєте повне право видалити свою локальну історію в один клік у розділі "Історія перевірок", а також звернутися до нас для видалення вашого облікового запису в будь-який момент.
          </p>
        </section>
      </div>
    </div>
  );
}
