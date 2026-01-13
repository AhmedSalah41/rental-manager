'use client';

import AppShell from '@/components/AppShell';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

/* =====================
   Types
===================== */

type Installment = {
  id: string;
  due_date: string;
  amount: number;
  status: 'pending' | 'paid';
};

type ContractSummary = {
  contract_id: string;
  contract_no: string;
  tenant_name: string;
  property_code: string;

  total: number;
  paid: number;
  remaining: number;

  current: Installment | null;
  installments: Installment[];
};

/* =====================
   Page
===================== */

export default function PaymentsPage() {
  const [contracts, setContracts] = useState<ContractSummary[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, []);

  /* =====================
     Load & Group Payments
  ===================== */

  async function loadPayments() {
    setLoading(true);

    const { data, error } = await supabase
      .from('installments')
      .select(`
        id,
        due_date,
        amount,
        status,
        contracts:contract_id (
          id,
          contract_no,
          tenants:tenant_id ( name ),
          properties:property_id ( code )
        )
      `)
      .order('due_date', { ascending: true });

    if (error || !data) {
      console.error(error);
      setContracts([]);
      setLoading(false);
      return;
    }

    const map = new Map<string, ContractSummary>();

    data.forEach((row: any) => {
      const c = row.contracts;
      if (!c) return;

      if (!map.has(c.id)) {
        map.set(c.id, {
          contract_id: c.id,
          contract_no: c.contract_no,
          tenant_name: c.tenants?.name ?? '-',
          property_code: c.properties?.code ?? '-',

          total: 0,
          paid: 0,
          remaining: 0,

          current: null,
          installments: [],
        });
      }

      const contract = map.get(c.id)!;

      contract.installments.push({
        id: row.id,
        due_date: row.due_date,
        amount: row.amount,
        status: row.status,
      });

      contract.total += row.amount;

      if (row.status === 'paid') {
        contract.paid += row.amount;
      }
    });

    map.forEach((c) => {
      c.remaining = c.total - c.paid;

      const pending = c.installments
        .filter(i => i.status === 'pending')
        .sort((a, b) => a.due_date.localeCompare(b.due_date));

      c.current = pending[0] || null;
    });

    setContracts(Array.from(map.values()));
    setLoading(false);
  }

  /* =====================
     Pay Current Installment
  ===================== */

  async function payInstallment(id: string) {
    await supabase
      .from('installments')
      .update({ status: 'paid' })
      .eq('id', id);

    loadPayments();
  }

  /* =====================
     UI
  ===================== */

  return (
    <AppShell title="الاستحقاقات">
      <div className="content-card">
        <div className="card-body">
          {loading ? (
            <p>جاري التحميل...</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th></th>
                  <th>العقد</th>
                  <th>العقار</th>
                  <th>المستأجر</th>
                  <th>القسط الحالي</th>
                  <th>المتبقي</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {contracts.map(c => (
                  <>
                    {/* ===== Main Row ===== */}
                    <tr key={c.contract_id}>
                      <td>
                        <button
                          className="btn btn-outline"
                          onClick={() =>
                            setOpen(open === c.contract_id ? null : c.contract_id)
                          }
                        >
                          {open === c.contract_id ? '▲' : '▼'}
                        </button>
                      </td>

                      <td>{c.contract_no}</td>
                      <td>{c.property_code}</td>
                      <td>{c.tenant_name}</td>

                      <td>
                        {c.current ? (
                          <>
                            {c.current.amount.toLocaleString()}
                            <br />
                            <small>{c.current.due_date}</small>
                          </>
                        ) : (
                          <span className="badge badge-success">مكتمل</span>
                        )}
                      </td>

                      <td>{c.remaining.toLocaleString()}</td>

                      <td>
                        {c.current && (
                          <button
                            className="btn btn-primary"
                            onClick={() => payInstallment(c.current!.id)}
                          >
                            دفع
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* ===== Expanded Installments ===== */}
                    {open === c.contract_id && (
                      <tr>
                        <td colSpan={7}>
                          <table className="data-table" style={{ background: '#fafafa' }}>
                            <thead>
                              <tr>
                                <th>التاريخ</th>
                                <th>المبلغ</th>
                                <th>الحالة</th>
                              </tr>
                            </thead>
                            <tbody>
                              {c.installments.map(i => (
                                <tr key={i.id}>
                                  <td>{i.due_date}</td>
                                  <td>{i.amount.toLocaleString()}</td>
                                  <td>
                                    {i.status === 'paid'
                                      ? <span className="badge badge-success">مدفوع</span>
                                      : <span className="badge badge-warning">قادم</span>}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppShell>
  );
}