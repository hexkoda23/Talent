import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import {
  Bookmark,
  Braces,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CloudUpload,
  Code2,
  FileText,
  GitBranch,
  Globe,
  Hash,
  Maximize2,
  Play,
  RotateCcw,
  Settings,
  Terminal,
} from 'lucide-react';
import { useAuth } from './AuthContext.tsx';
import './QuestWorkspace.css';

const LANGUAGES = [
  { id: 'cpp', name: 'C++', monaco: 'cpp', ext: 'cpp' },
  { id: 'java', name: 'Java', monaco: 'java', ext: 'java' },
  { id: 'python3', name: 'Python3', monaco: 'python', ext: 'py' },
  { id: 'python', name: 'Python', monaco: 'python', ext: 'py' },
  { id: 'javascript', name: 'JavaScript', monaco: 'javascript', ext: 'js' },
  { id: 'typescript', name: 'TypeScript', monaco: 'typescript', ext: 'ts' },
  { id: 'csharp', name: 'C#', monaco: 'csharp', ext: 'cs' },
  { id: 'c', name: 'C', monaco: 'c', ext: 'c' },
  { id: 'go', name: 'Go', monaco: 'go', ext: 'go' },
  { id: 'kotlin', name: 'Kotlin', monaco: 'kotlin', ext: 'kt' },
  { id: 'swift', name: 'Swift', monaco: 'swift', ext: 'swift' },
  { id: 'rust', name: 'Rust', monaco: 'rust', ext: 'rs' },
  { id: 'ruby', name: 'Ruby', monaco: 'ruby', ext: 'rb' },
  { id: 'php', name: 'PHP', monaco: 'php', ext: 'php' },
  { id: 'dart', name: 'Dart', monaco: 'dart', ext: 'dart' },
  { id: 'scala', name: 'Scala', monaco: 'scala', ext: 'scala' },
  { id: 'elixir', name: 'Elixir', monaco: 'elixir', ext: 'ex' },
  { id: 'erlang', name: 'Erlang', monaco: 'erlang', ext: 'erl' },
  { id: 'racket', name: 'Racket', monaco: 'scheme', ext: 'rkt' },
];

interface ExerciseTest {
  name: string;
  functionName: string;
  args: unknown[];
  expected: unknown;
}

interface ExerciseRestriction {
  type: 'forbiddenSource';
  value: string;
  message: string;
}

interface Exercise {
  id: string;
  name: string;
  path: string;
  level?: number;
  xp?: string;
  filesToSubmit?: string[];
  allowedFunctions?: string[];
  instructions?: string;
  defaultCode?: string;
  defaultCodeByLanguage?: Record<string, string>;
  sampleTests?: ExerciseTest[];
  restrictions?: ExerciseRestriction[];
}

interface QuestManifest {
  id: string;
  name: string;
  exercises: Exercise[];
}

interface TestRunResult {
  passed: boolean;
  output: string;
  exerciseId?: string;
  questStatus?: string;
  nextExerciseId?: string | null;
  commitId?: string;
  results: Array<{
    name: string;
    passed: boolean;
    input: unknown[];
    expected: unknown;
    received?: unknown;
    error?: string;
  }>;
}

type ConsoleTab = 'testcase' | 'result';
type ExerciseState = 'available' | 'locked' | 'passed' | 'testing' | 'waiting' | 'auditing';

interface ExerciseAuditState {
  exercise_id: string;
  exercise_status: string;
  session_id?: number | null;
  audit_status?: string | null;
  auditee?: string | null;
  auditor?: string | null;
}

const formatBotResult = (latestResult: any): TestRunResult | null => {
  if (!latestResult?.results) return null;
  const payload = typeof latestResult.results === 'string' ? JSON.parse(latestResult.results) : latestResult.results;
  const results = payload.results || [];
  const passed = ['PASSED', 'WAITING_FOR_AUDIT', 'AUDITING'].includes(latestResult.status)
    || payload.passed === true
    || payload.success === true;

  return {
    passed,
    exerciseId: latestResult.exercise_id,
    output: results.map((result: any) => `${result.passed ? 'PASS' : 'FAIL'} ${result.name}`).join('\n'),
    commitId: payload.commit_id,
    results: results.map((result: any) => ({
      name: result.name,
      passed: Boolean(result.passed),
      input: result.input || [],
      expected: result.expected,
      received: result.received,
      error: result.error,
    })),
  };
};

