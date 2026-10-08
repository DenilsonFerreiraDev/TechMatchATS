import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  ShieldCheck, FileText, Briefcase, Sparkles, Target, CheckCircle2, XCircle, Percent,
  Lightbulb, Copy, Check, FileDown, History, Trash2, Hash, BarChart3, Tags, Wand2,
} from "lucide-react";
import { analyze, labelFor, type Analysis } from "@/lib/ats";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TechMatch ATS — Otimize seu currículo" },
      { name: "description", content: "Compare seu currículo com a vaga, veja seu ATS Score e gere uma versão otimizada sem inventar informações." },
      { property: "og:title", content: "TechMatch ATS — Otimize seu currículo" },
      { property: "og:description", content: "Análise ATS: palavras-chave, diagnóstico, compatibilidade e currículo otimizado." },
    ],
  }),
  component: Index,
});

type Hist = { date: string; score: number; job: string };
const KEY = "techmatch-history";
const card = "rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6";
const enter = "animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both";

function tone(score: number) {
  const l = labelFor(score);
  return l === "Excelente" ? { text: "text-success", stroke: "stroke-success", bg: "bg-success" }
    : l === "Bom" ? { text: "text-primary", stroke: "stroke-primary", bg: "bg-primary" }
    : l === "Regular" ? { text: "text-warning", stroke: "stroke-warning", bg: "bg-warning" }
    : { text: "text-destructive", stroke: "stroke-destructive", bg: "bg-destructive" };
}

