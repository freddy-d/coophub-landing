import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import demoImg from "./prototipo.png";

// CoopHub Landing – App.tsx (TS)
// Alterações solicitadas:
// - Removido iFrame e qualquer estado/efeito relacionado
// - Removido link "Abrir em nova aba"
// - Adicionado uma imagem no lugar do iFrame + botão que leva a outro link

// Config de formulário
const SHEETS_WEBHOOK: string =
  (import.meta as any)?.env?.VITE_SHEETS_WEBHOOK ||
  "https://script.google.com/macros/s/AKfycbzUc_25VvcxebarxCVmZdiYCZiTkErNqkqwT5glmVZ2kL3Eibj_S_LqZPYyyILNODU/exec"; // URL do Apps Script /exec

// Alvos da “demo”
const DEMO_LINK = "https://coophub-app-demo.vercel.app/"; // <-- troque para onde o botão deve levar
const DEMO_IMG_SRC =
  "https://images.unsplash.com/photo-1553877522-43269d4ea984?q=80&w=1470&auto=format&fit=crop"; // <-- troque pela imagem do seu dashboard

const DEMO_IMG_SRC_PROT = demoImg;

// ===== Schema (Zod) =====
const AceitaVals = ["Sim", "Não"] as const;
const schema = z.object({
  nome: z.string().min(2, "Informe seu nome"),
  email: z.string().email("E-mail inválido"),
  porte: z.string().min(1, "Selecione o porte"),
  setor: z.string().min(1, "Informe o setor"),
  setorOutro: z.string().optional(),
  numCooperados: z.string().optional(),
  tempoImplantacao: z.string().min(1, "Selecione um prazo"),
  aceitaBeta: z.enum(AceitaVals, { message: "Selecione uma opção" }),
  faixaPreco: z.string().min(1, "Selecione uma faixa"),
  objetivos: z.array(z.string()).min(1, "Selecione ao menos um objetivo"),
  objetivoOutro: z.string().optional(),
  problemas: z.array(z.string()).min(1, "Selecione ao menos um problema"),
  problemaOutro: z.string().optional(),
  problemasLivre: z.string().optional(),
  modulos: z.array(z.string()).min(1, "Selecione ao menos um módulo"),
  integracoes: z.string().optional(),
  tentou: z.string().min(5, "Conte um pouco do que já tentou"),
  consent: z.boolean().refine((v) => v === true, {
    message: "É necessário aceitar o consentimento",
  }),
});

type FormValues = z.infer<typeof schema>;

type PillProps = {
  label: string;
  color?: "emerald" | "indigo";
  selected: string[];
  onToggle: (next: string[]) => void;
};

