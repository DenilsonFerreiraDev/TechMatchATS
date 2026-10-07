const HARD = ["gestão de projetos","análise de dados","scrum","kanban","agile","ágil","devops","ci/cd","microsserviços","microservices","apis rest","rest","testes automatizados","tdd","arquitetura","cloud","segurança","machine learning","etl","bi","power bi","excel","inglês","espanhol","suporte técnico","infraestrutura","redes","banco de dados","modelagem de dados","ux","ui"];
const SOFT = ["comunicação","liderança","trabalho em equipe","proatividade","organização","resolução de problemas","negociação","criatividade","adaptabilidade","pensamento crítico","autonomia","colaboração","empatia","gestão de tempo"];
const TECH = ["javascript","typescript","react","angular","vue","node","node.js","python","java","c#",".net","go","php","ruby","kotlin","swift","sql","postgresql","mysql","mongodb","redis","aws","azure","gcp","docker","kubernetes","terraform","git","linux","graphql","next.js","tailwind","spark","kafka","jenkins","github actions","sap","salesforce","figma","jira"];
const CERT = ["aws certified","azure fundamentals","az-900","az-104","az-204","pmp","itil","cobit","scrum master","csm","psm","cissp","comptia","ccna","lpi","togaf","six sigma","ocp","google cloud certified"];

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const has = (text: string, k: string) =>
  new RegExp(`(^|[^a-z0-9à-ú])${esc(k)}($|[^a-z0-9à-ú])`, "i").test(text);

export type Analysis = {
  score: number;
  label: "Excelente" | "Bom" | "Regular" | "Baixo";
  found: string[];
  missing: string[];
  categories: { name: string; value: number }[];
  suggestions: string[];
  optimized: string;
  jobTitle: string;
};

function cat(job: string, cv: string, list: string[]) {
  const req = list.filter((k) => has(job, k));
  const ok = req.filter((k) => has(cv, k));
  return { req, ok, pct: req.length ? Math.round((ok.length / req.length) * 100) : 100 };
}

const HEADINGS: [RegExp, string][] = [
  [/^(resumo|sobre|perfil|objetivo|summary|profile)/i, "RESUMO PROFISSIONAL"],
  [/^(experi[eê]ncia|hist[oó]rico profissional|experience)/i, "EXPERIÊNCIA PROFISSIONAL"],
  [/^(forma[cç][aã]o|educa[cç][aã]o|escolaridade|education)/i, "FORMAÇÃO ACADÊMICA"],
  [/^(habilidades|compet[eê]ncias|skills|conhecimentos|tecnologias)/i, "COMPETÊNCIAS"],
  [/^(certifica[cç](ões|oes|ão)|certifications|cursos)/i, "CERTIFICAÇÕES E CURSOS"],
  [/^(idiomas|languages)/i, "IDIOMAS"],
  [/^(projetos|projects)/i, "PROJETOS"],
  [/^(contato|contact|dados pessoais)/i, "CONTATO"],
];

function optimize(cv: string, found: string[]) {
  const lines = cv.split(/\r?\n/).map((l) => l.trim());
  const out: string[] = [];
  for (const raw of lines) {
    if (!raw) { if (out[out.length - 1] !== "") out.push(""); continue; }
    const clean = raw.replace(/[:：]\s*$/, "");
    const h = HEADINGS.find(([r]) => r.test(clean) && clean.length < 40);
    if (h) { if (out.length && out[out.length - 1] !== "") out.push(""); out.push(h[1]); continue; }
    let l = raw.replace(/^[•\-*–·●▪]\s*/, "• ");
    l = l.replace(/\s{2,}/g, " ");
    if (l.startsWith("• ")) l = "• " + l.charAt(2).toUpperCase() + l.slice(3);
    out.push(l);
  }
  let text = out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  if (found.length) text += `\n\nPALAVRAS-CHAVE (presentes no currículo)\n${found.join(" | ")}`;
  return text;
}

export function analyze(job: string, cv: string): Analysis {
  const h = cat(job, cv, HARD), s = cat(job, cv, SOFT), t = cat(job, cv, TECH), c = cat(job, cv, CERT);
  const allReq = [...h.req, ...s.req, ...t.req, ...c.req];
  const found = [...h.ok, ...s.ok, ...t.ok, ...c.ok];
  const missing = allReq.filter((k) => !found.includes(k));
  const base = allReq.length ? (found.length / allReq.length) * 100 : 50;
  const score = Math.round(Math.min(100, base * 0.6 + t.pct * 0.2 + h.pct * 0.1 + s.pct * 0.05 + c.pct * 0.05));
  const label = score >= 85 ? "Excelente" : score >= 70 ? "Bom" : score >= 50 ? "Regular" : "Baixo";
  const sug: string[] = [];
  t.ok.slice(0, 3).forEach((k) => sug.push(`Destacar experiência com ${k} logo no resumo profissional.`));
  if (c.ok.length) sug.push("Mover certificações para uma seção mais acima no currículo.");
  if (found.length) sug.push("Utilizar as palavras-chave da vaga já presentes no currículo nos títulos e descrições de experiências.");
  if (!/resumo|perfil|objetivo|summary/i.test(cv)) sug.push("Adicionar um resumo profissional com base nas experiências já descritas.");
  if (!/\d/.test(cv)) sug.push("Quantificar resultados já obtidos (números, prazos, percentuais), se existirem.");
  if (missing.length) sug.push(`Se você realmente possui: ${missing.slice(0, 5).join(", ")} — inclua no currículo. Caso contrário, não adicione.`);
  sug.push("Evitar tabelas, colunas e imagens; use títulos de seção padrão.");
  const jobTitle = job.split(/\r?\n/).map((l) => l.trim()).find(Boolean)?.slice(0, 80) || "Vaga sem título";
  return {
    score, label, found, missing, suggestions: sug, jobTitle,
    categories: [
      { name: "Hard Skills", value: h.pct }, { name: "Soft Skills", value: s.pct },
      { name: "Tecnologias", value: t.pct }, { name: "Certificações", value: c.pct },
    ],
    optimized: optimize(cv, found),
  };
}
