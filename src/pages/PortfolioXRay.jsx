import React, { useRef, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Search, AlertTriangle, TrendingUp, Scale, Layers, ShieldAlert, ListOrdered, Sparkles, Plus, Trash2, Upload } from 'lucide-react';
import { orchestrate } from '../agents/orchestrator';
import { useAdvisor } from '../context/AdvisorContext';
import { MUTUAL_FUND_NAMES } from '../data/mutualFundNames.js';
import { parsePortfolioStatementFile } from '../utils/portfolioStatementParser.js';
import { formatIndian } from '../utils/formatIndian.js';

const fmtINR = (v) => `₹${Math.round(v).toLocaleString('en-IN')}`;

const COLORS = ['#fbbf24', '#818cf8', '#34d399', '#f472b6', '#60a5fa', '#fb923c', '#a78bfa'];

const createEmptyHolding = () => ({
  name: '',
  category: 'Large Cap',
  value: 0,
  investedValue: 0,
  startDate: new Date(new Date().setFullYear(new Date().getFullYear() - 2)).toISOString().slice(0, 10),
  expenseRatio: 1,
  topHoldings: [],
});

const PortfolioXRay = ({ addLog }) => {
  const { addMemory, markAreaOptimized } = useAdvisor();
  const [holdings, setHoldings] = useState(() => [createEmptyHolding()]);
  const [result, setResult] = useState(null);
  const [computing, setComputing] = useState(false);
  const [tableError, setTableError] = useState('');
  const [uploadStatus, setUploadStatus] = useState(null);
  const [hasStatement, setHasStatement] = useState(false);
  const [uploadWarnings, setUploadWarnings] = useState([]);
  const [parsingStatement, setParsingStatement] = useState(false);
  const statementInputRef = useRef(null);

  const analyze = () => {
    const hasData = holdings.some((h) => String(h.name || '').trim() && (Number(h.value) > 0 || Number(h.investedValue) > 0));
    if (!hasData) {
      setTableError('Add at least one fund with a name and current or invested value.');
      return;
    }
    setTableError('');
    setComputing(true);
    setTimeout(() => {
      const r = orchestrate('portfolio_xray', holdings, addLog);
      setResult(r);
      setComputing(false);
      addMemory('Reviewed Portfolio X-Ray for overlap and fees.');
      markAreaOptimized('portfolio');
    }, 500);
  };

  const updateHolding = (index, field, value) => {
    setHoldings((prev) => {
      const copy = [...prev];
      const numFields = ['value', 'investedValue', 'expenseRatio'];
      copy[index] = {
        ...copy[index],
        [field]: numFields.includes(field) ? Number(value) || 0 : field === 'startDate' ? value : value,
      };
      return copy;
    });
  };

  const addRow = () => setHoldings((prev) => [...prev, createEmptyHolding()]);
  const removeRow = (index) => setHoldings((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap-lg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ marginBottom: '0.35rem' }}>Mutual Fund Portfolio X-Ray</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6, fontWeight: 400 }}>Enter your mutual fund rows — XIRR, overlap, expense drag, and rebalancing.</p>
        </div>
        <button className="btn btn-primary" onClick={analyze} disabled={computing}>
          {computing ? 'Analyzing...' : <><Search size={16} /> Analyze Portfolio</>}
        </button>
      </div>

      {tableError && (
        <p style={{ fontSize: '0.85rem', color: 'var(--danger)', margin: 0 }}>{tableError}</p>
      )}

      <div className="glass-panel" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Upload size={16} color="var(--accent-gold)" />
          <span style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
            Upload CAMS/KFintech CSV statement to auto-reconstruct holdings.
          </span>
          <input
            ref={statementInputRef}
            id="portfolio-statement-upload"
            type="file"
            accept=".csv,text/csv,.txt"
            style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0, overflow: 'hidden' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setParsingStatement(true);
              setUploadStatus('Parsing statement and reconstructing holdings...');
              setUploadWarnings([]);

              parsePortfolioStatementFile(file)
                .then((parsed) => {
                  if (!parsed.holdings.length) {
                    setUploadStatus('Could not parse holdings from this file. Please verify CSV headers.');
                    setHasStatement(false);
                    return;
                  }
                  setHasStatement(true);
                  setHoldings(parsed.holdings);
                  setUploadWarnings(parsed.warnings || []);
                  setUploadStatus(`Loaded ${parsed.holdings.length} fund(s) from ${parsed.parsedRows} statement row(s).`);
                })
                .catch(() => {
                  setUploadStatus('Statement parsing failed. Use CSV export from CAMS/KFintech and retry.');
                })
                .finally(() => {
                  setParsingStatement(false);
                });
            }}
          />
          <label htmlFor="portfolio-statement-upload" className="btn btn-secondary" style={{ cursor: 'pointer' }}>
            <Upload size={14} /> Upload statement
          </label>
          {hasStatement && (
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem' }}
              onClick={() => {
                if (statementInputRef.current) statementInputRef.current.value = '';
                setHasStatement(false);
                setUploadStatus(null);
                setParsingStatement(false);
                setUploadWarnings([]);
              }}
            >
              Clear file
            </button>
          )}
        </div>
        {parsingStatement && <p style={{ marginTop: '0.6rem', fontSize: '0.8rem', color: 'var(--accent-gold)' }}>Parsing...</p>}
        {uploadStatus && <p style={{ marginTop: '0.6rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{uploadStatus}</p>}
        {uploadWarnings.length > 0 && (
          <ul style={{ marginTop: '0.4rem', paddingLeft: '1rem', color: 'var(--accent-amber)', fontSize: '0.78rem' }}>
            {uploadWarnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        )}
      </div>

      {/* Holdings Table */}
      <div className="glass-panel" style={{ padding: '1.25rem', overflowX: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Layers size={16} color="var(--accent-gold)" /> Your holdings
          </h3>
          <button type="button" className="btn btn-secondary" onClick={addRow} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Plus size={16} /> Add fund
          </button>
        </div>
        <datalist id="mf-name-suggestions">
          {MUTUAL_FUND_NAMES.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              {['Fund name', 'Category', 'Invested (₹)', 'Current (₹)', 'Start Date', 'P&L', ''].map((h) => (
                <th key={h || 'x'} style={{ textAlign: 'left', padding: '0.6rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {holdings.map((h, i) => {
              const pl = h.value - h.investedValue;
              const plPct = h.investedValue > 0 ? ((pl / h.investedValue) * 100).toFixed(1) : '—';
              return (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '0.6rem' }}>
                    <input
                      placeholder="Fund name"
                      value={h.name}
                      list="mf-name-suggestions"
                      autoComplete="off"
                      onChange={(e) => updateHolding(i, 'name', e.target.value)}
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '0.35rem 0.5rem', color: '#fff', fontSize: '0.85rem', width: '100%', minWidth: '140px' }}
                    />
                  </td>
                  <td style={{ padding: '0.6rem' }}>
                    <select value={h.category} onChange={(e) => updateHolding(i, 'category', e.target.value)} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: '#fff', borderRadius: '4px', padding: '4px', fontSize: '0.8rem' }}>
                      {['Large Cap', 'Mid Cap', 'Small Cap', 'Flexi Cap', 'Debt', 'Hybrid', 'Index'].map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '0.6rem' }}>
                    <input type="text" inputMode="numeric" placeholder="0" value={h.investedValue ? formatIndian(h.investedValue) : ''} onChange={(e) => { const v = e.target.value.replace(/[₹,\s]/g, ''); updateHolding(i, 'investedValue', v); }} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '0.35rem', color: '#fff', fontSize: '0.85rem', width: '100px' }} />
                  </td>
                  <td style={{ padding: '0.6rem' }}>
                    <input type="text" inputMode="numeric" placeholder="0" value={h.value ? formatIndian(h.value) : ''} onChange={(e) => { const v = e.target.value.replace(/[₹,\s]/g, ''); updateHolding(i, 'value', v); }} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '0.35rem', color: '#fff', fontSize: '0.85rem', width: '100px' }} />
                  </td>
                  <td style={{ padding: '0.6rem' }}>
                    <input
                      type="date"
                      value={h.startDate}
                      onChange={(e) => updateHolding(i, 'startDate', e.target.value)}
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '0.35rem', color: '#fff', fontSize: '0.82rem', width: '145px' }}
                    />
                  </td>
                  <td style={{ padding: '0.6rem', color: pl >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                    {h.investedValue > 0 ? <>{pl >= 0 ? '+' : ''}{fmtINR(pl)} ({plPct}%)</> : '—'}
                  </td>
                  <td style={{ padding: '0.6rem' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => removeRow(i)} disabled={holdings.length <= 1} title="Remove row" style={{ padding: '0.35rem 0.5rem' }}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Results */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap-lg)' }}>

          {/* KPI Strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
            {[
              { label: 'Total Value', value: fmtINR(result.totalValue), color: 'var(--accent-gold)' },
              { label: 'Total Invested', value: fmtINR(result.totalInvested), color: 'var(--text-secondary)' },
              { label: 'Absolute Return', value: `${result.absoluteReturnPct}%`, color: result.absoluteReturn >= 0 ? 'var(--success)' : 'var(--danger)' },
              { label: 'XIRR', value: result.xirr !== null ? `${result.xirr}%` : 'N/A', color: '#818cf8' },
              { label: 'Expense Drag/yr', value: fmtINR(result.expenseDrag), color: 'var(--danger)' },
            ].map((k, i) => (
              <div key={i} className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>{k.label}</p>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: k.color }}>{k.value}</h3>
              </div>
            ))}
          </div>

          {result.benchmarkComparison && (
            <div className="glass-panel" style={{ padding: '1rem 1.25rem', borderLeft: '3px solid #60a5fa' }}>
              <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>Benchmark comparison</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Benchmark: <strong style={{ color: '#dbeafe' }}>{result.benchmarkComparison.benchmarkName}</strong></p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Benchmark value: <strong style={{ color: '#dbeafe' }}>{fmtINR(result.benchmarkComparison.benchmarkValue)}</strong></p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Portfolio vs benchmark: <strong style={{ color: result.benchmarkComparison.excessReturnPct >= 0 ? 'var(--success)' : 'var(--danger)' }}>{result.benchmarkComparison.excessReturnPct.toFixed(2)}%</strong></p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  XIRR alpha:{' '}
                  <strong style={{ color: (result.benchmarkComparison.alphaXirr ?? 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {result.benchmarkComparison.alphaXirr == null ? 'N/A' : `${result.benchmarkComparison.alphaXirr.toFixed(2)}%`}
                  </strong>
                </p>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--section-gap-lg)' }}>
            {/* Allocation Pie */}
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Category Allocation</h3>
              <div style={{ height: '220px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={result.allocation} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3} stroke="none">
                      {result.allocation.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1c1c1c', border: '1px solid var(--border-gold)', borderRadius: '8px', fontSize: '0.85rem' }} formatter={(v) => fmtINR(v)} />
                    <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Overlap Analysis */}
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem' }}>Overlap Analysis</h3>
                <span style={{
                  padding: '3px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600,
                  background: result.overlapScore === 'High' ? 'rgba(239,68,68,0.15)' : result.overlapScore === 'Medium' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                  color: result.overlapScore === 'High' ? 'var(--danger)' : result.overlapScore === 'Medium' ? 'var(--accent-gold)' : 'var(--success)',
                }}>
                  {result.overlapScore} Overlap
                </span>
              </div>
              {result.overlaps.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '200px', overflowY: 'auto' }}>
                  {result.overlaps.map((o, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.6rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', fontSize: '0.83rem' }}>
                      <span style={{ fontWeight: 500 }}>{o.stock}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>in {o.funds.length} funds</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No significant overlap detected.</p>
              )}
            </div>
          </div>

          {result.structured?.summary && (
            <div className="glass-panel" style={{ padding: '1.1rem 1.25rem', borderLeft: '3px solid var(--accent-emerald)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Sparkles size={16} color="var(--accent-gold)" />
                <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>AI SUMMARY</span>
              </div>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.55, color: '#e5e7eb' }}>{result.structured.summary}</p>
              {result.structured.confidence != null && (
                <p style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Confidence: {result.structured.confidence}%</p>
              )}
            </div>
          )}

          {result.riskWarnings?.length > 0 && (
            <div style={{ padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.06)' }}>
              <h3 style={{ fontSize: '0.95rem', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={18} color="var(--danger)" /> Risk warnings
              </h3>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.85rem', color: '#fca5a5', lineHeight: 1.55 }}>
                {result.riskWarnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}

          {result.rebalancingSteps?.length > 0 && (
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ListOrdered size={18} color="var(--accent-gold)" /> Actionable rebalancing steps
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {result.rebalancingSteps.sort((a, b) => a.priority - b.priority).map((step, i) => (
                  <div key={i} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '3px solid var(--accent-emerald)', fontSize: '0.86rem', color: '#d1d5db', lineHeight: 1.5 }}>
                    <span style={{ color: 'var(--accent-gold)', fontWeight: 700, marginRight: '0.35rem' }}>#{step.priority || i + 1}</span>
                    {step.action}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                      {step.from} → {step.to}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rebalancing Suggestions */}
          {result.suggestions.length > 0 && (
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Scale size={18} color="var(--accent-gold)" /> Narrative suggestions
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {result.suggestions.map((s, i) => (
                  <div key={i} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: '3px solid var(--accent-amber)', fontSize: '0.88rem', color: '#d1d5db', lineHeight: 1.5 }}>
                    {s}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PortfolioXRay;