const Pill = ({ label, color = "emerald", selected, onToggle }: PillProps) => {
  const active = selected.includes(label);
  const toggle = () => {
    const next = active
      ? selected.filter((v) => v !== label)
      : [...selected, label];
    onToggle(next);
  };
  const colorCls =
    color === "emerald"
      ? active
        ? "border-emerald-500 bg-emerald-50"
        : "border-zinc-300 hover:bg-zinc-50"
      : active
      ? "border-indigo-500 bg-indigo-50"
      : "border-zinc-300 hover:bg-zinc-50";
  const iconCls = color === "emerald" ? "text-emerald-600" : "text-indigo-600";
  return (
    <button
      type="button"
      onClick={toggle}
      className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-colors ${colorCls}`}
    >
      <span className="text-sm md:text-base">{label}</span>
      {active ? (
        <Check className={`h-5 w-5 ${iconCls}`} />
      ) : (
        <span className="h-5 w-5 rounded-full border" />
      )}
    </button>
  );
};

export default function Landing() {
  const heroRef = useRef<HTMLDivElement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      objetivos: [],
      problemas: [],
      modulos: [],
      aceitaBeta: "Sim",
      consent: false,
    },
  });

  const porteOpts = ["Pequena (até 300)", "Média (300–1000)", "Grande (1000+)"];
  const setorOpts = [
    "Grãos",
    "Leite",
    "Frutas/Hortaliças",
    "Pecuária",
    "Mista",
    "Outro",
  ];
  const tempoOpts = ["1–3 meses", "3–6 meses", "> 6 meses"];
  const faixaOpts = [
    "Até R$ 49/mês",
    "R$ 50–99/mês",
    "R$ 100–199/mês",
    "R$ 200–399/mês",
    "R$ 400+/mês",
  ];
  const objetivosOpts = [
    "Operação mais estruturada",
    "Processos mais rápidos",
    "Relatórios automáticos",
    "Transparência para cooperados",
    "Integrações (ERP/contábil)",
  ];
  const problemasOpts = [
    "Retrabalho e planilhas paralelas",
    "Erros fiscais / notas rejeitadas",
    "Atrasos em recebimento/entrega",
    "Falta de visibilidade financeira",
    "Dificuldade em assembleias/votações",
    "Treinamento demorado da equipe",
  ];
  const modulosOpts = [
    "Cooperados / CRM",
    "Operações (agend./entregas)",
    "Fiscal & Financeiro",
    "Governança / Assembleias",
    "Assistência Técnica",
    "Logística / Romaneios",
    "App Mobile",
    "Integrações ERP/Contábil",
  ];

  const objetivosSel = (watch("objetivos") as string[]) || [];
  const problemasSel = (watch("problemas") as string[]) || [];
  const modulosSel = (watch("modulos") as string[]) || [];

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    setErrorMsg("");
    try {
      const payload: Record<string, any> = {
        ...data,
        setorOutro: data.setorOutro?.trim() || undefined,
        objetivoOutro: data.objetivoOutro?.trim() || undefined,
        problemaOutro: data.problemaOutro?.trim() || undefined,
        integracoes: data.integracoes?.trim() || undefined,
        problemasLivre: data.problemasLivre?.trim() || undefined,
        message: "Cadastro lista de espera CoopHub",
        name: data.nome,
        email: data.email,
        _source: "Landing CoopHub",
      };

      if (SHEETS_WEBHOOK) {
        const params = new URLSearchParams();
        const append = (k: string, v: unknown) => {
          if (Array.isArray(v))
            (v as unknown[]).forEach((item) => params.append(k, String(item)));
          else if (v !== undefined && v !== null) params.append(k, String(v));
          else params.append(k, "");
        };
        Object.entries(payload).forEach(([k, v]) => append(k, v as any));
        const res = await fetch(SHEETS_WEBHOOK, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          },
          body: params.toString(),
        });
        if (!res.ok) throw new Error("Falha no webhook do Sheets");
      } else {
        console.log(
          "[DEBUG] Defina VITE_SHEETS_WEBHOOK para enviar ao Google Sheets.",
          payload
        );
      }

      setSubmitted(true);
      reset({
        nome: "",
        email: "",
        porte: "",
        setor: "",
        setorOutro: "",
        numCooperados: "",
        tempoImplantacao: "",
        aceitaBeta: "Sim",
        faixaPreco: "",
        objetivos: [],
        objetivoOutro: "",
        problemas: [],
        problemaOutro: "",
        problemasLivre: "",
        modulos: [],
        integracoes: "",
        tentou: "",
        consent: false,
      });
    } catch (e: any) {
      setErrorMsg(
        e?.message ||
          "Não foi possível enviar agora. Tente novamente em instantes."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-zinc-50 to-white text-zinc-900">
      {/* Top bar (sem ícone) */}
      <header className="sticky top-0 z-40 backdrop-blur bg-white/70 border-b border-zinc-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-semibold">CoopHub</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a
              href="#demo"
              className="hover:text-emerald-600 transition-colors"
            >
              Protótipo
            </a>
            <a
              href="#inscricao"
              className="rounded-xl bg-emerald-600 text-white px-4 py-2 hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              Entrar na lista
              <ArrowRight className="h-4 w-4" />
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section ref={heroRef} className="relative overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-emerald-200/30 rounded-full blur-3xl" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="mt-4 text-4xl md:text-5xl font-bold leading-tight">
              Gestão de cooperativas{" "}
              <span className="text-emerald-700">simples</span>,
              <br className="hidden md:block" /> rápida e transparente.
            </h1>
            <p className="mt-4 text-lg text-zinc-700 max-w-xl">
              Centralize operações, financeiro, documentos e governança em um
              único hub. Menos retrabalho, mais resultado.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href="#inscricao"
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-white shadow-sm hover:bg-emerald-700 transition-colors"
              >
                Entrar na lista de espera <ArrowRight className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-3xl border bg-white p-4 shadow-sm">
              <img
                src={DEMO_IMG_SRC}
                alt="Dashboard preview"
                className="rounded-2xl object-cover aspect-[4/3] w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Demo (imagem + botão que leva a outro link) */}
      <section
        id="demo"
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16"
      >
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-2xl md:text-3xl font-semibold">Protótipo</h2>
          <a
            href={DEMO_LINK}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-white shadow-sm hover:bg-emerald-700 transition-colors"
          >
            Acessar Protótipo <ArrowRight className="h-5 w-5" />
          </a>
        </div>

        <div className="rounded-3xl border overflow-hidden bg-white">
          <img
            src={DEMO_IMG_SRC_PROT}
            alt="Protótipo CoopHub"
            className="w-full object-cover aspect-[16/9]"
          />
        </div>
      </section>
      {/* Formulário */}
      <section
        id="inscricao"
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16"
      >
        <div className="grid lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2">
            <h2 className="text-2xl md:text-3xl font-semibold">
              Entre na lista de espera
            </h2>
            <p className="mt-2 text-zinc-700">
              Ganhe prioridade, onboarding guiado e condições de early adopter.
            </p>
          </div>

          <div className="lg:col-span-3">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="rounded-3xl border bg-white p-6 md:p-8 space-y-8 shadow-sm"
            >
              {/* Identificação */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Nome</label>
                  <input
                    {...register("nome")}
                    className="mt-1 w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Seu nome"
                  />
                  {errors?.nome && (
                    <p className="mt-1 text-xs text-red-600">
                      {(errors as any).nome.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">E-mail</label>
                  <input
                    type="email"
                    {...register("email")}
                    className="mt-1 w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="voce@empresa.com"
                  />
                  {errors?.email && (
                    <p className="mt-1 text-xs text-red-600">
                      {(errors as any).email.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Perfil e contexto */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">
                    Porte da cooperativa
                  </label>
                  <select
                    {...register("porte")}
                    className="mt-1 w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="">Selecione</option>
                    {porteOpts.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  {errors?.porte && (
                    <p className="mt-1 text-xs text-red-600">
                      {(errors as any).porte.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">Setor principal</label>
                  <select
                    {...register("setor")}
                    className="mt-1 w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="">Selecione</option>
                    {setorOpts.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <input
                    {...register("setorOutro")}
                    className="mt-2 w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Se marcou 'Outro', qual?"
                  />
                  {errors?.setor && (
                    <p className="mt-1 text-xs text-red-600">
                      {(errors as any).setor.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">
                    Nº de cooperados (aprox)
                  </label>
                  <input
                    {...register("numCooperados")}
                    className="mt-1 w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="ex.: 350"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Tempo desejado para implementar
                  </label>
                  <select
                    {...register("tempoImplantacao")}
                    className="mt-1 w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="">Selecione</option>
                    {tempoOpts.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  {errors?.tempoImplantacao && (
                    <p className="mt-1 text-xs text-red-600">
                      {(errors as any).tempoImplantacao.message}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">
                  Aceitaria participar do beta com feedback quinzenal?
                </label>
                <div className="mt-2 flex gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      value="Sim"
                      {...register("aceitaBeta")}
                      className="h-4 w-4"
                    />{" "}
                    Sim
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      value="Não"
                      {...register("aceitaBeta")}
                      className="h-4 w-4"
                    />{" "}
                    Não
                  </label>
                </div>
                {errors?.aceitaBeta && (
                  <p className="mt-1 text-xs text-red-600">
                    {(errors as any).aceitaBeta.message}
                  </p>
                )}
              </div>

              {/* Valor percebido */}
              <div>
                <label className="text-sm font-medium">
                  Quanto estaria disposto a pagar (faixa de preço)?
                </label>
                <select
                  {...register("faixaPreco")}
                  className="mt-1 w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="">Selecione</option>
                  {faixaOpts.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
                {errors?.faixaPreco && (
                  <p className="mt-1 text-xs text-red-600">
                    {(errors as any).faixaPreco.message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">
                  O que você espera alcançar?
                </label>
                <div className="mt-2 grid md:grid-cols-2 gap-3">
                  {objetivosOpts.map((o) => (
                    <Pill
                      key={o}
                      label={o}
                      selected={objetivosSel}
                      onToggle={(next) =>
                        setValue("objetivos", next, { shouldValidate: true })
                      }
                    />
                  ))}
                </div>
                <input
                  {...register("objetivoOutro")}
                  className="mt-3 w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Outro (opcional)"
                />
                {errors?.objetivos && (
                  <p className="mt-1 text-xs text-red-600">
                    {(errors as any).objetivos.message}
                  </p>
                )}
              </div>

              {/* Problemas */}
              <div>
                <label className="text-sm font-medium">
                  Quais problemas quer evitar?
                </label>
                <div className="mt-2 grid md:grid-cols-2 gap-3">
                  {problemasOpts.map((p) => (
                    <Pill
                      key={p}
                      label={p}
                      color="indigo"
                      selected={problemasSel}
                      onToggle={(next) =>
                        setValue("problemas", next, { shouldValidate: true })
                      }
                    />
                  ))}
                </div>
                <input
                  {...register("problemaOutro")}
                  className="mt-3 w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Outro (opcional)"
                />
                <textarea
                  {...register("problemasLivre")}
                  rows={3}
                  className="mt-3 w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Conte detalhes dos problemas que quer evitar (opcional)"
                />
                {errors?.problemas && (
                  <p className="mt-1 text-xs text-red-600">
                    {(errors as any).problemas.message}
                  </p>
                )}
              </div>

              {/* Módulos e integrações */}
              <div>
                <label className="text-sm font-medium">
                  Quais módulos têm mais interesse?
                </label>
                <div className="mt-2 grid md:grid-cols-2 gap-3">
                  {modulosOpts.map((m) => (
                    <Pill
                      key={m}
                      label={m}
                      selected={modulosSel}
                      onToggle={(next) =>
                        setValue("modulos", next, { shouldValidate: true })
                      }
                    />
                  ))}
                </div>
                {errors?.modulos && (
                  <p className="mt-1 text-xs text-red-600">
                    {(errors as any).modulos.message}
                  </p>
                )}
                <input
                  {...register("integracoes")}
                  className="mt-3 w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Integrações necessárias (ERP/contábil, etc.)"
                />
              </div>

              {/* Experiência anterior */}
              <div>
                <label className="text-sm font-medium">
                  O que você já tentou e não funcionou?
                </label>
                <textarea
                  {...register("tentou")}
                  rows={4}
                  className="mt-1 w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Conte rapidamente sua experiência"
                />
                {errors?.tentou && (
                  <p className="mt-1 text-xs text-red-600">
                    {(errors as any).tentou.message}
                  </p>
                )}
              </div>

              {/* Consentimento */}
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  {...register("consent")}
                  className="mt-1 h-5 w-5 rounded border"
                />
                <span>
                  Concordo em receber comunicações sobre atualizações, materiais
                  informativos e convites relacionados ao produto.
                  <span className="block text-zinc-500">
                    Você pode revogar o consentimento quando quiser.
                  </span>
                </span>
              </label>
              {errors?.consent && (
                <p className="-mt-3 text-xs text-red-600">
                  {(errors as any).consent.message}
                </p>
              )}

              {/* Botão + mensagens */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-emerald-600 text-white py-3 font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" /> Enviando...
                  </>
                ) : (
                  <>
                    Entrar na lista de espera <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>

              {submitted && (
                <div className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-emerald-800 text-sm text-center">
                  Inscrição enviada com sucesso! Em breve entraremos em contato.
                </div>
              )}
              {!!errorMsg && (
                <div className="mt-3 rounded-xl border border-red-300 bg-red-50 p-3 text-red-700 text-sm text-center">
                  Ops, algo deu errado: {errorMsg}
                </div>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* Footer + LGPD */}
      <footer className="border-t">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 grid md:grid-cols-3 gap-6">
          <div>
            <div className="font-semibold">CoopHub</div>
            <p className="mt-2 text-sm text-zinc-600">
              O hub que organiza as operações da sua cooperativa.
            </p>
          </div>
          <div className="text-sm">
            <div className="font-medium">Contato</div>
            <ul className="mt-2 space-y-1">
              <li>
                <a
                  className="hover:text-emerald-700"
                  href="mailto:contato@coophub.app"
                >
                  contato@coophub.app
                </a>
              </li>
              <li>
                <a
                  className="hover:text-emerald-700"
                  href="https://wa.me/5500000000000"
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp
                </a>
              </li>
              <li>
                <a className="hover:text-emerald-700" href="#demo">
                  Protótipo
                </a>
              </li>
            </ul>
          </div>
          <div className="text-sm">
            <div className="font-medium">Links úteis</div>
            <ul className="mt-2 space-y-1">
              <li>
                <a className="hover:text-emerald-700" href="#inscricao">
                  Lista de espera
                </a>
              </li>
              <li>
                <a className="hover:text-emerald-700" href="#lgpd">
                  LGPD
                </a>
              </li>
              <li>
                <a className="hover:text-emerald-700" href="#">
                  Termos
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="py-6 text-center text-xs text-zinc-500">
          © {new Date().getFullYear()} CoopHub. Todos os direitos reservados.
        </div>

        {/* LGPD */}
        <section id="lgpd" className="border-t bg-zinc-50/70">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 text-sm text-zinc-700 space-y-3">
            <h4 className="font-medium">Aviso de Privacidade (LGPD)</h4>
            <p>
              <strong>Controlador:</strong> CoopHub — contato:{" "}
              <a href="mailto:contato@coophub.app" className="underline">
                contato@coophub.app
              </a>
              . Encarregado (DPO):{" "}
              <a href="mailto:dpo@coophub.app" className="underline">
                dpo@coophub.app
              </a>
              .
            </p>
            <p>
              <strong>Finalidades:</strong> gerenciar a lista de espera,
              contatar interessados, organizar entrevistas de descoberta e
              comunicar atualizações do produto.
            </p>
            <p>
              <strong>Bases legais:</strong> consentimento do titular (art. 7º,
              I) e procedimentos preliminares a contrato a pedido do titular
              (art. 7º, V).
            </p>
            <p>
              <strong>Direitos do titular:</strong> confirmação do tratamento,
              acesso, correção, portabilidade, anonimização/eliminação,
              informação sobre compartilhamento, revogação do consentimento e
              oposição. Para exercer, escreva para{" "}
              <a href="mailto:dpo@coophub.app" className="underline">
                dpo@coophub.app
              </a>
              .
            </p>
            <p>
              <strong>Compartilhamento e transferências internacionais:</strong>{" "}
              podemos utilizar operadores (ex.: provedores de formulários,
              e-mail e analytics) que tratam dados em nosso nome, inclusive fora
              do Brasil, com salvaguardas contratuais adequadas.
            </p>
            <p>
              <strong>Retenção:</strong> manteremos os dados pelo tempo
              necessário às finalidades acima ou até a revogação do
              consentimento, o que ocorrer primeiro.
            </p>
            <p>
              <strong>Segurança:</strong> adotamos medidas técnicas e
              organizacionais para proteger os dados. Saiba mais na nossa
              política resumida.
            </p>
            <p>
              <strong>Revogação de consentimento:</strong> você pode revogar a
              qualquer momento enviando um e-mail para{" "}
              <a href="mailto:dpo@coophub.app" className="underline">
                dpo@coophub.app
              </a>{" "}
              com o assunto “Revogar consentimento”.
            </p>
            <p className="text-xs text-zinc-500">
              Lei nº 13.709/2018 (LGPD) — jurisdição Brasil.
            </p>
          </div>
        </section>
      </footer>
    </main>
  );
}
