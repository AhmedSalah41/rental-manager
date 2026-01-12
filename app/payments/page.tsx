'use client';

import AppShell from '@/components/AppShell';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

/* =====================
   Types (للـ UI فقط)
===================== */
type PaymentRow = {
  id: string;
  due_date: string;
  amount: number;
  status: 'pending' | 'paid';
  contract_no: string;
  tenant_name: string;
  property_code: string;
};

/* =====================
   Page
===================== */
export default function PaymentsPage() {
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  /* =====================
     Load Data
  ===================== */
  async function load() {
    setLoading(true);

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
      setLoading(false);
      return;
    }

    /**
     * 🔥 التحويل السحري هنا
     * بنحوّل Array العلاقات لكائن بسيط
     */
    const normalized: PaymentRow[] = (data || []).map((r: any) => {
      const contract = r.contracts?.[0];

      return {
        id: r.id,
        due_date: r.due_date,
        amount: r.amount,
        status: r.status,
        contract_no: contract?.contract_no || '-',
        tenant_name: contract?.tenants?.[0]?.name || '-',
        property_code: contract?.properties?.[0]?.code || '-',
      };
    });

    setRows(normalized);
    setLoading(false);
  }

  /* =====================
     UI
  ===================== */
  return (
    <AppShell title="الاستحقاقات">
      <div className="content-card">
        <div className="card-body">
          <h3 className="card-title">الاستحقاقات والمدفوعات</h3>

          {loading ? (
            <p className="muted">جاري التحميل...</p>
          ) : rows.length === 0 ? (
            <p className="muted">لا توجد استحقاقات</p>
          ) : (
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
                    <td>{r.contract_no}</td>
                    <td>{r.property_code}</td>
                    <td>{r.tenant_name}</td>
                    <td>{r.due_date}</td>
                    <td>{r.amount.toLocaleString()}</td>
                    <td>
                      {r.status === 'paid' && (
                        <span className="badge badge-success">مدفوع</span>
                      )}
                      {r.status === 'pending' && (
                        <span className="badge badge-warning">قادم</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppShell>
  );
}