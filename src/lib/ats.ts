// Dynamic, local (no external AI) ATS analysis.

const STOP = new Set(
  "a o as os um uma uns umas de do da dos das em no na nos nas por pelo pela pelos pelas para pra com sem sob sobre entre e ou mas que se como mais menos muito muita muitos muitas ser estar ter haver seu sua seus suas nosso nossa nossos nossas este esta estes estas esse essa isso isto aquele aquela ao aos à às já também onde quando qual quais quem sua você vocês nós eles elas ele ela será serão é são foi será sendo tem têm possuir possui buscamos procuramos vaga vagas empresa empresas oportunidade oportunidades candidato candidata candidatos requisitos requisito desejável desejáveis diferencial diferenciais obrigatório obrigatórios responsabilidades atividades atribuições benefícios local trabalho time equipe área cargo função perfil profissional profissionais experiência experiências conhecimento conhecimentos conhecer anos ano mínimo nível bom boa ótimo ótima forte sólida sólido avançado avançada intermediário básico etc atuar atuação realizar desenvolver garantir apoiar participar contribuir dia dias horário remoto híbrido presencial salário vale plano saúde todos todas cada outros outras novo nova novos novas grande grandes melhor melhores através mediante dentro fora bem the and or of to in for with on at by from as is are be will you we our your an this that have has years experience knowledge strong skills ability work working team role job pleno junior júnior senior sênior certificação certificações certificado desejavel requisitos: microsoft".split(
    " ",
  ),
);

