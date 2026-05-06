import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './QuestEditor.css';

interface ExerciseTest {
  name: string;
  functionName: string;
  args: any[];
  expected: any;
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
  level: number;
  xp: string;
  instructions: string;
  filesToSubmit: string[];
  allowedFunctions: string[];
  defaultCode: string;
  defaultCodeByLanguage: Record<string, string>;
  sampleTests: ExerciseTest[];
  hiddenTests: ExerciseTest[];
  restrictions: ExerciseRestriction[];
}

interface QuestManifest {
  id: string;
  name: string;
  language: string;
  exercises: Exercise[];
}

const QuestEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [manifest, setManifest] = useState<QuestManifest | null>(null);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState<number | 'quest'>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Local state for JSON editing to allow invalid JSON while typing
  const [rawTestInputs, setRawTestInputs] = useState<Record<string, { args: string, expected: string }>>({});

  const adminToken = 'admin-secret-key';

  useEffect(() => {
    if (id === 'new') {
      setManifest({
        id: 'quest-new',
        name: 'New Quest',
        language: 'python',
        exercises: [createEmptyExercise('ex01')]
      });
      setLoading(false);
    } else {
      fetchQuest();
    }
  }, [id]);

  const fetchQuest = async () => {
    try {
      const response = await fetch(`/api/v1/admin/quests/${id}`, {
        headers: { 'X-ADMIN-TOKEN': adminToken }
      });
      if (!response.ok) throw new Error('Failed to fetch quest detail');
      const data = await response.json();
      setManifest(data);
    } catch (err: any) {
      alert(err.message);
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const saveQuest = async () => {
    if (!manifest) return;
    try {
      setSaving(true);
      const response = await fetch(`/api/v1/admin/quests${id === 'new' ? '' : `/${id}`}`, {
        method: id === 'new' ? 'POST' : 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-ADMIN-TOKEN': adminToken
        },
        body: JSON.stringify(manifest)
      });
      if (!response.ok) throw new Error('Save failed');
      alert('Quest saved successfully!');
      if (id === 'new') navigate(`/admin/quest/${manifest.id}`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  function createEmptyExercise(id: string): Exercise {
    return {
      id,
      name: 'New Exercise',
      path: `exercises/${id}/README.md`,
      level: 1,
      xp: '1.00 kB',
      instructions: '',
      filesToSubmit: [`${id}/solution.py`],
      allowedFunctions: ['return'],
      defaultCode: 'def solution():\n    pass\n',
      defaultCodeByLanguage: {
        python: 'def solution():\n    pass\n',
        python3: 'def solution():\n    pass\n'
      },
      sampleTests: [],
      hiddenTests: [],
      restrictions: [],
      auditChecklist: [
        { id: `check-${id}-01`, text: `Can the student explain the logic of ${id}?` }
      ]
    };
  }

  const addExercise = () => {
    if (!manifest) return;
    const nextId = `ex${String(manifest.exercises.length + 1).padStart(2, '0')}`;
    const updated = { ...manifest, exercises: [...manifest.exercises, createEmptyExercise(nextId)] };
    setManifest(updated);
    setActiveExerciseIndex(updated.exercises.length - 1);
  };

  const removeExercise = (index: number) => {
    if (!manifest || manifest.exercises.length <= 1) return;
    const updated = { ...manifest, exercises: manifest.exercises.filter((_, i) => i !== index) };
    setManifest(updated);
    setActiveExerciseIndex(Math.max(0, activeExerciseIndex - 1));
  };

  const updateExercise = (updates: Partial<Exercise>) => {
    if (!manifest || activeExerciseIndex === 'quest') return;
    const updatedExercises = [...manifest.exercises];
    updatedExercises[activeExerciseIndex] = { ...updatedExercises[activeExerciseIndex], ...updates };
    setManifest({ ...manifest, exercises: updatedExercises });
  };

  const activeEx = activeExerciseIndex === 'quest' ? null : manifest?.exercises[activeExerciseIndex];

  if (loading || !manifest) return <div className="loading-screen"><div className="loading-spinner"></div></div>;

  return (
    <div className="quest-editor-container fade-in">
      <nav className="editor-nav">
        <Link to="/admin" className="back-link">← Back to Dashboard</Link>
        <div className="nav-actions">
          <button className="btn btn-primary btn-small" onClick={saveQuest} disabled={saving}>
            {saving ? 'Syncing...' : 'Save Manifest'}
          </button>
        </div>
      </nav>

      <div className="editor-layout">
        {/* Sidebar: Exercise List */}
        <aside className="editor-sidebar">
          <div className="sidebar-section">
            <h3>Configuration</h3>
            <div 
              className={`exercise-item ${activeExerciseIndex === 'quest' ? 'active' : ''}`}
              onClick={() => setActiveExerciseIndex('quest')}
            >
              <span className="ex-id">Global</span>
              <span className="ex-name">Quest Settings</span>
            </div>
          </div>

          <div className="sidebar-section" style={{ marginTop: '1.5rem' }}>
            <div className="sidebar-header">
              <h3>Exercises</h3>
              <button className="btn btn-small" onClick={addExercise}>+ Add</button>
            </div>
            <div className="exercise-list">
              {manifest.exercises.map((ex, idx) => (
                <div 
                  key={idx} 
                  className={`exercise-item ${idx === activeExerciseIndex ? 'active' : ''}`}
                  onClick={() => setActiveExerciseIndex(idx)}
                >
                  <span className="ex-id">{ex.id}</span>
                  <span className="ex-name">{ex.name}</span>
                  {manifest.exercises.length > 1 && (
                    <button className="remove-btn" onClick={(e) => { e.stopPropagation(); removeExercise(idx); }}>×</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content: Exercise Form */}
        <main className="editor-main">
          {activeExerciseIndex === 'quest' && (
            <section className="form-section fade-in">
              <h3>Quest Settings</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                Global metadata for the entire quest module.
              </p>
              <div className="input-group">
                <label>Quest ID</label>
                <input 
                  type="text" 
                  value={manifest.id} 
                  onChange={(e) => setManifest({ ...manifest, id: e.target.value })}
                  placeholder="quest-01"
                />
              </div>
              <div className="input-group">
                <label>Quest Name</label>
                <input 
                  type="text" 
                  value={manifest.name} 
                  onChange={(e) => setManifest({ ...manifest, name: e.target.value })}
                />
              </div>
            </section>
          )}

          {activeEx && (
            <section className="form-section fade-in" key={activeExerciseIndex}>
              <div className="section-header">
                <h3>Exercise: {activeEx.id}</h3>
              </div>
              
              <div className="grid-2">
                <div className="input-group">
                  <label>Display Name</label>
                  <input type="text" value={activeEx.name} onChange={(e) => updateExercise({ name: e.target.value })} />
                </div>
                <div className="input-group">
                  <label>XP Reward</label>
                  <input type="text" value={activeEx.xp} onChange={(e) => updateExercise({ xp: e.target.value })} placeholder="1.25 kB" />
                </div>
                <div className="input-group">
                  <label>Solution Path</label>
                  <input type="text" value={activeEx.path} onChange={(e) => updateExercise({ path: e.target.value })} />
                </div>
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label>Files to Submit (comma separated)</label>
                  <input 
                    type="text" 
                    value={activeEx.filesToSubmit.join(', ')} 
                    onChange={(e) => updateExercise({ filesToSubmit: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} 
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Instructions (Markdown)</label>
                <textarea 
                  rows={5} 
                  value={activeEx.instructions} 
                  onChange={(e) => updateExercise({ instructions: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label>Default Code Template</label>
                <textarea 
                  rows={4} 
                  style={{ fontFamily: 'monospace' }}
                  value={activeEx.defaultCode} 
                  onChange={(e) => updateExercise({ defaultCode: e.target.value })}
                />
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label>Allowed Keywords (comma separated)</label>
                  <input 
                    type="text" 
                    value={activeEx.allowedFunctions.join(', ')} 
                    onChange={(e) => updateExercise({ allowedFunctions: e.target.value.split(',').map(s => s.trim()) })} 
                  />
                </div>
                <div className="input-group">
                  <label>Restrictions (Forbidden Strings)</label>
                  <button className="btn btn-small" onClick={() => {
                    const val = window.prompt('Enter forbidden string (e.g. len() )');
                    const msg = window.prompt('Enter error message', `Do not use ${val}`);
                    if (val) updateExercise({ 
                      restrictions: [...activeEx.restrictions, { type: 'forbiddenSource', value: val, message: msg || `Do not use ${val}` }] 
                    });
                  }}>+ Add Restriction</button>
                  <div className="tag-list">
                    {activeEx.restrictions.map((r, i) => (
                      <div key={i} className="restriction-tag-container" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span className="tag tag-error" onClick={() => updateExercise({ restrictions: activeEx.restrictions.filter((_, idx) => idx !== i) })}>
                          {r.value} ✕
                        </span>
                        <input 
                          style={{ fontSize: '11px', padding: '2px 4px', flex: 1 }}
                          placeholder="Message..."
                          value={r.message}
                          onChange={(e) => {
                            const updated = [...activeEx.restrictions];
                            updated[i].message = e.target.value;
                            updateExercise({ restrictions: updated });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="input-group">
                  <label>Audit Checklist</label>
                  <button className="btn btn-small" onClick={() => {
                    const text = window.prompt('Enter checklist question (e.g. Can they explain the loop?)');
                    if (text) {
                      const id = `check-${Math.random().toString(36).substr(2, 5)}`;
                      updateExercise({ 
                        auditChecklist: [...(activeEx.auditChecklist || []), { id, text }] 
                      });
                    }
                  }}>+ Add Question</button>
                  <div className="checklist-editor">
                    {(activeEx.auditChecklist || []).map((item, i) => (
                      <div key={item.id} className="checklist-item-edit" style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <input 
                          style={{ flex: 1 }}
                          value={item.text} 
                          onChange={(e) => {
                            const updated = [...(activeEx.auditChecklist || [])];
                            updated[i].text = e.target.value;
                            updateExercise({ auditChecklist: updated });
                          }}
                        />
                        <button className="remove-btn-small" onClick={() => updateExercise({ auditChecklist: activeEx.auditChecklist?.filter((_, idx) => idx !== i) })}>✕</button>
                      </div>
                    ))}
                    {(!activeEx.auditChecklist || activeEx.auditChecklist.length === 0) && (
                      <span className="helper-text">No custom questions. Using global defaults.</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="test-sections grid-2">
                <div className="test-column">
                  <h4>Sample Tests (Public)</h4>
                  <button className="btn btn-small" onClick={() => updateExercise({ 
                    sampleTests: [...activeEx.sampleTests, { name: 'New Test', functionName: 'solution', args: [], expected: '' }] 
                  })}>+ Add Sample Test</button>
                  <div className="test-list">
                    {activeEx.sampleTests.map((t, i) => {
                      const testKey = `sample-${activeExerciseIndex}-${i}`;
                      const raw = rawTestInputs[testKey] || { 
                        args: JSON.stringify(t.args, null, 1), 
                        expected: JSON.stringify(t.expected, null, 1) 
                      };

                      return (
                        <div key={i} className="test-item-card">
                          <input className="test-input" placeholder="Test Label (e.g. 'handles negative numbers')" value={t.name} onChange={(e) => {
                            const tests = [...activeEx.sampleTests];
                            tests[i].name = e.target.value;
                            updateExercise({ sampleTests: tests });
                          }} />
                          <input className="test-input" placeholder="Target Function Name" value={t.functionName} onChange={(e) => {
                            const tests = [...activeEx.sampleTests];
                            tests[i].functionName = e.target.value;
                            updateExercise({ sampleTests: tests });
                          }} />
                          <div className="test-row">
                            <label>Args (Array JSON)</label>
                            <textarea 
                              className="test-input mono" 
                              rows={2}
                              placeholder='[1, 2] or ["hello"]' 
                              value={raw.args} 
                              onChange={(e) => {
                                const newRaw = { ...raw, args: e.target.value };
                                setRawTestInputs({ ...rawTestInputs, [testKey]: newRaw });
                                try {
                                  const val = JSON.parse(e.target.value);
                                  if (Array.isArray(val)) {
                                    const tests = [...activeEx.sampleTests];
                                    tests[i].args = val;
                                    updateExercise({ sampleTests: tests });
                                  }
                                } catch {}
                              }} 
                            />
                            <span className="helper-text">List of arguments passed to function. Must be valid JSON array.</span>
                          </div>
                          <div className="test-row">
                            <label>Expected (JSON)</label>
                            <textarea 
                              className="test-input mono" 
                              rows={2}
                              placeholder='3 or "olleh"' 
                              value={raw.expected} 
                              onChange={(e) => {
                                const newRaw = { ...raw, expected: e.target.value };
                                setRawTestInputs({ ...rawTestInputs, [testKey]: newRaw });
                                try {
                                  const val = JSON.parse(e.target.value);
                                  const tests = [...activeEx.sampleTests];
                                  tests[i].expected = val;
                                  updateExercise({ sampleTests: tests });
                                } catch {}
                              }} 
                            />
                            <span className="helper-text">Target return value. Supports strings, numbers, booleans, objects.</span>
                          </div>
                          <div className="test-footer">
                             <button className="remove-btn-small" onClick={() => updateExercise({ sampleTests: activeEx.sampleTests.filter((_, idx) => idx !== i) })}>Remove</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="test-column">
                  <h4>Hidden Tests (Private)</h4>
                  <button className="btn btn-small btn-primary" onClick={() => updateExercise({ 
                    hiddenTests: [...activeEx.hiddenTests, { name: 'Hidden Test', functionName: 'solution', args: [], expected: '' }] 
                  })}>+ Add Hidden Test</button>
                   <div className="test-list">
                    {activeEx.hiddenTests.map((t, i) => {
                      const testKey = `hidden-${activeExerciseIndex}-${i}`;
                      const raw = rawTestInputs[testKey] || { 
                        args: JSON.stringify(t.args, null, 1), 
                        expected: JSON.stringify(t.expected, null, 1) 
                      };

                      return (
                        <div key={i} className="test-item-card hidden-style">
                          <input className="test-input" placeholder="Test Label" value={t.name} onChange={(e) => {
                            const tests = [...activeEx.hiddenTests];
                            tests[i].name = e.target.value;
                            updateExercise({ hiddenTests: tests });
                          }} />
                          <input className="test-input" placeholder="Target Function Name" value={t.functionName} onChange={(e) => {
                            const tests = [...activeEx.hiddenTests];
                            tests[i].functionName = e.target.value;
                            updateExercise({ hiddenTests: tests });
                          }} />
                          <div className="test-row">
                            <label>Args (Array JSON)</label>
                            <textarea 
                              className="test-input mono" 
                              rows={2}
                              placeholder='[1, 2]' 
                              value={raw.args} 
                              onChange={(e) => {
                                const newRaw = { ...raw, args: e.target.value };
                                setRawTestInputs({ ...rawTestInputs, [testKey]: newRaw });
                                try {
                                  const val = JSON.parse(e.target.value);
                                  if (Array.isArray(val)) {
                                    const tests = [...activeEx.hiddenTests];
                                    tests[i].args = val;
                                    updateExercise({ hiddenTests: tests });
                                  }
                                } catch {}
                              }} 
                            />
                          </div>
                          <div className="test-row">
                            <label>Expected (JSON)</label>
                            <textarea 
                              className="test-input mono" 
                              rows={2}
                              placeholder='"expected_val"' 
                              value={raw.expected} 
                              onChange={(e) => {
                                const newRaw = { ...raw, expected: e.target.value };
                                setRawTestInputs({ ...rawTestInputs, [testKey]: newRaw });
                                try {
                                  const val = JSON.parse(e.target.value);
                                  const tests = [...activeEx.hiddenTests];
                                  tests[i].expected = val;
                                  updateExercise({ hiddenTests: tests });
                                } catch {}
                              }} 
                            />
                          </div>
                          <div className="test-footer">
                             <button className="remove-btn-small" onClick={() => updateExercise({ hiddenTests: activeEx.hiddenTests.filter((_, idx) => idx !== i) })}>Remove</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default QuestEditor;
