'use client';

import AppShell from '@/components/AppShell';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type InstallmentRow = {
  id: string;
  due_date: string;
  amount: number;
  status: 'pending' | 'paid' | 'late';
  contracts: {
    contract_no: string;
    tenants: { name: string };
    properties: { code: string };
  };
};

export default function PaymentsPage() {
  const [rows, setRows] = useState<InstallmentRow[]>([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
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
  }

  return (
    <AppShell title="الاستحقاقات">
      <div className="card">
        <h3 className="card-title">الاستحقاقات والمدفوعات</h3>

        {rows.length === 0 ? (
          <p className="muted">لا توجد استحقاقات بعد</p>
        ) : (
          <table className="table">
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
                  <td>{r.contracts.contract_no}</td>
                  <td>{r.contracts.properties.code}</td>
                  <td>{r.contracts.tenants.name}</td>
                  <td>{r.due_date}</td>
                  <td>{r.amount}</td>
                  <td>
                    {r.status === 'pending' && <span className="badge warning">قادم</span>}
                    {r.status === 'paid' && <span className="badge success">مدفوع</span>}
                    {r.status === 'late' && <span className="badge danger">متأخر</span>}
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