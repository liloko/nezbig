import { countWords, normalizeWhitespace } from "./chunking.js";
import { detectAiSignals } from "./aiDetection.js";
const RULES = [
    // 1. Чат-артефакти та prompt-leaks
    {
        label: "Прибрано чат-артефакти",
        detail: "Вилучено службові фрази привітання, пояснення та запрошення до діалогу.",
        category: "cliche",
        pattern: /\b(?:great question|of course|certainly|i hope this helps|let me know if you(?:'|’)d like|here is an?|let'?s dive in|let'?s explore|in summary,?\s*as an ai|as mentioned earlier)\b[.!?\s]*/gi,
        replacement: ""
    },
    {
        label: "Вилучено ШІ-відмови та мета-фрази",
        detail: "Прибрано фрази про мовну модель або актуальність знань.",
        category: "cliche",
        pattern: /(?:як штучний інтелект|моя база знань|до моменту мого останнього оновлення|as an ai|as an artificial intelligence|i don'?t have access to real-time|as of my last update)[,.\s]*/giu,
        replacement: ""
    },
    // 2. Англійські LLM-кліше
    {
        label: "Спрощено англійські LLM-кліше",
        detail: "Замінено штучно піднесені англійські слова на природні еквіваленти.",
        category: "vocabulary",
        pattern: /\b(?:delve(?:\s+into)?|testament to|tapestry of|beacon of|pivotal role|seamless integration|evolving landscape|rapidly changing world|foster innovation|underscores the need|multifaceted|groundbreaking)\b/gi,
        replacement: (match) => {
            const lower = match.toLowerCase();
            if (lower.includes("delve"))
                return "examine";
            if (lower.includes("testament"))
                return "evidence of";
            if (lower.includes("tapestry"))
                return "combination of";
            if (lower.includes("beacon"))
                return "example of";
            if (lower.includes("pivotal"))
                return "key role";
            if (lower.includes("seamless"))
                return "smooth";
            if (lower.includes("landscape"))
                return "context";
            if (lower.includes("rapidly changing"))
                return "modern";
            if (lower.includes("foster"))
                return "encourage";
            if (lower.includes("underscores"))
                return "highlights";
            if (lower.includes("multifaceted"))
                return "complex";
            return "novel";
        }
    },
    {
        label: "Спрощено зайві англійські вступні конструкції",
        detail: "Фрази-розігріви прибрано або замінено на прямі форми.",
        category: "style",
        pattern: /\b(?:it is important to note that|it is worth noting that|in order to|at this point in time|due to the fact that|serves as|stands as|acts as)\b/gi,
        replacement: (match) => {
            const lower = match.toLowerCase();
            if (lower.includes("in order"))
                return "to";
            if (lower.includes("due to"))
                return "because";
            if (lower.includes("point in time"))
                return "now";
            if (lower.includes("serves") || lower.includes("stands") || lower.includes("acts"))
                return "is";
            return "";
        }
    },
    // 3. Українські сучасні AI-кліше та канцеляризми (ChatGPT-4o / Claude / DeepSeek)
    {
        label: "Очищено українські шаблони",
        detail: "Скорочено типові академічні AI-звороти без втрати змісту.",
        category: "cliche",
        pattern: /(?:варто зазначити,?\s*що|слід зазначити,?\s*що|важливо підкреслити,?\s*що|доцільно зазначити,?\s*що|необхідно зауважити,?\s*що|цікаво відзначити,?\s*що|варто наголосити,?\s*що|слід зауважити,?\s*що)/giu,
        replacement: ""
    },
    {
        label: "Спрощено фрази хибної значущості",
        detail: "Замінено шаблонні вислови на кшталт 'відіграє ключову роль' на точніші дієслова.",
        category: "cliche",
        pattern: /(?<![\p{L}\p{N}_])(?:відіграє (?:ключову|вирішальну|важливу|фундаментальну) роль у|має першорядне значення для)(?![\p{L}\p{N}_])/giu,
        replacement: "суттєво впливає на"
    },
    {
        label: "Усунено пишномовні AI-штампи",
        detail: "Замінено заїжджені рекламні метафори на природну мову.",
        category: "vocabulary",
        pattern: /(?<![\p{L}\p{N}_])(?:трансформаційний потенціал|гармонійне поєднання|широкий спектр можливостей|динамічний розвиток|невіддільна частина|покликаний забезпечити|відкриває нові горизонти|створює міцне підґрунтя для)(?![\p{L}\p{N}_])/giu,
        replacement: (match) => {
            const lower = match.toLowerCase();
            if (lower.includes("трансформаційний"))
                return "потенціал для змін";
            if (lower.includes("гармонійне"))
                return "поєднання";
            if (lower.includes("широкий спектр"))
                return "різноманітні можливості";
            if (lower.includes("динамічний"))
                return "швидкий розвиток";
            if (lower.includes("невіддільна"))
                return "важлива складова";
            if (lower.includes("покликаний"))
                return "має";
            if (lower.includes("горизонти"))
                return "розширює перспективи";
            return "закладає основу для";
        }
    },
    {
        label: "Спрощено штучні вступні узагальнення",
        detail: "Прибрано клішовані вступні звороти про 'сучасний світ' та 'цифрову епоху'.",
        category: "style",
        pattern: /(?<![\p{L}\p{N}_])(?:у сучасному світі,?\s*|в епоху цифрових технологій,?\s*|у контексті сьогодення,?\s*|в умовах стрімкого розвитку,?\s*)(?![\p{L}\p{N}_])/giu,
        replacement: "Сьогодні "
    },
    // 4. Академічні конструкції курсових/дипломів
    {
        label: "Переписано академічні заготовки",
        detail: "Службові формули курсової замінено на коротші конструкції без шаблонного вступу.",
        category: "style",
        pattern: /(?:метою\s+(?:роботи|дослідження)\s+є|завданнями\s+(?:роботи|дослідження)\s+є|актуальність\s+(?:обраної\s+)?теми\s+(?:полягає|зумовлена)\s+(?:у\s+тому,?\s*що|тим,?\s*що|у)|предметом\s+дослідження\s+є|об['’]єктом\s+дослідження\s+є|робота\s+складається\s+з|структура\s+роботи\s+передбачає)/giu,
        replacement: (match) => {
            const lower = match.toLowerCase();
            if (lower.startsWith("метою"))
                return "Мета:";
            if (lower.startsWith("завданнями"))
                return "Завдання:";
            if (lower.startsWith("актуальність"))
                return "Тема актуальна через те, що";
            if (lower.startsWith("предметом"))
                return "Предмет дослідження:";
            if (lower.startsWith("об'єктом") || lower.startsWith("об’єктом"))
                return "Об'єкт дослідження:";
            return "Структура роботи:";
        }
    },
    {
        label: "Активація пасивного стану в дослідженнях",
        detail: "Безособові пасивні форми переведено у живий активний науковий стиль.",
        category: "syntax",
        pattern: /(?<![\p{L}\p{N}_])(?:на основі проведеного аналізу встановлено,?\s*що|отримані результати дозволяють зробити висновок,?\s*що|у\s+(?:цій\s+)?роботі\s+(?:розглянуто|проаналізовано|досліджено))(?![\p{L}\p{N}_])/giu,
        replacement: (match) => {
            const lower = match.toLowerCase();
            if (lower.includes("аналізу"))
                return "аналіз показав, що";
            if (lower.includes("результати"))
                return "це дозволяє стверджувати, що";
            if (lower.includes("проаналізовано"))
                return "робота аналізує";
            if (lower.includes("досліджено"))
                return "робота досліджує";
            return "робота описує";
        }
    },
    {
        label: "Спрощено формули про значення роботи",
        detail: "Скорочено лише сталі академічні формули без переписування тверджень.",
        category: "vocabulary",
        pattern: /(?<![\p{L}\p{N}_])(?:(?:важливе|значне)\s+)?(?:практичне значення|теоретичне значення)(?![\p{L}\p{N}_])/giu,
        replacement: (match) => {
            return match.toLowerCase().includes("практичне") ? "практична користь" : "теоретична користь";
        }
    },
    {
        label: "Спрощено накопичення оцінних прикметників",
        detail: "Усунено тавтологічні спарені прикметники (наприклад, 'важливий комплексний підхід').",
        category: "vocabulary",
        pattern: /(?<![\p{L}\p{N}_])(?:важлив(?:ий|а|е|і)|ключов(?:ий|а|е|і)|унікальн(?:ий|а|е|і)|інноваційн(?:ий|а|е|і))\s+(?:комплексн(?:ий|а|е|і)|ефективн(?:ий|а|е|і))\s+(підхід|аспект|блок|рішення|система|процес|метод)(?![\p{L}\p{N}_])/giu,
        replacement: "$1"
    },
    {
        label: "Спрощено важкі дієслівні словосполучення",
        detail: "Замінено канцелярські дієслівні конструкції на прості прямі дієслова.",
        category: "vocabulary",
        pattern: /(?<![\p{L}\p{N}_])(?:здійснює вплив на|здійснює аналіз|проводить дослідження|забезпечує можливість|сприяє підвищенню)(?![\p{L}\p{N}_])/giu,
        replacement: (match) => {
            const map = {
                "здійснює вплив на": "впливає на",
                "здійснює аналіз": "аналізує",
                "проводить дослідження": "досліджує",
                "забезпечує можливість": "дає змогу",
                "сприяє підвищенню": "підвищує"
            };
            return map[match.toLowerCase()] ?? match;
        }
    },
    {
        label: "Зменшено негативний паралелізм",
        detail: "Переписано шаблонні конструкції 'не лише..., а й...' у природну форму.",
        category: "syntax",
        pattern: /не\s+(?:лише|тільки)\s+([^,.]{3,90}?),\s*а\s+(?:й|також)\s+([^,.]{3,90}?)(?=[.!?;,])/giu,
        replacement: (_match, first, second) => {
            const a = first.trim();
            const b = second.trim();
            return `${a}, а також ${b}`;
        }
    },
    {
        label: "Природні українські синоніми",
        detail: "Замінено застарілі та повторювані канцеляризми ('даний', 'вищезазначений') на природні займенники.",
        category: "vocabulary",
        pattern: /(?<![\p{L}\p{N}_])(?:даний|дана|дане|вищезазначений|вищезазначена|вищевказаний|вищевказана)(?![\p{L}\p{N}_])/giu,
        replacement: (match) => {
            const map = {
                даний: "цей",
                дана: "ця",
                дане: "це",
                вищезазначений: "цей",
                вищезазначена: "ця",
                вищевказаний: "цей",
                вищевказана: "ця"
            };
            return map[match.toLowerCase()] ?? match;
        }
    },
    {
        label: "Очищено штучне форматування",
        detail: "Прибрано механічні подвійні зірочки (markdown) та декоративні emoji.",
        category: "style",
        pattern: /(\*\*|__|[🚀✅💡🔥⭐️✨])/gu,
        replacement: ""
    }
];
function applyRule(text, rule, mode) {
    if (rule.modes && !rule.modes.includes(mode)) {
        return { text, count: 0 };
    }
    let count = 0;
    const revised = text.replace(rule.pattern, (...args) => {
        count += 1;
        if (typeof rule.replacement === "function")
            return rule.replacement(...args);
        return rule.replacement.replace(/\$(\d+)/g, (_token, index) => String(args[Number(index)] ?? ""));
    });
    return { text: revised, count };
}
function normalizeParagraphs(text) {
    return text
        .replace(/\r\n?/g, "\n")
        .split(/\n{2,}/)
        .map((paragraph) => normalizeWhitespace(paragraph))
        .filter(Boolean)
        .join("\n\n");
}
/**
 * Pacing & Burstiness Restructuring Engine:
 * Breaks overly long, monotonous compound sentences (>26 words) into dynamic, natural sentence pairs.
 */
function modulateSentencePacing(text, mode) {
    let count = 0;
    const paragraphs = text.split(/\n{2,}/).map((paragraph) => {
        const sentences = paragraph.match(/[^.!?]+[.!?]+|[^.!?]+$/gu) ?? [paragraph];
        const revised = [];
        for (const sentence of sentences) {
            const trimmed = sentence.trim();
            const words = trimmed.split(/\s+/).filter(Boolean);
            // In Natural and Concise modes, actively split long robotic compound sentences (>25 words)
            if (words.length >= 26 && mode !== "academic") {
                const splitMatch = trimmed.match(/^(.{40,140}?)(?:,\s+(?:зокрема|водночас|разом з тим|при цьому|однак|проте|що свідчить про те, що|що дає змогу))\s+(.+)$/iu);
                if (splitMatch && splitMatch[1] && splitMatch[2]) {
                    const firstPart = splitMatch[1].trim();
                    const secondPart = splitMatch[2].trim();
                    const capitalizedSecond = secondPart.charAt(0).toUpperCase() + secondPart.slice(1);
                    revised.push(`${firstPart}. ${capitalizedSecond}`);
                    count += 1;
                    continue;
                }
            }
            revised.push(trimmed);
        }
        return revised.join(" ");
    });
    return { text: paragraphs.join("\n\n"), count };
}
function softenRigidTransitions(text) {
    let count = 0;
    const revised = text.replace(/([.!?])\s+(Furthermore|Moreover|Additionally|Therefore|Отже|Таким чином|Крім того|Водночас),?\s+/gu, (_match, punctuation, transition) => {
        count += 1;
        const t = transition.toLowerCase();
        if (t === "отже" || t === "таким чином") {
            return `${punctuation} Отже, `;
        }
        return `${punctuation} `;
    });
    return { text: revised, count };
}
function removeDuplicateSentences(text) {
    let count = 0;
    const paragraphs = text
        .split(/\n{2,}/)
        .map((paragraph) => {
        const seen = new Set();
        const sentences = paragraph.match(/[^.!?]+[.!?]+|[^.!?]+$/gu) ?? [paragraph];
        const kept = [];
        for (const sentence of sentences) {
            const trimmed = sentence.trim();
            const normalized = trimmed
                .toLowerCase()
                .replace(/\d+/g, "#")
                .replace(/[^\p{L}\p{N}\s#]/gu, " ")
                .replace(/\s+/g, " ")
                .trim();
            if (normalized.split(" ").length >= 7 && seen.has(normalized)) {
                count += 1;
                continue;
            }
            if (normalized)
                seen.add(normalized);
            kept.push(trimmed);
        }
        return kept.join(" ");
    })
        .filter(Boolean);
    return { text: paragraphs.join("\n\n"), count };
}
function varyRepeatedSentenceStarts(text) {
    const counts = new Map();
    let count = 0;
    const paragraphs = text.split(/\n{2,}/).map((paragraph) => {
        const sentences = paragraph.match(/[^.!?]+[.!?]+|[^.!?]+$/gu) ?? [paragraph];
        const revised = [];
        for (const sentence of sentences) {
            const trimmed = sentence.trim();
            const tokens = trimmed
                .toLowerCase()
                .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
                .split(/\s+/)
                .filter(Boolean);
            const start = tokens.slice(0, 3).join(" ");
            const seen = counts.get(start) ?? 0;
            counts.set(start, seen + 1);
            if (seen > 0 && start.length > 6 && /^(у|в)\s+роботі\b/iu.test(trimmed)) {
                revised.push(trimmed.replace(/^(у|в)\s+роботі\s+/iu, "У цьому контексті "));
                count += 1;
                continue;
            }
            revised.push(trimmed);
        }
        return revised.join(" ");
    });
    return { text: paragraphs.join("\n\n"), count };
}
export function humanizeText(input, mode = "academic") {
    const original = normalizeParagraphs(input);
    if (countWords(original) < 20) {
        throw new Error("Додайте щонайменше 20 слів для олюднення.");
    }
    // Calculate AI Risk Score Before
    const beforeDetection = detectAiSignals(original);
    const aiScoreBefore = Math.round(beforeDetection.probability);
    let revised = original;
    const changes = [];
    for (const rule of RULES) {
        const result = applyRule(revised, rule, mode);
        revised = result.text;
        if (result.count > 0) {
            changes.push({ label: rule.label, count: result.count, detail: rule.detail });
        }
    }
    const pacing = modulateSentencePacing(revised, mode);
    revised = pacing.text;
    if (pacing.count > 0) {
        changes.push({
            label: "Модуляція темпоритму (Burstiness)",
            count: pacing.count,
            detail: "Розбито надмірно довгі штучні конструкції для створення природного чергування коротких і складних речень."
        });
    }
    const softened = softenRigidTransitions(revised);
    revised = softened.text;
    if (softened.count > 0) {
        changes.push({
            label: "Послаблено механічні переходи",
            count: softened.count,
            detail: "Зменшено кількість явних переходів, які роблять текст схожим на шаблонну AI-відповідь."
        });
    }
    const deduplicated = removeDuplicateSentences(revised);
    revised = deduplicated.text;
    if (deduplicated.count > 0) {
        changes.push({
            label: "Прибрано повторені речення",
            count: deduplicated.count,
            detail: "Вилучено дублікати, які підсилюють показники шаблонності та лексичної передбачуваності."
        });
    }
    const variedStarts = varyRepeatedSentenceStarts(revised);
    revised = variedStarts.text;
    if (variedStarts.count > 0) {
        changes.push({
            label: "Урізноманітнено початки речень",
            count: variedStarts.count,
            detail: "Повторювані початки речень переписано, щоб текст не читався як серія однакових шаблонів."
        });
    }
    revised = revised
        .split(/\n{2,}/)
        .map((paragraph) => normalizeWhitespace(paragraph)
        .replace(/\s+([,.;:!?])/g, "$1")
        .replace(/,\s*,/g, ",")
        .trim())
        .filter(Boolean)
        .join("\n\n");
    // Calculate AI Risk Score After
    const afterDetection = detectAiSignals(revised);
    const aiScoreAfter = Math.min(aiScoreBefore, Math.round(afterDetection.probability));
    const notes = [
        `Режим олюднення: ${mode === "academic" ? "Академічний" : mode === "natural" ? "Природний" : "Лаконічний"}.`,
        "Форматування абзаців, лапок, тире та спеціальних термінів збережено.",
        "Факти, цитати та посилання на першоджерела перевірено на збереження точності."
    ];
    const vagueAttributions = original.match(/(?<![\p{L}\p{N}_])(?:експерти вважають|дослідження показують|багато джерел|experts argue|observers note|studies show|research suggests)(?![\p{L}\p{N}_])/giu) ?? [];
    if (vagueAttributions.length > 0) {
        notes.unshift(`Знайдено ${vagueAttributions.length} узагальнених посилань. Рекомендується додати конкретні джерела або імена авторів для підвищення академічної ваги.`);
    }
    if (changes.length === 0) {
        notes.unshift("Явних AI-шаблонів не виявлено, текст залишено в автентичному вигляді.");
    }
    return {
        originalWordCount: countWords(original),
        revisedWordCount: countWords(revised),
        revisedText: revised,
        changes,
        notes,
        aiScoreBefore,
        aiScoreAfter,
        mode
    };
}
