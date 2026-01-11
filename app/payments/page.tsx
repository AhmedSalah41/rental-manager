'use client';

import AppShell from '../../components/AppShell';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function PaymentsPage() {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('installments')
        .select(`
          id,
          due_date,
          amount,
          status,
          contracts (
            contract_no,
            tenants ( name ),
            properties ( code )
          )
        `)
        .order('due_date', { ascending: true });

      setRows(data || []);
    };
    load();
  }, []);

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <h1>الاستحقاقات</h1>
          <p>متابعة الأقساط والمدفوعات</p>
        </div>
      </div>

      <div className="content-card">
        <div className="card-body">
          <table className="data-table">
            <thead>
              <tr>
                <th>العقد</th>
                <th>العقار</th>
                <th>المستأجر</th>
                <th>تاريخ الاستحقاق</th>
                <th>المبلغ</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.contracts?.contract_no || '-'}</td>
                  <td>{r.contracts?.properties?.code || '-'}</td>
                  <td>{r.contracts?.tenants?.name || '-'}</td>
                  <td>{r.due_date}</td>
                  <td><strong>{r.amount}</strong></td>
                  <td>
                    {r.status === 'paid' && <span className="badge badge-success">مدفوع</span>}
                    {r.status === 'pending' && <span className="badge badge-warning">قادم</span>}
                    {r.status === 'late' && <span className="badge badge-danger">متأخر</span>}
                    {!['paid','pending','late'].includes(r.status) && <span className="badge">{r.status}</span>}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--gray-color)' }}>
                    لا توجد استحقاقات بعد
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}