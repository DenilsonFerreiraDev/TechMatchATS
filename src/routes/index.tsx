import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { analyze, type Analysis } from "@/lib/ats";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TechMatch ATS — Otimize seu currículo" },
      { name: "description", content: "Compare seu currículo com a vaga, veja seu ATS Score e gere uma versão otimizada sem inventar informações." },
      { property: "og:title", content: "TechMatch ATS — Otimize seu currículo" },
      { property: "og:description", content: "Análise ATS gratuita: palavras-chave, compatibilidade e currículo otimizado." },
    ],
  }),
  component: Index,
});

type Hist = { date: string; score: number; job: string };
const KEY = "techmatch-history";

const card = "rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6";

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
    setTimeout(() => document.getElementById("resultado")?.focus(), 50);
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
    w.document.write(`<html><head><title>Curriculo ATS</title><style>body{font-family:Arial,sans-serif;font-size:12px;line-height:1.5;padding:32px;white-space:pre-wrap}</style></head><body>${safe}</body></html>`);
    w.document.close();
    w.focus();
    w.print();
  };

  const scoreColor = res ? (res.score >= 70 ? "text-success" : res.score >= 50 ? "text-warning" : "text-destructive") : "";

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-br from-primary-deep to-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">TechMatch ATS</h1>
          <p className="mt-2 text-lg opacity-90">Otimize seu currículo para passar pelos sistemas ATS.</p>
          <div role="note" className="mt-6 flex gap-3 rounded-lg border border-primary-foreground/30 bg-primary-foreground/10 p-4 text-sm sm:text-base">
            <span aria-hidden="true" className="text-xl">🛡️</span>
            <p><strong>Importante:</strong> A ferramenta não inventa experiências profissionais. Todas as recomendações são baseadas apenas nas informações fornecidas pelo usuário.</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <section className={card} aria-labelledby="entrada">
          <h2 id="entrada" className="sr-only">Dados para análise</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="job" className="mb-2 block font-semibold text-foreground">Descrição da vaga</label>
              <textarea id="job" value={job} onChange={(e) => setJob(e.target.value)} rows={14}
                placeholder="Cole aqui a descrição completa da vaga (a primeira linha será usada como nome da vaga)…"
                className="w-full rounded-lg border border-input bg-background p-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label htmlFor="cv" className="mb-2 block font-semibold text-foreground">Currículo</label>
              <textarea id="cv" value={cv} onChange={(e) => setCv(e.target.value)} rows={14}
                placeholder="Cole aqui o texto do seu currículo…"
                className="w-full rounded-lg border border-input bg-background p-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <button onClick={run} disabled={!job.trim() || !cv.trim()}
            className="mt-6 w-full rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-sm transition hover:bg-primary-deep focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
            Analisar Currículo
          </button>
        </section>

        {res && (
          <section id="resultado" tabIndex={-1} aria-label="Resultado da análise" className="space-y-6 focus:outline-none">
            <div className="grid gap-6 md:grid-cols-3">
              <div className={`${card} text-center`}>
                <h2 className="font-semibold text-muted-foreground">ATS Score</h2>
                <p className={`mt-2 text-6xl font-bold ${scoreColor}`}>{res.score}</p>
                <p className="text-sm text-muted-foreground">de 100</p>
                <span className={`mt-3 inline-block rounded-full bg-muted px-3 py-1 text-sm font-semibold ${scoreColor}`}>{res.label}</span>
              </div>
              <div className={`${card} md:col-span-2`}>
                <h2 className="mb-4 font-semibold text-foreground">Compatibilidade</h2>
                <div className="space-y-4">
                  {res.categories.map((c) => (
                    <div key={c.name}>
                      <div className="mb-1 flex justify-between text-sm"><span>{c.name}</span><span className="font-medium">{c.value}%</span></div>
                      <div role="progressbar" aria-label={c.name} aria-valuenow={c.value} aria-valuemin={0} aria-valuemax={100} className="h-2.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${c.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className={card}>
                <h2 className="mb-3 font-semibold text-foreground">Palavras-chave encontradas ({res.found.length})</h2>
                <div className="flex flex-wrap gap-2">
                  {res.found.length ? res.found.map((k) => <span key={k} className="rounded-full bg-success-soft px-3 py-1 text-sm font-medium text-success">{k}</span>)
                    : <p className="text-sm text-muted-foreground">Nenhuma palavra-chave da vaga encontrada.</p>}
                </div>
              </div>
              <div className={card}>
                <h2 className="mb-3 font-semibold text-foreground">Palavras-chave faltantes ({res.missing.length})</h2>
                <div className="flex flex-wrap gap-2">
                  {res.missing.length ? res.missing.map((k) => <span key={k} className="rounded-full bg-destructive-soft px-3 py-1 text-sm font-medium text-destructive">{k}</span>)
                    : <p className="text-sm text-muted-foreground">Nenhuma faltante. Ótimo!</p>}
                </div>
              </div>
            </div>

            <div className={card}>
              <h2 className="mb-3 font-semibold text-foreground">Sugestões</h2>
              <ul className="list-disc space-y-2 pl-5 text-sm">
                {res.suggestions.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>

            <div className={card}>
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="font-semibold text-foreground">Currículo otimizado (ATS Friendly)</h2>
                <div className="flex gap-2">
                  <button onClick={copy} className="rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring">
                    {copied ? "Copiado!" : "Copiar texto"}
                  </button>
                  <button onClick={pdf} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-deep focus:outline-none focus:ring-2 focus:ring-ring">
                    Exportar PDF
                  </button>
                </div>
              </div>
              <label htmlFor="opt" className="sr-only">Currículo otimizado</label>
              <textarea id="opt" readOnly value={res.optimized} rows={18}
                className="w-full rounded-lg border border-input bg-muted p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              <p className="mt-2 text-xs text-muted-foreground">Apenas reorganização e formatação — nenhuma informação nova foi adicionada.</p>
            </div>
          </section>
        )}

        <section className={card} aria-labelledby="hist">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="hist" className="font-semibold text-foreground">Histórico de análises</h2>
            {hist.length > 0 && (
              <button onClick={() => { setHist([]); localStorage.removeItem(KEY); }} className="text-sm text-muted-foreground underline hover:text-foreground">Limpar</button>
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
                  <span className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-primary">{h.score}</span>
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
