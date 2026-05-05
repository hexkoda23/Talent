import { useState } from "react";
import { GitBranch, GitCommit, Folder, FileCode, Plus, Upload, Star, GitPullRequest, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const repos = [
  { name: "rag-pipeline-quest", desc: "RAG quest submission", branch: "main", commits: 24, lang: "Python", updated: "2h ago" },
  { name: "sentiment-api", desc: "FastAPI sentiment service", branch: "main", commits: 17, lang: "Python", updated: "yesterday" },
  { name: "logbook-summaries", desc: "Auto SIWES weekly reports", branch: "dev", commits: 9, lang: "TypeScript", updated: "3d ago" },
];

const files = [
  { name: "src", type: "folder" },
  { name: "data", type: "folder" },
  { name: "tests", type: "folder" },
  { name: "README.md", type: "file" },
  { name: "requirements.txt", type: "file" },
  { name: "ingest.py", type: "file" },
  { name: "query.py", type: "file" },
  { name: "Dockerfile", type: "file" },
];

const commits = [
  { msg: "feat: add hybrid retrieval scorer", hash: "a3f9b2c", time: "2h ago", author: "you" },
  { msg: "fix: handle empty corpus", hash: "12de4a1", time: "5h ago", author: "you" },
  { msg: "chore: bump pinecone-client to 4.0", hash: "8c0f7e9", time: "yesterday", author: "you" },
  { msg: "docs: add architecture diagram", hash: "ee2d44b", time: "2d ago", author: "you" },
];

const Workspace = () => {
  const [active, setActive] = useState(repos[0]);

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-secondary mb-2">// talent nation workspace</p>
          <h1 className="font-display text-3xl lg:text-4xl font-bold">Your code. Your craft.</h1>
          <p className="text-muted-foreground mt-2">A built-in GitHub-style workspace. Submissions live here.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="soft" size="sm" className="gap-2"><Plus className="h-4 w-4" /> New repo</Button>
          <Button variant="hero" size="sm" className="gap-2"><Upload className="h-4 w-4" /> Push work</Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[280px,1fr] gap-5">
        {/* Repo list */}
        <div className="glass-panel rounded-2xl p-3 h-fit">
          <p className="px-3 py-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">Repositories</p>
          <div className="space-y-1">
            {repos.map((r) => (
              <button
                key={r.name}
                onClick={() => setActive(r)}
                className={cn(
                  "w-full text-left p-3 rounded-lg transition-colors",
                  active.name === r.name ? "bg-muted border border-border" : "hover:bg-muted/40"
                )}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <Folder className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium font-mono truncate">{r.name}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{r.desc}</p>
                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><GitBranch className="h-3 w-3" /> {r.branch}</span>
                  <span>{r.updated}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Repo view */}
        <div className="space-y-5 min-w-0">
          <div className="glass-panel rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <Folder className="h-5 w-5 text-primary flex-shrink-0" />
                <h2 className="font-display text-xl font-semibold font-mono truncate">{active.name}</h2>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="soft" size="sm" className="gap-1.5"><Star className="h-3.5 w-3.5" /> Star</Button>
                <Button variant="soft" size="sm" className="gap-1.5"><GitPullRequest className="h-3.5 w-3.5" /> PR</Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{active.desc}</p>
            <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><GitBranch className="h-3.5 w-3.5" /> {active.branch}</span>
              <span className="flex items-center gap-1"><GitCommit className="h-3.5 w-3.5" /> {active.commits} commits</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warning" /> {active.lang}</span>
            </div>
          </div>

          {/* File explorer + viewer */}
          <div className="grid md:grid-cols-[260px,1fr] gap-5">
            <div className="glass-panel rounded-2xl p-2">
              {files.map((f) => (
                <button key={f.name} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted/40 text-left">
                  {f.type === "folder" ? <Folder className="h-4 w-4 text-primary" /> : <FileCode className="h-4 w-4 text-muted-foreground" />}
                  <span className="font-mono truncate">{f.name}</span>
                </button>
              ))}
            </div>

            <div className="glass-panel rounded-2xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
                <span className="font-mono text-xs text-muted-foreground">src/ingest.py</span>
                <span className="font-mono text-xs text-muted-foreground">42 lines</span>
              </div>
              <pre className="p-4 text-xs font-mono leading-relaxed overflow-x-auto bg-background/40">
                <code>{`from pinecone import Pinecone
from openai import OpenAI

client = OpenAI()
pc = Pinecone(api_key=os.environ["PINECONE_API_KEY"])
index = pc.Index("talent-nation-rag")

def embed(texts: list[str]) -> list[list[float]]:
    out = client.embeddings.create(
        model="text-embedding-3-small",
        input=texts,
    )
    return [d.embedding for d in out.data]

def ingest(corpus: list[Doc]) -> int:
    vectors = embed([d.text for d in corpus])
    index.upsert([
        (d.id, v, {"title": d.title}) for d, v in zip(corpus, vectors)
    ])
    return len(corpus)`}</code>
              </pre>
            </div>
          </div>

          {/* Commits */}
          <div className="glass-panel rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold flex items-center gap-2"><History className="h-4 w-4" /> Commit history</h3>
              <span className="text-xs text-muted-foreground">{commits.length} recent</span>
            </div>
            <div className="space-y-2">
              {commits.map((c) => (
                <div key={c.hash} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/40">
                  <GitCommit className="h-4 w-4 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.msg}</p>
                    <p className="text-xs text-muted-foreground">{c.author} · {c.time}</p>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">{c.hash}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Workspace;
