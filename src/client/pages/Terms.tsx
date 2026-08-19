export default function Terms() {
  return (
    <div className="max-w-container-max mx-auto px-gutter py-8 md:py-12 flex flex-col gap-8 relative z-10 fade-in">
      <div>
        <h1 className="font-display-lg text-display-lg font-bold text-white mb-2">Умови використання</h1>
        <p className="text-label-sm text-on-surface-variant">Останнє оновлення: 2026 рік</p>
      </div>

      <div className="glass-panel rounded-2xl p-8 md:p-10 border border-white/10 flex flex-col gap-8 text-on-surface-variant text-body-md leading-relaxed">
        <section>
          <h2 className="text-headline-md font-headline-md text-emerald-glow mb-3 font-semibold">1. Прийняття умов</h2>
          <p>
            Використовуючи веб-сервіс <strong className="text-white">НЕЗБІГ 2.0</strong>, ви погоджуєтеся дотримуватися цих Умов використання. Якщо ви не погоджуєтеся з будь-яким із положень, просимо припинити використання сервісу.
          </p>
        </section>

        <section>
          <h2 className="text-headline-md font-headline-md text-emerald-glow mb-3 font-semibold">2. Опис сервісу</h2>
          <p className="mb-3">
            НЕЗБІГ 2.0 надає користувачам інструменти для:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>Автоматизованої перевірки тексту та документів на текстові збіги у відкритих інтернет-джерелах.</li>
            <li>Аналізу тексту на ймовірні ознаки генерації штучним інтелектом (AI).</li>
            <li>Стилістичного покращення ("олюднення") тексту.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-headline-md font-headline-md text-emerald-glow mb-3 font-semibold">3. Інтелектуальна власність та права на текст</h2>
          <p>
            Ви зберігаєте всі авторські та виключні права на будь-який текст або документ, завантажений у сервіс. Сервіс НЕЗБІГ 2.0 не претендує на права власності щодо ваших матеріалів і не поширює їх.
          </p>
        </section>

        <section>
          <h2 className="text-headline-md font-headline-md text-emerald-glow mb-3 font-semibold">4. Правила прийнятного використання</h2>
          <p className="mb-3">Користувачеві забороняється:</p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>Здійснювати спроби порушити нормальну роботу сервісу, сервісні ліміти або стабільність серверної інфраструктури.</li>
            <li>Використовувати автоматизовані засоби (скрипти, парсери, боти) без попереднього погодження.</li>
            <li>Завантажувати шкідливе програмне забезпечення або файли, що містять віруси.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-headline-md font-headline-md text-emerald-glow mb-3 font-semibold">5. Відмова від гарантій</h2>
          <p>
            Результати перевірки на плагіат та виявлення AI носять виключно інформаційно-аналітичний та рекомендаційний характер. Сервіс надається за принципом «як є» ("as is"). Ми не несемо відповідальності за академічні, юридичні чи професійні висновки, зроблені на основі згенерованих звітів.
          </p>
        </section>

        <section>
          <h2 className="text-headline-md font-headline-md text-emerald-glow mb-3 font-semibold">6. Зміни до умов</h2>
          <p>
            Ми залишаємо за собою право вносити зміни до цих Умов у будь-який час. Актуальна версія завжди розміщена на цій сторінці.
          </p>
        </section>
      </div>
    </div>
  );
}
