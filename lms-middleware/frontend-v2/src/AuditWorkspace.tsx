import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import {
  CheckCircle2,
  CheckSquare,
  Clock,
  Code2,
  FileCode2,
  FileText,
  Hash,
  ShieldCheck,
  Terminal,
  XCircle,
} from 'lucide-react';
import { useAuth } from './AuthContext.tsx';
import './QuestWorkspace.css';
import './AuditWorkspace.css';

interface AuditChecklistItem {
  id: string;
  text: string;
}

interface AuditSession {
  id: number;
  auditee: string;
  auditor: string;
  quest_id: string;
  exercise_id: string;
  repo_url: string;
  status: string;
  expires_at: string;
}

interface CodeEntry {
  name: string;
  path: string;
  type: 'file' | 'dir';
}

interface TerminalEvent {
  actor: string;
  command: string;
  output: string;
  at: string;
}

export default function AuditWorkspace() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const socketRef = useRef<Socket | null>(null);

  const [session, setSession] = useState<AuditSession | null>(null);
  const [checklist, setChecklist] = useState<AuditChecklistItem[]>([]);
  const [entries, setEntries] = useState<CodeEntry[]>([]);
  const [activePath, setActivePath] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState('');
  const [terminalEvents, setTerminalEvents] = useState<TerminalEvent[]>([]);
  const [demoCommand, setDemoCommand] = useState('python tests/run_tests.py');
  const [demoOutput, setDemoOutput] = useState('');
  const [error, setError] = useState('');
  const [terminalStatus, setTerminalStatus] = useState('Connecting live audit...');

  const allAnswered = checklist.length > 0 && checklist.every((item) => typeof answers[item.id] === 'boolean');
  const remainingMinutes = useMemo(() => {
    if (!session?.expires_at) return 0;
    return Math.max(0, Math.ceil((new Date(session.expires_at).getTime() - Date.now()) / 60000));
  }, [session?.expires_at]);

  const loadCode = async (path = '') => {
    if (!sessionId) return;
    const res = await fetch(`/api/v1/audit/session/${sessionId}/code?path=${encodeURIComponent(path)}`, { credentials: 'include' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Code could not be loaded');

    if (data.type === 'tree') {
      setEntries(data.entries || []);
      setActivePath('');
      setFileContent('');
    } else {
      setActivePath(data.path);
      setFileContent(data.content || '');
    }
  };

  useEffect(() => {
    let socket: Socket | null = null;

    const boot = async () => {
      try {
        const res = await fetch(`/api/v1/audit/session/${sessionId}`, { credentials: 'include' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Audit session could not load');
        setSession(data.session);
        setChecklist(data.checklist || []);

        socket = io('/', { path: '/socket.io' });
        socketRef.current = socket;
        socket.on('connect', () => {
          socket?.emit('audit:join', { sessionId });
          setTerminalStatus('Live audit connected.');
        });
        socket.on('connect_error', () => setTerminalStatus('Live audit connection is retrying...'));
        socket.on('audit:terminal', (event: TerminalEvent) => {
          setTerminalEvents((prev) => [...prev, event].slice(-20));
        });

        await loadCode('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Audit session could not load');
      }
    };

    boot();
    return () => {
      socketRef.current = null;
      socket?.disconnect();
    };
  }, [sessionId]);

  const submit = async () => {
    if (!allAnswered) return;
    const res = await fetch('/api/v1/audit/submit', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, checklist: answers, feedback }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Audit could not be submitted');
      return;
    }
    navigate(`/quest/${session?.quest_id || '00'}`);
  };

  const sendTerminalEvent = () => {
    const socket = socketRef.current;
    if (!socket) {
      setTerminalStatus('Live audit connection is still starting.');
      return;
    }
    socket.emit('audit:terminal', {
      sessionId,
      actor: user?.username,
      command: demoCommand,
      output: demoOutput || 'Command shared for live audit review.',
    });
    setTerminalStatus('Terminal output shared.');
  };

  const role = user?.username === session?.auditor ? 'Auditor' : 'Student';

  if (error) return <div className="workspace-container"><div className="audit-error">{error}</div></div>;

  return (
    <div className="workspace-container audit-workspace">
      <header className="leetcode-header">
        <div className="header-left">
          <button className="brand-mark" onClick={() => navigate(`/quest/${session?.quest_id || '00'}`)}>
            <Hash size={18} />
          </button>
          <div className="problem-nav">
            <span onClick={() => navigate(`/quest/${session?.quest_id || '00'}`)}>Audit Mode</span>
          </div>
        </div>

        <div className="header-center">
          <span className="toolbar-button audit-session-pill"><ShieldCheck size={14} /> {role}</span>
          <span className="toolbar-button audit-session-pill"><Clock size={14} /> {remainingMinutes} min</span>
        </div>

        <div className="header-right">
          <a className="toolbar-button" href={import.meta.env.VITE_USER_APP_URL || 'http://localhost:5173/dashboard'}>
            Back
          </a>
          <div className="user-avatar">{user?.username?.[0]?.toUpperCase()}</div>
        </div>
      </header>

      <div className="quest-shell">
        <aside className="exercise-sidebar">
          <div className="sidebar-kicker">- quest {session?.quest_id || '00'}</div>
          <div className="sidebar-title">Peer Defense</div>
          <div className="exercise-list">
            <button className="exercise-list-item auditing active">
              <span>{session?.exercise_id || 'exercise'}</span>
              <i />
            </button>
          </div>
          {session?.repo_url && (
            <a className="sidebar-repo-link" href={session.repo_url}>
              <FileCode2 size={15} />
              <span>Read-only Gitea repo</span>
            </a>
          )}
        </aside>

        <main className="split-view">
          <section className="description-pane">
            <div className="pane-tabs">
              <div className="pane-tab active"><FileText size={16} /> Audit Script</div>
            </div>

            <div className="pane-content audit-script-content">
              <div className="problem-heading">
                <h1>{session?.exercise_id || 'Audit'}</h1>
                <span className="availability-dot auditing" />
              </div>

              <div className="audit-card active-audit-card">
                <strong>{session?.auditee || 'Student'} defense</strong>
                <span>Review only this exercise. The code comes directly from the submitted Gitea repository.</span>
              </div>

              <div className="problem-copy">
                <h2>Checklist</h2>
              </div>

              {checklist.map((item) => (
                <div className="check-row" key={item.id}>
                  <span>{item.text}</span>
                  <div>
                    <button className={answers[item.id] === true ? 'selected pass' : ''} onClick={() => setAnswers((prev) => ({ ...prev, [item.id]: true }))}>
                      <CheckCircle2 size={15} /> Pass
                    </button>
                    <button className={answers[item.id] === false ? 'selected fail' : ''} onClick={() => setAnswers((prev) => ({ ...prev, [item.id]: false }))}>
                      <XCircle size={15} /> Fail
                    </button>
                  </div>
                </div>
              ))}

              <textarea className="feedback-box" value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="Audit feedback" />

              <button className="audit-submit" disabled={!allAnswered} onClick={submit}>
                {Object.values(answers).some((answer) => answer === false) ? 'Invalidate' : 'Validate'}
              </button>
            </div>
          </section>

          <section className="editor-pane">
            <div className="code-titlebar">
              <div><Code2 size={19} /> Read-only Code</div>
            </div>

            <div className="audit-code-layout quest-audit-code">
              <div className="audit-tree">
                <button onClick={() => loadCode('')}>/{session?.exercise_id || ''}</button>
                {entries.map((entry) => (
                  <button key={entry.path} onClick={() => loadCode(entry.path)}>
                    {entry.type === 'dir' ? '> ' : ''}{entry.name}
                  </button>
                ))}
              </div>
              <pre className="audit-file"><code>{activePath ? `# ${activePath}\n\n${fileContent}` : 'Select a file to inspect.'}</code></pre>
            </div>

            <div className="console-pane audit-console-pane">
              <div className="console-header">
                <div className="console-tabs">
                  <span className="active"><CheckSquare size={17} /> Live Audit</span>
                </div>
                <Terminal size={16} />
              </div>
              <div className="console-output audit-console-output">
                <div className="live-terminal">
                  <strong>Live terminal feed</strong>
                  <span className="terminal-status">{terminalStatus}</span>
                  <input value={demoCommand} onChange={(event) => setDemoCommand(event.target.value)} />
                  <textarea value={demoOutput} onChange={(event) => setDemoOutput(event.target.value)} placeholder="Student command output" />
                  <button onClick={sendTerminalEvent}>Share Terminal Output</button>
                  {terminalEvents.map((event, index) => (
                    <div key={`${event.at}-${index}`} className="terminal-event">
                      <span>{event.actor}: {event.command}</span>
                      <pre>{event.output}</pre>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