function ScoreRing({ score }: { score: number }) {
  const [v, setV] = useState(0);
  useEffect(() => { const t = setTimeout(() => setV(score), 80); return () => clearTimeout(t); }, [score]);
  const r = 54, c = 2 * Math.PI * r, t = tone(score);
  return (
    <div className="relative mx-auto h-44 w-44" role="img" aria-label={`ATS Score ${score} de 100, ${labelFor(score)}`}>
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" strokeWidth="10" className="stroke-muted" />
        <circle cx="64" cy="64" r={r} fill="none" strokeWidth="10" strokeLinecap="round"
          className={`${t.stroke} transition-[stroke-dashoffset] duration-1000 ease-out`}
          strokeDasharray={c} strokeDashoffset={c - (v / 100) * c} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-bold ${t.text}`}>{score}%</span>
        <span className={`mt-1 text-sm font-semibold ${t.text}`}>{labelFor(score)}</span>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, tint }: { icon: ReactNode; label: string; value: string | number; tint: string }) {
  return (
    <div className={`${card} flex items-center gap-4 p-4 sm:p-5`}>
      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tint}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-none text-foreground">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{label}</p>
      </div>
    </div>
  );
}

function Title({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return <h2 className="mb-4 flex items-center gap-2 font-semibold text-foreground"><span className="text-primary">{icon}</span>{children}</h2>;
}

function Index() {
  const [job, setJob] = useState("");
  const [cv, setCv] = useState("");
  const [res, setRes] = useState<Analysis | null>(null);
  const [hist, setHist] = useState<Hist[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try { setHist(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch { /* ignore */ }
  }, []);

  const run = () => {
    const r = analyze(job, cv);
    setRes(r);
    const h = [{ date: new Date().toLocaleString("pt-BR"), score: r.score, job: r.jobTitle }, ...hist].slice(0, 10);
    setHist(h);
    localStorage.setItem(KEY, JSON.stringify(h));
    setTimeout(() => { const el = document.getElementById("resultado"); el?.focus(); el?.scrollIntoView({ behavior: "smooth" }); }, 50);
  };

  const copy = async () => {
    if (!res) return;
    await navigator.clipboard.writeText(res.optimized);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pdf = () => {
    if (!res) return;
    const w = window.open("", "_blank");
    if (!w) return;
    const safe = res.optimized.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    w.document.write(`<html><head><title>Curriculo ATS</title><style>body{font-family:Arial,sans-serif;font-size:12px;line-height:1.55;padding:32px;white-space:pre-wrap}</style></head><body>${safe}</body></html>`);
    w.document.close();
    w.focus();
    w.print();
  };

  const adherence = res && res.terms.length ? Math.round((res.found.length / res.terms.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="relative overflow-hidden bg-gradient-to-br from-primary-deep to-primary text-primary-foreground">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary-foreground/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-10 sm:py-14">
          <div className={`flex items-center gap-3 ${enter}`}>
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-foreground/15"><Target className="h-6 w-6" aria-hidden /></div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">TechMatch ATS</h1>
          </div>
          <p className={`mt-3 text-lg opacity-90 ${enter}`}>Otimize seu currículo para passar pelos sistemas ATS.</p>
          <div role="note" className={`mt-6 flex gap-3 rounded-xl border border-primary-foreground/30 bg-primary-foreground/10 p-4 text-sm backdrop-blur sm:text-base ${enter}`}>
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <p><strong>Regra obrigatória:</strong> Esta ferramenta não inventa experiências, certificações, habilidades ou conhecimentos. Todas as recomendações são baseadas exclusivamente nas informações fornecidas pelo usuário.</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <section className={`${card} ${enter}`} aria-labelledby="entrada">
          <h2 id="entrada" className="sr-only">Dados para análise</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {[
              { id: "job", label: "Descrição da vaga", icon: <Briefcase className="h-4 w-4" />, v: job, set: setJob, ph: "Cole a descrição completa da vaga (a primeira linha será usada como nome da vaga)…" },
              { id: "cv", label: "Currículo", icon: <FileText className="h-4 w-4" />, v: cv, set: setCv, ph: "Cole aqui o texto do seu currículo…" },
            ].map((f) => (
              <div key={f.id}>
                <label htmlFor={f.id} className="mb-2 flex items-center gap-2 font-semibold text-foreground">
                  <span className="text-primary" aria-hidden>{f.icon}</span>{f.label}
                </label>
                <textarea id={f.id} value={f.v} onChange={(e) => f.set(e.target.value)} rows={14} placeholder={f.ph}
                  className="w-full resize-y rounded-xl border border-input bg-background p-3 text-sm transition placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40" />
                <p className="mt-1 text-right text-xs text-muted-foreground">{f.v.length} caracteres</p>
              </div>
            ))}
          </div>
          <button onClick={run} disabled={!job.trim() || !cv.trim()}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:bg-primary-deep hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 active:translate-y-0 disabled:pointer-events-none disabled:opacity-50 sm:w-auto">
            <Sparkles className="h-4 w-4" aria-hidden /> Analisar Currículo
          </button>
        </section>

        {res && (
          <section id="resultado" key={res.optimized + res.score} tabIndex={-1} aria-label="Resultado da análise" className="scroll-mt-4 space-y-8 focus:outline-none">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className={`${card} ${enter} flex flex-col items-center justify-center text-center`}>
                <h2 className="mb-3 font-semibold text-muted-foreground">ATS Score</h2>
                <ScoreRing score={res.score} />
                <p className="mt-3 text-xs text-muted-foreground">0–39 Baixo · 40–59 Regular · 60–79 Bom · 80–100 Excelente</p>
              </div>
              <div className={`${card} ${enter} delay-100 lg:col-span-2`}>
                <Title icon={<BarChart3 className="h-5 w-5" />}>Compatibilidade</Title>
                <div className="space-y-4">
                  {res.categories.map((c) => (
                    <div key={c.name}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span>{c.name}</span>
                        <span className="font-medium">{c.total ? `${c.value}%` : "não exigido"}</span>
                      </div>
                      <div role="progressbar" aria-label={c.name} aria-valuenow={c.value} aria-valuemin={0} aria-valuemax={100} className="h-2.5 overflow-hidden rounded-full bg-muted">
                        <div className={`h-full rounded-full ${tone(c.value).bg} transition-all duration-1000 ease-out`} style={{ width: c.total ? `${c.value}%` : "0%" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={enter}>
              <Title icon={<Target className="h-5 w-5" />}>Diagnóstico ATS</Title>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                <Stat icon={<Hash className="h-5 w-5 text-primary" />} tint="bg-secondary" label="Palavras-chave identificadas" value={res.terms.length} />
                <Stat icon={<CheckCircle2 className="h-5 w-5 text-success" />} tint="bg-success-soft" label="Correspondentes" value={res.found.length} />
                <Stat icon={<XCircle className="h-5 w-5 text-destructive" />} tint="bg-destructive-soft" label="Faltantes" value={res.missing.length} />
                <Stat icon={<Percent className="h-5 w-5 text-primary" />} tint="bg-secondary" label="Aderência" value={`${adherence}%`} />
                <Stat icon={<Lightbulb className="h-5 w-5 text-warning" />} tint="bg-warning-soft" label="Recomendações" value={res.suggestions.length} />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className={`${card} ${enter}`}>
                <Title icon={<CheckCircle2 className="h-5 w-5 text-success" />}>Palavras-chave encontradas ({res.found.length})</Title>
                <div className="flex flex-wrap gap-2">
                  {res.found.length ? res.found.map((k) => (
                    <span key={k.term} title={k.category} className="inline-flex items-center gap-1 rounded-full bg-success-soft px-3 py-1 text-sm font-medium text-success">
                      <Check className="h-3.5 w-3.5" aria-hidden />{k.term}
                    </span>
                  )) : <p className="text-sm text-muted-foreground">Nenhuma palavra-chave da vaga encontrada.</p>}
                </div>
              </div>
              <div className={`${card} ${enter} delay-100`}>
                <Title icon={<XCircle className="h-5 w-5 text-destructive" />}>Palavras-chave faltantes ({res.missing.length})</Title>
                <div className="flex flex-wrap gap-2">
                  {res.missing.length ? res.missing.map((k) => (
                    <span key={k.term} title={k.category} className="rounded-full bg-destructive-soft px-3 py-1 text-sm font-medium text-destructive">{k.term}</span>
                  )) : <p className="text-sm text-muted-foreground">Nenhuma faltante. Ótimo!</p>}
                </div>
              </div>
            </div>

            <div className={`${card} ${enter}`}>
              <Title icon={<Tags className="h-5 w-5" />}>Termos da vaga por categoria</Title>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {res.categories.map((c) => {
                  const items = res.terms.filter((t) => t.category === c.name);
                  return (
                    <div key={c.name} className="rounded-xl bg-muted/60 p-3">
                      <p className="mb-2 text-sm font-semibold">{c.name}</p>
                      {items.length ? (
                        <ul className="space-y-1 text-sm">
                          {items.map((t) => (
                            <li key={t.term} className="flex items-start gap-1.5">
                              {t.found ? <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" aria-label="encontrado" /> : <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" aria-label="faltante" />}
                              <span className="min-w-0 break-words">{t.term}</span>
                            </li>
                          ))}
                        </ul>
                      ) : <p className="text-xs text-muted-foreground">Nenhum termo identificado.</p>}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={`${card} ${enter}`}>
              <Title icon={<Lightbulb className="h-5 w-5" />}>Sugestões</Title>
              <ul className="space-y-3">
                {res.suggestions.map((s, i) => (
                  <li key={i} className="flex gap-3 rounded-xl border border-border p-3 text-sm transition hover:border-primary/40 hover:bg-secondary/40">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold text-primary">{i + 1}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className={`${card} ${enter}`}>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="flex items-center gap-2 font-semibold text-foreground"><Wand2 className="h-5 w-5 text-primary" aria-hidden />Currículo otimizado (ATS Friendly)</h2>
                <div className="flex gap-2">
                  <button onClick={copy} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-input px-4 py-2 text-sm font-medium transition hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring sm:flex-none">
                    {copied ? <Check className="h-4 w-4 text-success" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}{copied ? "Copiado!" : "Copiar texto"}
                  </button>
                  <button onClick={pdf} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary-deep focus:outline-none focus:ring-2 focus:ring-ring sm:flex-none">
                    <FileDown className="h-4 w-4" aria-hidden />Exportar PDF
                  </button>
                </div>
              </div>
              <label htmlFor="opt" className="sr-only">Currículo otimizado</label>
              <textarea id="opt" readOnly value={res.optimized} rows={20}
                className="w-full rounded-xl border border-input bg-muted/60 p-4 font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring" />
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5" aria-hidden />Somente reorganização e formatação — nenhuma informação nova foi adicionada.</p>
            </div>
          </section>
        )}

        <section className={`${card} ${enter}`} aria-labelledby="hist">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="hist" className="flex items-center gap-2 font-semibold text-foreground"><History className="h-5 w-5 text-primary" aria-hidden />Histórico de análises</h2>
            {hist.length > 0 && (
              <button onClick={() => { setHist([]); localStorage.removeItem(KEY); }} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground">
                <Trash2 className="h-4 w-4" aria-hidden />Limpar
              </button>
            )}
          </div>
          {hist.length ? (
            <ul className="divide-y divide-border">
              {hist.map((h, i) => (
                <li key={i} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{h.job}</p>
                    <p className="text-xs text-muted-foreground">{h.date}</p>
                  </div>
                  <span className={`rounded-full bg-muted px-3 py-1 text-sm font-semibold ${tone(h.score).text}`}>{h.score}%</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">Nenhuma análise salva ainda.</p>}
        </section>
      </main>
      <footer className="py-6 text-center text-xs text-muted-foreground">TechMatch ATS · Seus dados ficam apenas no seu navegador.</footer>
    </div>
  );
}
