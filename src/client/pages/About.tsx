export default function About() {
  return (
    <div className="max-w-container-max mx-auto px-gutter py-margin-desktop md:py-margin-desktop flex flex-col gap-8 relative z-10 fade-in">
      <h1 className="font-display-lg text-display-lg font-bold text-white">Про нас</h1>
      <div className="glass-panel rounded-xl p-8 border">
        <h2 className="text-headline-lg font-headline-lg text-emerald-glow mb-4">Наша місія</h2>
        <p className="text-body-lg text-on-surface-variant mb-6">
          НЕЗБІГ 2.0 створений для того, щоб надати кожному інструмент для чесної та ефективної перевірки тексту.
          Ми віримо, що кожен автор заслуговує на можливість створювати унікальний контент, а викладачі та редактори — на надійний спосіб перевірки оригінальності.
        </p>
        
        <h2 className="text-headline-lg font-headline-lg text-emerald-glow mb-4 mt-8">Чому ми?</h2>
        <ul className="list-disc list-inside text-body-lg text-on-surface-variant space-y-2">
          <li>Швидка та глибока перевірка на плагіат.</li>
          <li>Виявлення тексту, згенерованого штучним інтелектом.</li>
          <li>Конфіденційність: ми не зберігаємо ваші тексти.</li>
          <li>Інструмент "олюднення" тексту для покращення стилю.</li>
        </ul>
      </div>
    </div>
  );
}
