import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/trust")({
  head: () => ({
    meta: [
      { title: "Confiança & Privacidade — Zelon" },
      {
        name: "description",
        content:
          "Como a Zelon trata segurança, privacidade e dados dos usuários do workspace.",
      },
      { property: "og:title", content: "Confiança & Privacidade — Zelon" },
      {
        property: "og:description",
        content:
          "Como a Zelon trata segurança, privacidade e dados dos usuários do workspace.",
      },
    ],
  }),
  component: TrustPage,
});

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card/50 p-6 backdrop-blur">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="mt-3 space-y-2 text-sm text-muted-foreground leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function TrustPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-3">
          <Link
            to="/"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ← Voltar para o app
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Confiança & Privacidade
          </h1>
          <p className="text-sm text-muted-foreground">
            Esta página é mantida pela equipe da Zelon para responder dúvidas
            comuns sobre segurança e privacidade do produto. Ela descreve
            controles atualmente habilitados no app e não constitui uma
            certificação independente.
          </p>
        </header>

        <div className="grid gap-4">
          <Section title="Autenticação & acesso">
            <p>
              Contas são protegidas por e-mail e senha gerenciados pelo nosso
              provedor de autenticação. Senhas nunca são armazenadas em texto
              puro pelo aplicativo. Sessões são tratadas via tokens emitidos
              pelo provedor e mantidas no navegador do usuário.
            </p>
            <p>
              Cada usuário acessa somente o próprio workspace — tarefas,
              projetos, clientes, anotações, agenda e eventos.
            </p>
          </Section>

          <Section title="Isolamento de dados (RLS)">
            <p>
              Todas as tabelas que armazenam dados de usuários (tarefas,
              projetos, clientes, anotações, eventos, notificações,
              perfis) usam Row-Level Security com regras vinculadas ao
              identificador do usuário autenticado. Um usuário não consegue ler
              nem modificar dados de outro.
            </p>
          </Section>

          <Section title="Transporte & armazenamento">
            <p>
              Todo o tráfego entre o navegador e o backend ocorre sobre HTTPS.
              O armazenamento de arquivos (por exemplo, avatares) é feito em um
              bucket gerenciado pelo provedor de backend.
            </p>
          </Section>

          <Section title="Dados que coletamos">
            <p>
              Coletamos apenas o necessário para operar o produto: e-mail, nome
              de exibição, telefone opcional e os conteúdos que você cria no
              workspace (tarefas, projetos, clientes, anotações, eventos).
            </p>
            <p>
              Não vendemos dados pessoais e não compartilhamos seu conteúdo
              com terceiros para fins de marketing.
            </p>
          </Section>

          <Section title="Subprocessadores">
            <p>
              O app é hospedado e operado com auxílio de provedores de
              infraestrutura (hospedagem, banco de dados, autenticação e
              armazenamento). Estes provedores processam dados estritamente
              para entregar o serviço.
            </p>
          </Section>

          <Section title="Exclusão & solicitações de privacidade">
            <p>
              Para solicitar exportação ou exclusão da sua conta e dos dados
              associados, entre em contato pelo canal de suporte do app. As
              solicitações são tratadas manualmente pela equipe.
            </p>
          </Section>

          <Section title="Contato de segurança">
            <p>
              Encontrou uma vulnerabilidade ou tem dúvidas sobre segurança?
              Entre em contato pelo canal de suporte do app descrevendo o
              comportamento observado. Pedimos que você não divulgue
              publicamente antes que tenhamos a chance de responder.
            </p>
          </Section>

          <Section title="Responsabilidade compartilhada">
            <p>
              A Zelon mantém o app e seus controles. Você é responsável por
              proteger sua senha, manter seu dispositivo seguro e revisar quem
              tem acesso ao seu workspace.
            </p>
          </Section>
        </div>

        <footer className="pt-4 text-xs text-muted-foreground">
          Conteúdo editável mantido pelo time da Zelon. Última revisão: junho
          de 2026.
        </footer>
      </div>
    </div>
  );
}
