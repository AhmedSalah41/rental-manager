'use client';

import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import { supabase } from '../../lib/supabaseClient';

/* =======================
   Helpers
======================= */

function getInstallmentStatus(dueDate: string, status: string) {
  if (status === 'paid') return 'paid';

  const today = new Date();
  const due = new Date(dueDate);

  // نصفر الوقت عشان المقارنة تبقى مظبوطة
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  if (due < today) return 'late';
  return 'pending';
}

/* =======================
   Page
======================= */

export default function PaymentsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInstallments();
  }, []);

  async function loadInstallments() {
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

    if (!error) {
      setRows(data || []);
    }

    setLoading(false);
  }

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
              {rows.map((r) => {
                const computedStatus = getInstallmentStatus(
                  r.due_date,
                  r.status
                );

                return (
                  <tr key={r.id}>
                    <td>{r.contracts?.contract_no || '-'}</td>
                    <td>{r.contracts?.properties?.code || '-'}</td>
                    <td>{r.contracts?.tenants?.name || '-'}</td>
                    <td>{r.due_date}</td>
                    <td>
                      <strong>{r.amount}</strong>
                    </td>
                    <td>
                      {computedStatus === 'paid' && (
                        <span className="badge badge-success">مدفوع</span>
                      )}
                      {computedStatus === 'pending' && (
                        <span className="badge badge-warning">قادم</span>
                      )}
                      {computedStatus === 'late' && (
                        <span className="badge badge-danger">متأخر</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {!loading && rows.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: 'center',
                      color: 'var(--gray-color)',
                    }}
                  >
                    لا توجد استحقاقات بعد
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: 'center',
                      color: 'var(--gray-color)',
                    }}
                  >
                    جاري التحميل...
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