const getStarterCode = (exercise: Exercise | undefined, language: string) => (
  exercise?.defaultCodeByLanguage?.[language] || exercise?.defaultCode || ''
);

const isPythonLanguage = (language: string) => language === 'python' || language === 'python3';

export default function QuestWorkspace() {
  const { questId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [manifest, setManifest] = useState<QuestManifest | null>(null);
  const [activeExerciseId, setActiveExerciseId] = useState('');
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [repoUrl, setRepoUrl] = useState('');
  const [repoFullName, setRepoFullName] = useState('');
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runResult, setRunResult] = useState<TestRunResult | null>(null);
  const [consoleTab, setConsoleTab] = useState<ConsoleTab>('testcase');
  const [passedExercises, setPassedExercises] = useState<string[]>([]);
  const [currentUnlockedExerciseId, setCurrentUnlockedExerciseId] = useState('');
  const [questStatus, setQuestStatus] = useState('IN_PROGRESS');
  const [testingExerciseId, setTestingExerciseId] = useState<string | null>(null);
  const [auditStates, setAuditStates] = useState<ExerciseAuditState[]>([]);
  const [activeAudits, setActiveAudits] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/v1/quests/${questId}/manifest`, { credentials: 'include' });
        if (!res.ok) throw new Error('Manifest not found');
        const data = await res.json();
        const firstExerciseId = data.exercises?.[0]?.id || '';
        setManifest(data);
        setActiveExerciseId(firstExerciseId);
        setCurrentUnlockedExerciseId(firstExerciseId);
        setCode(getStarterCode(data.exercises?.[0], 'python'));

        if (user?.username) {
          const [accessRes, progressRes] = await Promise.all([
            fetch(`/api/v1/quests/${questId}/access`, { credentials: 'include' }),
            fetch(`/api/v1/quests/${questId}/progress`, { credentials: 'include' }),
          ]);

          if (accessRes.ok) {
            const accessData = await accessRes.json();
            setRepoUrl(accessData.repoUrl || '');
            setRepoFullName(accessData.repoFullName || '');
          }

          if (progressRes.ok) {
            const progressData = await progressRes.json();
            setPassedExercises(progressData.passedExercises || []);
            setQuestStatus(progressData.status || 'IN_PROGRESS');
            setAuditStates(progressData.auditStates || []);
            setActiveAudits(progressData.activeAudits || []);
            setCurrentUnlockedExerciseId(progressData.currentExerciseId || firstExerciseId);
            setActiveExerciseId(progressData.currentExerciseId || firstExerciseId);
            const activeExercise = data.exercises?.find((exercise: Exercise) => exercise.id === (progressData.currentExerciseId || firstExerciseId));
            setCode(getStarterCode(activeExercise || data.exercises?.[0], 'python'));
          }
        }
      } catch (error) {
        console.error('Workspace load error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) fetchData();
  }, [questId, user]);

  useEffect(() => {
    if (!user?.username || !questId) return undefined;

    const interval = window.setInterval(async () => {
      try {
        const progressRes = await fetch(`/api/v1/quests/${questId}/progress`, { credentials: 'include' });
        if (!progressRes.ok) return;
        const progressData = await progressRes.json();
        setPassedExercises(progressData.passedExercises || []);
        setQuestStatus(progressData.status || 'IN_PROGRESS');
        setAuditStates(progressData.auditStates || []);
        setActiveAudits(progressData.activeAudits || []);
        setCurrentUnlockedExerciseId(progressData.currentExerciseId || currentUnlockedExerciseId);
        const latestBotResult = formatBotResult(progressData.latestResult);
        if (latestBotResult?.exerciseId === activeExerciseId) setRunResult(latestBotResult);
      } catch {
        // Keep the visible testing state until the next poll.
      }
    }, 4000);

    return () => window.clearInterval(interval);
  }, [activeExerciseId, currentUnlockedExerciseId, questId, user?.username]);

  const currentExercise = manifest?.exercises.find((exercise) => exercise.id === activeExerciseId);
  const activeExerciseIndex = manifest?.exercises.findIndex((exercise) => exercise.id === activeExerciseId) ?? -1;
  const unlockedExerciseIndex = manifest?.exercises.findIndex((exercise) => exercise.id === currentUnlockedExerciseId) ?? 0;
  const selectedLanguage = LANGUAGES.find((item) => item.id === language) || LANGUAGES[3];
  const currentAuditState = auditStates.find((state) => state.exercise_id === activeExerciseId);
  const currentAuditSession = activeAudits.find((session) => session.exercise_id === activeExerciseId)
    || (currentAuditState?.session_id ? { id: currentAuditState.session_id } : null);

  const exerciseStates = useMemo(() => {
    const states: Record<string, ExerciseState> = {};
    manifest?.exercises.forEach((exercise, index) => {
      if (testingExerciseId === exercise.id) states[exercise.id] = 'testing';
      else {
        const auditState = auditStates.find((item) => item.exercise_id === exercise.id);
        const activeAudit = activeAudits.find((item) => item.exercise_id === exercise.id);
        if (activeAudit || auditState?.exercise_status === 'AUDITING') states[exercise.id] = 'auditing';
        else if (auditState?.exercise_status === 'WAITING_FOR_AUDIT') states[exercise.id] = 'waiting';
        else if (auditState?.exercise_status === 'PASSED') states[exercise.id] = 'passed';
        else if (passedExercises.includes(exercise.id)) states[exercise.id] = 'waiting';
        else if (index <= unlockedExerciseIndex || questStatus === 'READY_FOR_AUDIT') states[exercise.id] = 'available';
        else states[exercise.id] = 'locked';
      }
    });
    return states;
  }, [activeAudits, auditStates, manifest, passedExercises, questStatus, testingExerciseId, unlockedExerciseIndex]);

  const selectExercise = (exercise: Exercise) => {
    if (exerciseStates[exercise.id] === 'locked') return;
    setActiveExerciseId(exercise.id);
    setCode(getStarterCode(exercise, language));
    setRunResult(null);
    setConsoleTab('testcase');
  };

  const moveExercise = (direction: -1 | 1) => {
    if (!manifest || activeExerciseIndex < 0) return;
    const nextExercise = manifest.exercises[activeExerciseIndex + direction];
    if (nextExercise) selectExercise(nextExercise);
  };

  const runCode = async (mode: 'run' | 'submit') => {
    if (!questId || !currentExercise) return;

    if (!isPythonLanguage(language)) {
      setConsoleTab('result');
      setRunResult({
        passed: false,
        output: 'This quest is currently graded in Python.',
        results: [],
      });
      return;
    }

    const isSubmit = mode === 'submit';
    setConsoleTab('result');
    setRunResult(null);
    setTestingExerciseId(currentExercise.id);
    if (isSubmit) setIsSubmitting(true);
    else setIsRunning(true);

    try {
      const response = await fetch(`/api/v1/quests/${questId}/exercises/${currentExercise.id}/${mode}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Tests could not run');
      setRunResult(data);
      if (isSubmit && data.questStatus) setQuestStatus(data.questStatus);

      if (isSubmit && data.passed) {
        setPassedExercises((prev) => Array.from(new Set([...prev, currentExercise.id])));
        if (data.nextExerciseId) setCurrentUnlockedExerciseId(data.nextExerciseId);
      }
    } catch (error) {
      setRunResult({
        passed: false,
        output: error instanceof Error ? error.message : 'Tests could not run',
        results: [],
      });
    } finally {
      setIsRunning(false);
      setIsSubmitting(false);
      setTestingExerciseId(null);
    }
  };

  const chooseLanguage = (nextLanguage: string) => {
    setLanguage(nextLanguage);
    setCode(getStarterCode(currentExercise, nextLanguage));
    setRunResult(null);
    setConsoleTab('testcase');
    setIsLanguageMenuOpen(false);
  };

  if (isLoading) {
    return (
      <div className="workspace-loading">
        <div className="loading-spinner" />
        <span>Synchronizing workspace...</span>
      </div>
    );
  }

  return (
    <div className="workspace-container">
      <header className="leetcode-header">
        <div className="header-left">
          <button className="brand-mark" onClick={() => navigate('/')}>
            <Hash size={18} />
          </button>
          <div className="problem-nav">
            <span onClick={() => navigate('/')}>Problem List</span>
            <div className="nav-arrows">
              <ChevronLeft size={18} onClick={() => moveExercise(-1)} />
              <ChevronRight size={18} onClick={() => moveExercise(1)} />
            </div>
          </div>
        </div>

        <div className="header-center">
          <button className="toolbar-button run-button" onClick={() => runCode('run')} disabled={isRunning || isSubmitting}>
            <Play size={14} fill="currentColor" /> {isRunning ? 'Running' : 'Run'}
          </button>
          <button className="toolbar-button submit-button" onClick={() => runCode('submit')} disabled={isRunning || isSubmitting}>
            <CloudUpload size={14} /> {isSubmitting ? 'Submitting' : 'Submit'}
          </button>
          {repoUrl && (
            <a className="toolbar-button gitea-button" href={repoUrl} title={repoFullName || 'Open Gitea repository'}>
              <GitBranch size={14} /> Student Repo
            </a>
          )}
          {currentAuditSession?.id && currentExercise && exerciseStates[currentExercise.id] === 'auditing' && (
            <button className="toolbar-button audit-toolbar-button" onClick={() => navigate(`/audit/${currentAuditSession.id}`)}>
              <CheckSquare size={14} /> Audit
            </button>
          )}
        </div>

        <div className="header-right">
          <a className="toolbar-button" href={import.meta.env.VITE_USER_APP_URL || 'http://localhost:5173/dashboard'}>
            Back
          </a>
          <Globe size={18} />
          <Settings size={18} />
          <div className="user-avatar">{user?.username?.[0]?.toUpperCase()}</div>
        </div>
      </header>

      <div className="quest-shell">
        <aside className="exercise-sidebar">
          <div className="sidebar-kicker">- {manifest?.id || 'quest'}</div>
          <div className="sidebar-title">{manifest?.name || 'Quest'}</div>
          <div className="exercise-list">
            {manifest?.exercises.map((exercise) => {
              const state = exerciseStates[exercise.id] || 'locked';
              return (
                <button
                  key={exercise.id}
                  className={`exercise-list-item ${state} ${exercise.id === activeExerciseId ? 'active' : ''}`}
                  onClick={() => selectExercise(exercise)}
                >
                  <span>{exercise.name}</span>
                  <i />
                </button>
              );
            })}
          </div>
          {repoUrl && (
            <a className="sidebar-repo-link" href={repoUrl}>
              <GitBranch size={15} />
              <span>Student: {repoFullName}</span>
            </a>
          )}
        </aside>

        <main className="split-view">
          <section className="description-pane">
            <div className="pane-tabs">
              <div className="pane-tab active"><FileText size={16} /> Description</div>
            </div>

            <div className="pane-content">
              <div className="problem-heading">
                <h1>{currentExercise?.name}</h1>
                <span className={`availability-dot ${exerciseStates[currentExercise?.id || ''] || 'locked'}`} />
              </div>

              <div className="exercise-spec-card">
                <div><span>XP</span><strong>{currentExercise?.xp || '1.00 kB'}</strong></div>
                <div><span>Files to submit</span><strong>{currentExercise?.filesToSubmit?.join(', ') || currentExercise?.path}</strong></div>
                <div><span>Allowed functions</span><strong>{currentExercise?.allowedFunctions?.join(', ') || 'return'}</strong></div>
              </div>

              {currentExercise && exerciseStates[currentExercise.id] === 'waiting' && (
                <div className="audit-card">
                  <strong>Test passed, pairing for an audit</strong>
                  <span>The platform will open the defense screen once an eligible peer is matched.</span>
                </div>
              )}

              {currentExercise && exerciseStates[currentExercise.id] === 'auditing' && currentAuditSession?.id && (
                <div className="audit-card active-audit-card">
                  <strong>Peer audit ready</strong>
                  <span>Open the defense screen for this exercise.</span>
                  <button onClick={() => navigate(`/audit/${currentAuditSession.id}`)}>Audit</button>
                </div>
              )}

              <div className="problem-copy">
                <h2>Instructions</h2>
                <pre>{currentExercise?.instructions}</pre>
              </div>
            </div>
          </section>

          <section className="editor-pane">
            <div className="code-titlebar">
              <div><Code2 size={19} /> Code</div>
              <div className="code-actions">
                <Maximize2 size={18} />
                <ChevronRight size={18} className="collapse-icon" />
              </div>
            </div>

            <div className="editor-header">
              <div className="language-control">
                <button className="language-button" onClick={() => setIsLanguageMenuOpen((open) => !open)}>
                  {selectedLanguage.name} <ChevronDown size={16} />
                </button>
                {isLanguageMenuOpen && (
                  <div className="language-menu">
                    {LANGUAGES.map((item) => (
                      <button key={item.id} className={item.id === language ? 'active' : ''} onClick={() => chooseLanguage(item.id)}>
                        {item.id === language && <Check size={17} />}
                        <span>{item.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="editor-tools">
                <span>Auto</span>
                <Bookmark size={18} />
                <Braces size={19} />
                <RotateCcw size={18} />
                <Maximize2 size={18} />
              </div>
            </div>

            <div className="editor-shell">
              <Editor
                height="100%"
                language={selectedLanguage.monaco}
                theme="vs-dark"
                value={code}
                onChange={(value) => setCode(value || '')}
                options={{
                  fontSize: 14,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  minimap: { enabled: true },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 20, bottom: 20 },
                  lineNumbers: 'on',
                  smoothScrolling: true,
                  bracketPairColorization: { enabled: true },
                  guides: { bracketPairs: true },
                }}
              />
            </div>

            <div className="console-pane">
              <div className="console-header">
                <div className="console-tabs">
                  <span className={consoleTab === 'testcase' ? 'active' : ''} onClick={() => setConsoleTab('testcase')}><CheckSquare size={17} /> Testcase</span>
                  <span className={consoleTab === 'result' ? 'active' : ''} onClick={() => setConsoleTab('result')}>Test Result</span>
                </div>
                <Terminal size={16} />
              </div>
              <div className="console-output">
                {consoleTab === 'testcase' && (
                  <div className="testcase-list">
                    {(currentExercise?.sampleTests || []).map((test) => (
                      <div key={test.name} className="testcase-row">
                        <strong>{test.name}</strong>
                        <span>Input: {JSON.stringify(test.args)}</span>
                        <span>Expected: {JSON.stringify(test.expected)}</span>
                      </div>
                    ))}
                    {!isPythonLanguage(language) && <span>This quest is currently graded in Python.</span>}
                  </div>
                )}

                {consoleTab === 'result' && (
                  <div className="result-list">
                    {(isRunning || isSubmitting) && <span>{'>'} {isSubmitting ? 'Submitting official tests...' : 'Running sample tests...'}</span>}
                    {!isRunning && !isSubmitting && !runResult && <span>{'>'} Click Run or Submit to execute tests.</span>}
                      {runResult && (
                        <>
                          <div className={runResult.questStatus === 'TESTING' ? 'result-summary testing' : runResult.passed ? 'result-summary passed' : 'result-summary failed'}>
                            {runResult.questStatus === 'TESTING' ? 'Bot Testing' : runResult.passed ? 'Accepted' : 'Wrong Answer'}
                          </div>
                          {runResult.commitId && <span>Commit: {runResult.commitId.slice(0, 10)}</span>}
                          {runResult.results.map((result) => (
                          <div key={result.name} className={`result-row ${result.passed ? 'passed' : 'failed'}`}>
                            <strong>{result.passed ? 'PASS' : 'FAIL'} {result.name}</strong>
                            <span>Input: {JSON.stringify(result.input)}</span>
                            <span>Expected: {JSON.stringify(result.expected)}</span>
                            {'received' in result && <span>Received: {JSON.stringify(result.received)}</span>}
                            {result.error && <span>{result.error}</span>}
                          </div>
                        ))}
                        {!runResult.results.length && <span>{runResult.output}</span>}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