const SOFT_ROOTS = ["comunica", "lideran", "equipe", "proativ", "organiza", "resolu", "negocia", "criativ", "adapta", "pensamento", "autonom", "colabora", "empat", "relacionamento", "flexib", "iniciativa", "responsab", "comprometi", "resiliên", "resilien", "analític", "analitic", "didát", "escuta", "inteligência emocional", "foco", "gestão de tempo", "trabalho em equipe", "visão sistêmica", "atendimento ao cliente", "persuas", "ética", "curiosi", "communication", "leadership", "teamwork"];
const TECH_SEED = ["javascript", "typescript", "react", "angular", "vue", "node", "python", "java", "c#", ".net", "golang", "php", "ruby", "kotlin", "swift", "sql", "nosql", "postgresql", "mysql", "oracle", "mongodb", "redis", "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "linux", "graphql", "html", "css", "spark", "kafka", "hadoop", "api", "apis", "rest", "cloud", "erp", "crm", "sap", "totvs", "protheus", "salesforce", "android", "ios", "flutter", "django", "spring", "laravel", "pandas", "tensorflow", "llm", "ia", "ai", "machine learning", "microsserviços", "microservices", "devops", "ci/cd", "bi", "etl", "autocad", "solidworks", "revit"];
const TOOL_SEED = ["excel", "word", "powerpoint", "office", "power bi", "tableau", "jira", "confluence", "trello", "notion", "figma", "git", "github", "gitlab", "jenkins", "postman", "slack", "teams", "hubspot", "zendesk", "servicenow", "photoshop", "illustrator", "canva", "looker", "metabase", "grafana", "datadog", "sharepoint", "google analytics", "vs code", "bitbucket", "asana", "monday"];
const CERT_HINT = /certif|pmp|itil|cobit|cissp|comptia|ccna|ccnp|lpi|togaf|six sigma|green belt|black belt|scrum master|\bcsm\b|\bpsm\b|\bpspo\b|az-\d{3}|aws certified|\bcpa\b|\bcfa\b|\bcrc\b|\boab\b|\bcrea\b|\bcrm\b|nr-?\d+|iso \d+/i;

export const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export type Category = "Hard Skills" | "Soft Skills" | "Tecnologias" | "Ferramentas" | "Certificações";
export const CATEGORIES: Category[] = ["Hard Skills", "Soft Skills", "Tecnologias", "Ferramentas", "Certificações"];

export type Term = { term: string; category: Category; weight: number; found: boolean };

export type Analysis = {
  score: number;
  label: "Excelente" | "Bom" | "Regular" | "Baixo";
  terms: Term[];
  found: Term[];
  missing: Term[];
  categories: { name: Category; value: number; total: number }[];
  suggestions: string[];
  optimized: string;
  jobTitle: string;
};

export function labelFor(score: number): Analysis["label"] {
  return score >= 80 ? "Excelente" : score >= 60 ? "Bom" : score >= 40 ? "Regular" : "Baixo";
}

const inSeed = (n: string, seed: string[]) => seed.some((s) => norm(s) === n);

function classify(term: string, original: string): Category | null {
  const n = norm(term);
  if (CERT_HINT.test(original) || CERT_HINT.test(term)) return "Certificações";
  if (inSeed(n, TOOL_SEED)) return "Ferramentas";
  if (inSeed(n, TECH_SEED) || /[#+.\/]|\d/.test(term) || /^[A-Z]{2,6}$/.test(original)) return "Tecnologias";
  if (SOFT_ROOTS.some((r) => n.includes(norm(r)))) return "Soft Skills";
  return "Hard Skills";
}

function tokens(text: string) {
  return text.split(/[^\p{L}\p{N}#+./-]+/u).map((t) => t.replace(/^[./-]+|[./-]+$/g, "")).filter(Boolean);
}

function extractTerms(job: string): { term: string; category: Category; weight: number }[] {
  const scores = new Map<string, { term: string; original: string; count: number }>();
  const add = (key: string, term: string, original: string, w: number) => {
    const cur = scores.get(key);
    if (cur) cur.count += w;
    else scores.set(key, { term, original, count: w });
  };
  // multi-word seeds
  const nj = norm(job);
  [...TOOL_SEED, ...TECH_SEED, ...SOFT_ROOTS].filter((s) => s.includes(" ")).forEach((s) => {
    if (nj.includes(norm(s))) add(norm(s), s, s, 3);
  });
  // certification phrases
  (job.match(/certifica(?:ção|do|da|ções)?\s+(?:em\s+)?([\p{L}\d\- ]{2,30})/giu) || []).forEach((m) => {
    const t = m.replace(/certifica\S*\s+(em\s+)?/i, "").split(/\s+/).slice(0, 3).join(" ").trim();
    if (t) add("cert:" + norm(t), t, "certificação " + t, 3);
  });
  for (const line of job.split(/\r?\n/)) {
    const toks = tokens(line);
    for (let i = 0; i < toks.length; i++) {
      const t = toks[i], n = norm(t);
      if (n.length < 2 || STOP.has(t.toLowerCase()) || STOP.has(n) || /^\d+$/.test(n)) continue;
      const isAcronym = /^[A-Z0-9#+.]{2,8}$/.test(t);
      const isProper = /^[A-Z][a-z]/.test(t) && i > 0;
      const seeded = inSeed(n, TECH_SEED) || inSeed(n, TOOL_SEED);
      if (n.length < 4 && !isAcronym && !seeded) continue;
      add(n, isAcronym ? t : t.toLowerCase(), t, 1 + (isAcronym || seeded ? 1.5 : 0) + (isProper ? 0.5 : 0));
      // bigram
      const nx = toks[i + 1];
      if (nx) {
        const nn = norm(nx);
        if (nn.length >= 3 && !STOP.has(nn) && !STOP.has(nx.toLowerCase())) add(n + " " + nn, `${t} ${nx}`.toLowerCase(), `${t} ${nx}`, 0.6);
      } else if (toks[i + 2] && ["de", "em"].includes(toks[i + 1]?.toLowerCase())) {
        /* noop */
      }
      // "gestão de projetos" style trigram
      if (toks[i + 1] && ["de", "em", "do", "da"].includes(toks[i + 1].toLowerCase()) && toks[i + 2]) {
        const n3 = norm(toks[i + 2]);
        if (n3.length >= 4 && !STOP.has(n3)) add(`${n} ${toks[i + 1]!.toLowerCase()} ${n3}`, `${t} ${toks[i + 1]} ${toks[i + 2]}`.toLowerCase(), `${t} ${toks[i + 1]} ${toks[i + 2]}`, 0.8);
      }
    }
  }
  // keep only phrases repeated or seeded; unigrams by score
  const list = [...scores.entries()]
    .filter(([k, v]) => !k.includes(" ") || v.count >= 1.2 || k.startsWith("cert:") || inSeed(k, [...TOOL_SEED, ...TECH_SEED]) || SOFT_ROOTS.some((r) => k.includes(norm(r)) && k.split(" ").length <= 3))
    .sort((a, b) => b[1].count - a[1].count);
  const out: { term: string; category: Category; weight: number }[] = [];
  const used = new Set<string>();
  for (const [k, v] of list) {
    const key = k.replace(/^cert:/, "");
    if (used.has(key)) continue;
    // skip unigram if already covered by chosen phrase and vice-versa
    if ([...used].some((u) => u.split(" ").includes(key) || key.split(" ").every((w) => used.has(w)))) continue;
    const category = classify(v.term, v.original);
    if (!category) continue;
    used.add(key);
    out.push({ term: v.term, category, weight: v.count });
    if (out.length >= 30) break;
  }
  return out;
}

function matches(cvNorm: string, term: string) {
  const n = norm(term);
  const esc = n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (new RegExp(`(^|[^a-z0-9])${esc}($|[^a-z0-9])`).test(cvNorm)) return true;
  // stem match: every word's first 5 chars present
  const words = n.split(" ").filter((w) => w.length > 2);
  return words.length > 0 && words.every((w) => new RegExp(`(^|[^a-z0-9])${(w.length > 6 ? w.slice(0, w.length - 2) : w).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(cvNorm));
}

// ---------- Optimized resume ----------
type Section = "RESUMO" | "COMPETENCIAS" | "EXPERIENCIA" | "FORMACAO" | "CERTIFICACOES" | "IDIOMAS" | "PROJETOS" | "OUTROS";
const HEADINGS: [RegExp, Section][] = [
  [/^(resumo|sobre( mim)?|perfil|objetivo|summary|profile|apresenta)/i, "RESUMO"],
  [/^(experi[eê]ncias?( profissionais?)?|hist[oó]rico profissional|experience|carreira)/i, "EXPERIENCIA"],
  [/^(forma[cç][aã]o|educa[cç][aã]o|escolaridade|education|academic)/i, "FORMACAO"],
  [/^(habilidades|compet[eê]ncias|skills|conhecimentos|tecnologias|qualifica)/i, "COMPETENCIAS"],
  [/^(certifica|cursos|certifications|treinamentos)/i, "CERTIFICACOES"],
  [/^(idiomas|languages|l[ií]nguas)/i, "IDIOMAS"],
  [/^(projetos|projects|portf[oó]lio)/i, "PROJETOS"],
  [/^(outras|informa[cç][oõ]es adicionais|atividades|volunt)/i, "OUTROS"],
];
const TITLES: Record<Section, string> = {
  RESUMO: "RESUMO PROFISSIONAL", COMPETENCIAS: "COMPETÊNCIAS", EXPERIENCIA: "EXPERIÊNCIA PROFISSIONAL",
  FORMACAO: "FORMAÇÃO ACADÊMICA", CERTIFICACOES: "CERTIFICAÇÕES", IDIOMAS: "IDIOMAS", PROJETOS: "PROJETOS", OUTROS: "INFORMAÇÕES ADICIONAIS",
};
const ORDER: Section[] = ["RESUMO", "COMPETENCIAS", "EXPERIENCIA", "FORMACAO", "CERTIFICACOES", "IDIOMAS", "PROJETOS", "OUTROS"];

function cleanLine(raw: string) {
  let l = raw.replace(/\t/g, " ").replace(/\s{2,}/g, " ").trim();
  if (/^[•\-*–·●▪►✓>]\s*/.test(l)) {
    l = l.replace(/^[•\-*–·●▪►✓>]\s*/, "");
    l = "• " + l.charAt(0).toUpperCase() + l.slice(1);
  }
  return l;
}

function optimize(cv: string, found: Term[]) {
  const header: string[] = [];
  const sections = new Map<Section, string[]>();
  let current: Section | null = null;
  for (const raw of cv.split(/\r?\n/)) {
    const t = raw.trim();
    const clean = t.replace(/[:：]\s*$/, "").replace(/^#+\s*/, "");
    const h = clean.length < 45 ? HEADINGS.find(([r]) => r.test(clean)) : undefined;
    if (h) { current = h[1]; if (!sections.has(current)) sections.set(current, []); continue; }
    const target = current ? sections.get(current)! : header;
    if (!t) { if (target.length && target[target.length - 1] !== "") target.push(""); continue; }
    target.push(cleanLine(t));
  }
  // Competências: if missing, compile from terms that exist in the CV (never invented)
  if (!sections.has("COMPETENCIAS") && found.length) {
    const byCat = CATEGORIES.filter((c) => c !== "Certificações").map((c) => [c, found.filter((f) => f.category === c).map((f) => f.term)] as const).filter(([, v]) => v.length);
    sections.set("COMPETENCIAS", byCat.map(([c, v]) => `• ${c}: ${v.join(", ")}`));
  }
  const out: string[] = [];
  const h = header.filter((l, i, a) => !(l === "" && (i === 0 || i === a.length - 1)));
  if (h.length) { out.push(h[0]!.replace(/^• /, "").toUpperCase(), ...h.slice(1).filter(Boolean)); }
  for (const s of ORDER) {
    const lines = sections.get(s);
    if (!lines || !lines.some(Boolean)) continue;
    while (lines[lines.length - 1] === "") lines.pop();
    while (lines[0] === "") lines.shift();
    out.push("", TITLES[s], "─".repeat(TITLES[s].length), ...lines);
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function analyze(job: string, cv: string): Analysis {
  const cvNorm = norm(cv);
  const terms: Term[] = extractTerms(job).map((t) => ({ ...t, found: matches(cvNorm, t.term) }));
  const found = terms.filter((t) => t.found);
  const missing = terms.filter((t) => !t.found);
  const totalW = terms.reduce((s, t) => s + t.weight, 0);
  const foundW = found.reduce((s, t) => s + t.weight, 0);
  const weighted = totalW ? foundW / totalW : 0;
  const plain = terms.length ? found.length / terms.length : 0;
  const structure = ["RESUMO", "EXPERI", "FORMA", "COMPET|HABILIDADE|SKILL"].filter((r) => new RegExp(r, "i").test(norm(cv).toUpperCase())).length / 4;
  const score = terms.length ? Math.round(Math.min(100, (weighted * 0.6 + plain * 0.3 + structure * 0.1) * 100)) : 0;

  const categories = CATEGORIES.map((c) => {
    const all = terms.filter((t) => t.category === c);
    const ok = all.filter((t) => t.found);
    return { name: c, total: all.length, value: all.length ? Math.round((ok.length / all.length) * 100) : 0 };
  });

  const sug: string[] = [];
  found.filter((t) => t.category === "Tecnologias" || t.category === "Ferramentas").slice(0, 3)
    .forEach((t) => sug.push(`Destacar sua experiência com ${t.term} no resumo profissional e nas experiências.`));
  if (found.some((t) => t.category === "Certificações") || /certifica/i.test(cv)) sug.push("Mover certificações para uma posição de maior destaque no currículo.");
  if (found.length) sug.push(`Repetir de forma natural os termos da vaga já presentes no currículo: ${found.slice(0, 6).map((t) => t.term).join(", ")}.`);
  if (!/resumo|perfil|objetivo|summary|sobre/i.test(cv)) sug.push("Incluir um resumo profissional de 3 a 4 linhas baseado nas suas experiências reais.");
  if (!/\d+\s?%|\d{2,}/.test(cv)) sug.push("Quantificar resultados que você já alcançou (percentuais, valores, prazos), se houver.");
  if (!/compet|habilidad|skills|conhecimentos/i.test(cv)) sug.push("Criar uma seção de Competências listando habilidades que você já possui.");
  if (missing.length) sug.push(`Termos da vaga ausentes: ${missing.slice(0, 6).map((t) => t.term).join(", ")}. Inclua somente se você realmente os possui.`);
  sug.push("Usar títulos de seção padrão e evitar tabelas, colunas, ícones e imagens.");

  const jobTitle = job.split(/\r?\n/).map((l) => l.trim()).find(Boolean)?.slice(0, 80) || "Vaga sem título";
  return { score, label: labelFor(score), terms, found, missing, categories, suggestions: sug, optimized: optimize(cv, found), jobTitle };
}
