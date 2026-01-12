'use client';

import AppShell from '@/components/AppShell';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

/* =======================
   Types (مظبوطة)
======================= */

type InstallmentRow = {
  id: string;
  due_date: string;
  amount: number;
  status: 'pending' | 'paid' | 'late';
  contracts: {
    contract_no: string;
    tenants: { name: string }[];
    properties: { code: string }[];
  }[];
};

export default function PaymentsPage() {
  const [rows, setRows] = useState<InstallmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
  const { data, error } = await supabase
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

  if (error) {
    console.error(error);
    setRows([]);
  } else {
    const safeRows: InstallmentRow[] =
      (data || []).map((row: any) => ({
        id: row.id,
        due_date: row.due_date,
        amount: row.amount,
        status: row.status,
        contracts: Array.isArray(row.contracts) ? row.contracts : [],
      }));

    setRows(safeRows);
  }

  setLoading(false);
}

  return (
    <AppShell title="الاستحقاقات">
      <div className="card">
        <h3 className="card-title">الاستحقاقات والمدفوعات</h3>

        {loading ? (
          <p className="muted">جاري التحميل...</p>
        ) : rows.length === 0 ? (
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
              {rows.map((r) => {
                const contract = r.contracts?.[0];

                return (
                  <tr key={r.id}>
                    <td>{contract?.contract_no || '-'}</td>
                    <td>{contract?.properties?.[0]?.code || '-'}</td>
                    <td>{contract?.tenants?.[0]?.name || '-'}</td>
                    <td>{r.due_date}</td>
                    <td>{r.amount}</td>
                    <td>
                      {r.status === 'pending' && (
                        <span className="badge warning">قادم</span>
                      )}
                      {r.status === 'paid' && (
                        <span className="badge success">مدفوع</span>
                      )}
                      {r.status === 'late' && (
                        <span className="badge danger">متأخر</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  );
}