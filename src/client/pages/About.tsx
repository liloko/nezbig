import { useLanguage } from "../context/LanguageContext";

export default function About() {
  const { lang } = useLanguage();

  return (
    <div className="max-w-container-max mx-auto px-gutter py-8 md:py-12 flex flex-col gap-8 relative z-10 fade-in">
      <h1 className="font-display-lg text-display-lg font-bold text-white">
        {lang === "uk" ? "Про нас" : "About Nezbig"}
      </h1>
      <div className="glass-panel rounded-2xl p-8 border border-white/10">
        <h2 className="text-headline-lg font-headline-lg text-emerald-glow mb-4 font-bold">
          {lang === "uk" ? "Наша місія" : "Our Mission"}
        </h2>
        <p className="text-body-lg text-on-surface-variant mb-6 leading-relaxed">
          {lang === "uk"
            ? "НЕЗБІГ 2.0 створений для того, щоб надати кожному доступний інструмент для чесної та ефективної перевірки тексту на плагіат та ознаки штучного інтелекту. Ми віримо, що кожен автор заслуговує на можливість створювати унікальний контент, а викладачі та редактори — на надійний спосіб перевірки оригінальності."
            : "NEZBIG 2.0 is designed to provide everyone with an accessible, high-precision tool for plagiarism checking, AI text detection, and style humanization. We believe every writer, student, and researcher deserves reliable tools to verify academic integrity and enhance writing quality."}
        </p>
        
        <h2 className="text-headline-lg font-headline-lg text-emerald-glow mb-4 mt-8 font-bold">
          {lang === "uk" ? "Чому обирають Незбіг?" : "Key Advantages"}
        </h2>
        <ul className="list-disc list-inside text-body-lg text-on-surface-variant space-y-3 leading-relaxed">
          <li>
            <strong className="text-white">{lang === "uk" ? "Мультипошукова перевірка на плагіат:" : "Deep Plagiarism Search:"}</strong>{" "}
            {lang === "uk" ? "сканування відкритих вебджерел та міжнародних наукових баз (Crossref DOI, OpenAlex, Вікіпедія)." : "scanning across open web indices and global academic registries (Crossref DOI, OpenAlex, Wikipedia)."}
          </li>
          <li>
            <strong className="text-white">{lang === "uk" ? "Науковий AI-детектор:" : "Scientific AI Detection:"}</strong>{" "}
            {lang === "uk" ? "стилометричний аналіз темпоритму, закону Ципфа та виявлення патернів ChatGPT, Claude, Gemini, DeepSeek." : "NLP stylometric evaluation of burstiness, Zipf deviation, and pattern recognition for ChatGPT, Claude, Gemini, and DeepSeek."}
          </li>
          <li>
            <strong className="text-white">{lang === "uk" ? "Конфіденційність без збереження:" : "Zero-Retention Privacy:"}</strong>{" "}
            {lang === "uk" ? "ваші тексти обробляються в пам'яті й ніколи не передаються стороннім базам даних." : "documents are processed in memory and never stored or used to train AI models."}
          </li>
          <li>
            <strong className="text-white">{lang === "uk" ? "Олюднювач тексту:" : "AI Text Humanizer:"}</strong>{" "}
            {lang === "uk" ? "інтелектуальне переписування тексту з режимами (академічний, природний, лаконічний)." : "intelligent rewriting engine with Academic, Natural, and Concise stylistic modes."}
          </li>
        </ul>
      </div>
    </div>
  );
}
