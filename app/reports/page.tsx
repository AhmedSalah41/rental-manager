'use client';

import AppShell from '@/components/AppShell';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type ReportRow = {
  id: string;
  due_date: string;
  amount: number;
  status: 'paid' | 'pending';
  contract_no: string;
  tenant_name: string;
  property_code: string;
};

export default function ReportsPage() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, []);

  async function loadReport() {
    setLoading(true);

    let query = supabase
      .from('installments')
      .select(`
        id,
        due_date,
        amount,
        status,
        contracts:contract_id (
          contract_no,
          tenants:tenant_id ( name ),
          properties:property_id ( code )
        )
      `)
      .order('due_date', { ascending: true });

    if (from) query = query.gte('due_date', from);
    if (to) query = query.lte('due_date', to);

    const { data, error } = await query;

    if (error) {
      console.error(error);
      setRows([]);
      setLoading(false);
      return;
    }

    const normalized: ReportRow[] = (data ?? []).map((r: any) => ({
      id: r.id,
      due_date: r.due_date,
      amount: r.amount,
      status: r.status,
      contract_no: r.contracts?.contract_no ?? '-',
      tenant_name: r.contracts?.tenants?.name ?? '-',
      property_code: r.contracts?.properties?.code ?? '-',
    }));

    setRows(normalized);
    setLoading(false);
  }

  /* ===== Totals ===== */
  const total = useMemo(() => rows.reduce((s, r) => s + r.amount, 0), [rows]);
  const paid = useMemo(
    () => rows.filter(r => r.status === 'paid').reduce((s, r) => s + r.amount, 0),
    [rows]
  );
  const remaining = total - paid;
  const late = useMemo(
    () =>
      rows.filter(
        r => r.status === 'pending' && r.due_date < new Date().toISOString().slice(0, 10)
      ).reduce((s, r) => s + r.amount, 0),
    [rows]
  );

  return (
    <AppShell title="التقارير">
      {/* ===== Filters ===== */}
      <div className="card">
        <h3 className="card-title">فلترة التقرير</h3>
        <div className="form-grid">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <button className="primary-btn" onClick={loadReport}>
            تحديث التقرير
          </button>
        </div>
      </div>

      {/* ===== Summary ===== */}
      <div className="grid">
        <div className="card">
          <h4 className="muted">الإجمالي</h4>
          <p style={{ fontSize: 28, fontWeight: 700 }}>{total.toLocaleString()}</p>
        </div>

        <div className="card">
          <h4 className="muted">المدفوع</h4>
          <p style={{ fontSize: 28, fontWeight: 700, color: '#22c55e' }}>
            {paid.toLocaleString()}
          </p>
        </div>

        <div className="card">
          <h4 className="muted">المتبقي</h4>
          <p style={{ fontSize: 28, fontWeight: 700, color: '#f59e0b' }}>
            {remaining.toLocaleString()}
          </p>
        </div>

        <div className="card">
          <h4 className="muted">المتأخر</h4>
          <p style={{ fontSize: 28, fontWeight: 700, color: '#ef4444' }}>
            {late.toLocaleString()}
          </p>
        </div>
      </div>

      {/* ===== Table ===== */}
      <div className="card">
        <h3 className="card-title">تفاصيل التقرير</h3>

        {loading ? (
          <p>جاري التحميل...</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>العقد</th>
                <th>العقار</th>
                <th>المستأجر</th>
                <th>التاريخ</th>
                <th>المبلغ</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td>{r.contract_no}</td>
                  <td>{r.property_code}</td>
                  <td>{r.tenant_name}</td>
                  <td>{r.due_date}</td>
                  <td>{r.amount.toLocaleString()}</td>
                  <td>
                    {r.status === 'paid' ? (
                      <span className="badge badge-success">مدفوع</span>
                    ) : (
                      <span className="badge badge-warning">غير مدفوع</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  );
}