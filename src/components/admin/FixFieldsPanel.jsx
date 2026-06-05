import { useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Wrench, CheckCircle2, AlertCircle, ChevronDown, Play } from 'lucide-react';
import { UI_VERSION, UI_CHANGELOG } from '../../config/constants';

export function FixFieldsPanel() {
  const [status, setStatus] = useState('idle');
  const [analysis, setAnalysis] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const analyzeSessions = async () => {
    setStatus('analyzing');
    setError(null);

    try {
      const sessionsSnapshot = await getDocs(collection(db, 'sessions'));
      const sessions = sessionsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      const needsCreatedAt = sessions.filter(s => !s.createdAt);
      const needsUiVersion = sessions.filter(s => !s.uiVersion);

      setAnalysis({
        totalSessions: sessions.length,
        needsCreatedAt,
        needsUiVersion,
        sessions
      });

      setStatus('idle');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  };

  const applyFixes = async () => {
    if (!analysis) return;

    setStatus('fixing');
    setError(null);

    const fixResults = {
      fixed: [],
      errors: [],
      skipped: []
    };

    try {
      for (const session of analysis.sessions) {
        const updates = {};
        let needsUpdate = false;

        if (!session.createdAt) {
          if (session.startedAt) {
            updates.createdAt = session.startedAt;
            needsUpdate = true;
          } else {
            fixResults.skipped.push({
              sessionId: session.id,
              reason: 'No startedAt field'
            });
          }
        }

        if (!session.uiVersion) {
          updates.uiVersion = UI_VERSION;
          updates.uiChangelog = UI_CHANGELOG[UI_VERSION];
          needsUpdate = true;
        }

        if (needsUpdate) {
          try {
            const sessionRef = doc(db, 'sessions', session.id);
            await updateDoc(sessionRef, updates);
            fixResults.fixed.push({
              sessionId: session.id,
              updates
            });
          } catch (err) {
            fixResults.errors.push({
              sessionId: session.id,
              error: err.message
            });
          }
        }
      }

      setResults(fixResults);
      setStatus('complete');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  };

  const reset = () => {
    setStatus('idle');
    setAnalysis(null);
    setResults(null);
    setError(null);
  };

  return (
    <details className="admin-panel analysis-panel analysis-panel-dropdown fix-fields-panel" open>
      <summary className="admin-panel-heading analysis-panel-summary">
        <div>
          <h2><Wrench aria-hidden="true" />Fix Missing Fields</h2>
        </div>
        <ChevronDown className="analysis-panel-chevron" aria-hidden="true" />
      </summary>

      <div className="admin-panel-body">
        {/* Status Messages */}
        {status === 'analyzing' && (
          <div className="status-note">Analyzing sessions...</div>
        )}

        {status === 'fixing' && (
          <div className="status-note" style={{ background: 'rgba(255, 193, 7, 0.14)', color: '#856404' }}>
            Applying fixes...
          </div>
        )}

        {error && (
          <div className="status-note" style={{ background: 'rgba(220, 38, 38, 0.1)', color: '#a3402e' }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Analysis Results */}
        {analysis && status === 'idle' && (
          <div>
            <div className="admin-summary-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              <div className="admin-summary-card">
                <span className="admin-summary-label">Total</span>
                <span className="admin-summary-value">{analysis.totalSessions}</span>
              </div>
              <div className="admin-summary-card" style={{ borderColor: 'rgba(220, 38, 38, 0.2)' }}>
                <span className="admin-summary-label">Missing createdAt</span>
                <span className="admin-summary-value" style={{ color: '#dc2626' }}>
                  {analysis.needsCreatedAt.length}
                </span>
              </div>
              <div className="admin-summary-card" style={{ borderColor: 'rgba(255, 193, 7, 0.3)' }}>
                <span className="admin-summary-label">Missing uiVersion</span>
                <span className="admin-summary-value" style={{ color: '#f59e0b' }}>
                  {analysis.needsUiVersion.length}
                </span>
              </div>
            </div>

            {analysis.needsCreatedAt.length === 0 && analysis.needsUiVersion.length === 0 ? (
              <div className="status-note" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#166534' }}>
                <CheckCircle2 size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                All sessions complete
              </div>
            ) : (
              <>
                {(analysis.needsCreatedAt.length > 0 || analysis.needsUiVersion.length > 0) && (
                  <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--muted)' }}>
                    {analysis.needsCreatedAt.length > 0 && (
                      <p style={{ marginBottom: '0.5rem' }}>
                        • Will add <strong>createdAt</strong> to {analysis.needsCreatedAt.length} session{analysis.needsCreatedAt.length !== 1 ? 's' : ''}
                      </p>
                    )}
                    {analysis.needsUiVersion.length > 0 && (
                      <p style={{ marginBottom: '0.5rem' }}>
                        • Will add <strong>uiVersion {UI_VERSION}</strong> to {analysis.needsUiVersion.length} session{analysis.needsUiVersion.length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                )}

                <div className="status-note" style={{ background: 'rgba(255, 193, 7, 0.14)', color: '#856404', marginTop: '1rem' }}>
                  <AlertCircle size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                  This will modify your Firebase database
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                  <button
                    onClick={applyFixes}
                    className="admin-button admin-button-primary"
                    style={{ flex: 1 }}
                  >
                    Apply Fixes
                  </button>
                  <button
                    onClick={reset}
                    className="admin-button admin-button-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Fix Results */}
        {results && status === 'complete' && (
          <div>
            <div className="admin-summary-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              <div className="admin-summary-card" style={{ borderColor: 'rgba(34, 197, 94, 0.3)' }}>
                <span className="admin-summary-label">Fixed</span>
                <span className="admin-summary-value" style={{ color: '#16a34a' }}>
                  {results.fixed.length}
                </span>
              </div>
              {results.errors.length > 0 && (
                <div className="admin-summary-card" style={{ borderColor: 'rgba(220, 38, 38, 0.2)' }}>
                  <span className="admin-summary-label">Errors</span>
                  <span className="admin-summary-value" style={{ color: '#dc2626' }}>
                    {results.errors.length}
                  </span>
                </div>
              )}
              {results.skipped.length > 0 && (
                <div className="admin-summary-card">
                  <span className="admin-summary-label">Skipped</span>
                  <span className="admin-summary-value">{results.skipped.length}</span>
                </div>
              )}
            </div>

            {results.fixed.length > 0 && (
              <div className="status-note" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#166534', marginTop: '1rem' }}>
                <CheckCircle2 size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                <strong>Success!</strong> Go to Exports tab to download updated data.
              </div>
            )}

            {results.errors.length > 0 && (
              <details style={{ marginTop: '1rem' }}>
                <summary style={{ fontSize: '0.9rem', fontWeight: 600, color: '#dc2626', cursor: 'pointer' }}>
                  View {results.errors.length} error{results.errors.length !== 1 ? 's' : ''}
                </summary>
                <ul className="analysis-bullet-list" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  {results.errors.map((err, idx) => (
                    <li key={idx}>
                      <code style={{ fontSize: '0.8rem' }}>{err.sessionId}</code>: {err.error}
                    </li>
                  ))}
                </ul>
              </details>
            )}

            {results.skipped.length > 0 && (
              <details style={{ marginTop: '1rem' }}>
                <summary style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--muted)', cursor: 'pointer' }}>
                  View {results.skipped.length} skipped
                </summary>
                <ul className="analysis-bullet-list" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  {results.skipped.map((skip, idx) => (
                    <li key={idx}>
                      <code style={{ fontSize: '0.8rem' }}>{skip.sessionId}</code>: {skip.reason}
                    </li>
                  ))}
                </ul>
              </details>
            )}

            <button
              onClick={reset}
              className="admin-button admin-button-primary"
              style={{ marginTop: '1rem' }}
            >
              Run Again
            </button>
          </div>
        )}

        {/* Initial State */}
        {!analysis && !results && status === 'idle' && (
          <div>
            <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '1rem', lineHeight: 1.6 }}>
              This tool scans all sessions and adds missing <code style={{ fontSize: '0.85rem' }}>createdAt</code> and <code style={{ fontSize: '0.85rem' }}>uiVersion</code> fields. 
              Only adds missing fields—never modifies existing data.
            </p>

            <button
              onClick={analyzeSessions}
              className="admin-button admin-button-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.95rem',
                padding: '0.65rem 1.25rem'
              }}
            >
              <Play size={16} />
              Start Analysis
            </button>
          </div>
        )}
      </div>
    </details>
  );
}

// Made with Bob
