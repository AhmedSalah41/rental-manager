'use client';

import AppShell from '@/components/AppShell';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

/* =======================
   Types
======================= */

type ContractInfo = {
  contract_no: string;
  tenants: { name: string }[];
  properties: { code: string }[];
};

type InstallmentRow = {
  id: string;
  due_date: string;
  amount: number;
  status: 'pending' | 'paid' | 'late';
  contracts: ContractInfo[]; // ✅ ARRAY مش object
};

/* =======================
   Page
======================= */

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
      console.error('LOAD INSTALLMENTS ERROR:', error);
      setRows([]);
      setLoading(false);
      return;
    }

    // ✅ الحل الحقيقي هنا
    const safeRows: InstallmentRow[] = (data ?? []).map((r: any) => ({
      id: String(r.id),
      due_date: r.due_date,
      amount: Number(r.amount),
      status: r.status,
      contracts: Array.isArray(r.contracts) ? r.contracts : [],
    }));

    setRows(safeRows); // ✅ مفيش Type error
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
                <th>رقم العقد</th>
                <th>العقار</th>
                <th>المستأجر</th>
                <th>تاريخ الاستحقاق</th>
                <th>المبلغ</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const contract = r.contracts[0]; // ✅ أول عقد

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