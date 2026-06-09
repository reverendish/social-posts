'use client';
import { useState } from 'react';
import styles from './page.module.css';

function calculateDaysOverdue(invoiceDate: string, paymentTermsDays: number): number {
  const due = new Date(invoiceDate);
  due.setDate(due.getDate() + paymentTermsDays);
  const today = new Date();
  return Math.max(0, Math.floor((today.getTime() - due.getTime()) / 86400000));
}

export default function LatePaymentChaser() {
  const [creditorName, setCreditorName] = useState('');
  const [creditorCompany, setCreditorCompany] = useState('');
  const [debtorCompany, setDebtorCompany] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [paymentTermsDays, setPaymentTermsDays] = useState('30');
  const [tone, setTone] = useState<'polite' | 'firm' | 'final'>('polite');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const daysOverdue = invoiceDate && paymentTermsDays ? calculateDaysOverdue(invoiceDate, parseInt(paymentTermsDays)) : 0;

  const canGenerate = () => {
    return creditorName.trim() && creditorCompany.trim() && debtorCompany.trim() && invoiceNumber.trim() && invoiceAmount.trim() && invoiceDate && paymentTermsDays;
  };

  const generate = async () => {
    if (!canGenerate()) return;
    setLoading(true);
    setError('');
    setResult('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creditorName,
          creditorCompany,
          debtorCompany,
          invoiceNumber,
          invoiceAmount: parseFloat(invoiceAmount),
          invoiceDate,
          paymentTermsDays: parseInt(paymentTermsDays),
          daysOverdue,
          tone,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data.result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed. Try again.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const changeTone = (newTone: 'polite' | 'firm' | 'final') => {
    setTone(newTone);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Late Payment Chaser</h1>
        <p className={styles.subtitle}>Generate professional chasing letters citing UK statutory rights.</p>
      </div>

      <form className={styles.form} onSubmit={(e) => { e.preventDefault(); generate(); }}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Your name *</label>
          <input
            type="text"
            className={styles.input}
            placeholder="e.g. John Smith"
            value={creditorName}
            onChange={(e) => setCreditorName(e.target.value)}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Your company *</label>
          <input
            type="text"
            className={styles.input}
            placeholder="e.g. ABC Plumbing Ltd"
            value={creditorCompany}
            onChange={(e) => setCreditorCompany(e.target.value)}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Who owes you money? *</label>
          <input
            type="text"
            className={styles.input}
            placeholder="e.g. XYZ Construction Ltd"
            value={debtorCompany}
            onChange={(e) => setDebtorCompany(e.target.value)}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Invoice number *</label>
          <input
            type="text"
            className={styles.input}
            placeholder="e.g. INV-2024-001"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Invoice amount *</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: '14px', color: 'var(--muted)', fontSize: '0.9rem' }}>£</span>
            <input
              type="number"
              className={styles.input}
              placeholder="0.00"
              value={invoiceAmount}
              onChange={(e) => setInvoiceAmount(e.target.value)}
              step="0.01"
              min="0"
              style={{ paddingLeft: '28px' }}
              required
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Invoice date *</label>
          <input
            type="date"
            className={styles.input}
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Payment terms *</label>
          <select
            className={styles.select}
            value={paymentTermsDays}
            onChange={(e) => setPaymentTermsDays(e.target.value)}
            required
          >
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
            <option value="60">60 days</option>
            <option value="90">90 days</option>
          </select>
        </div>

        {invoiceDate && paymentTermsDays && (
          <div className={styles.overdueInfo}>
            This invoice is {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue.
          </div>
        )}

        <div className={styles.formGroup}>
          <label className={styles.label}>Tone *</label>
          <div className={styles.toneButtons}>
            <button
              type="button"
              className={`${styles.toneBtn} ${tone === 'polite' ? styles.toneBtnActive : ''}`}
              onClick={() => changeTone('polite')}
            >
              Polite Reminder
            </button>
            <button
              type="button"
              className={`${styles.toneBtn} ${tone === 'firm' ? styles.toneBtnActive : ''}`}
              onClick={() => changeTone('firm')}
            >
              Firm Notice
            </button>
            <button
              type="button"
              className={`${styles.toneBtn} ${tone === 'final' ? styles.toneBtnActive : ''}`}
              onClick={() => changeTone('final')}
            >
              Final Notice
            </button>
          </div>
        </div>

        <button
          type="submit"
          className={styles.generateBtn}
          disabled={!canGenerate() || loading}
        >
          {loading ? 'Generating…' : 'Generate letter'}
        </button>

        {error && <p className={styles.error}>{error}</p>}
      </form>

      {result && (
        <div className={styles.output}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: 0 }}>Generated letter</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => changeTone('polite')}
                className={`${styles.toneBtn} ${tone === 'polite' ? styles.toneBtnActive : ''}`}
                style={{ padding: '6px 12px', fontSize: '0.75rem' }}
              >
                Polite
              </button>
              <button
                onClick={() => changeTone('firm')}
                className={`${styles.toneBtn} ${tone === 'firm' ? styles.toneBtnActive : ''}`}
                style={{ padding: '6px 12px', fontSize: '0.75rem' }}
              >
                Firm
              </button>
              <button
                onClick={() => changeTone('final')}
                className={`${styles.toneBtn} ${tone === 'final' ? styles.toneBtnActive : ''}`}
                style={{ padding: '6px 12px', fontSize: '0.75rem' }}
              >
                Final
              </button>
              <button
                onClick={copyToClipboard}
                className={styles.copyBtn}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          <pre className={styles.outputText}>{result}</pre>
        </div>
      )}
    </div>
  );
}
