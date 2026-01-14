'use client';

import { useEffect, useMemo, useState } from 'react';
import AppShell from '@/components/AppShell';
import { supabase } from '@/lib/supabaseClient';

/* =======================
   Types
======================= */
type ContractOption = {
  id: string;
  contract_no: string;
};

type Installment = {
  id: string;
  due_date: string;
  amount: number;
  status: 'paid' | 'pending';
};

export default function ContractFinancialReportPage() {
  const [contracts, setContracts] = useState<ContractOption[]>([]);
  const [contractId, setContractId] = useState<string>('');
  const [data, setData] = useState<any>(null);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(false);

  /* =======================
     Load Contracts List
  ======================= */
  useEffect(() => {
    supabase
      .from('contracts')
      .select('id, contract_no')
      .order('created_at', { ascending: false })
      .then(({ data }) => setContracts(data || []));
  }, []);

  /* =======================
     Load Contract Report
  ======================= */
  const loadReport = async (id: string) => {
    setLoading(true);

    const { data: contract } = await supabase
      .from('contracts')
      .select(`
        id,
        contract_no,
        start_date,
        end_date,
        duration_months,
        rent_amount,
        pay_frequency,

        tenants (
          name,
          nationality,
          id_type,
          national_id,
          phone,
          email
        ),

        properties (
          code
        ),

        unit_type,
        unit_no,
        floor_no,
        unit_area
      `)
      .eq('id', id)
      .single();

    const { data: inst } = await supabase
      .from('installments')
      .select('*')
      .eq('contract_id', id)
      .order('due_date', { ascending: true });

    setData(contract);
    setInstallments(inst || []);
    setLoading(false);
  };

  /* =======================
     Calculations
  ======================= */
  const yearlyRent = useMemo(() => {
    if (!data) return 0;
    return data.rent_amount * 12;
  }, [data]);

  const totalContract = useMemo(() => {
    if (!data) return 0;
    return data.rent_amount * data.duration_months;
  }, [data]);

  const paid = useMemo(
    () => installments.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0),
    [installments]
  );

  const remaining = totalContract - paid;

  /* =======================
     UI
  ======================= */
  return (
    <AppShell title="تقرير مالي للعقد">
      {/* ===== Selector ===== */}
      <div className="card">
        <h3 className="card-title">اختيار العقد</h3>

        <select
          value={contractId}
          onChange={(e) => {
            setContractId(e.target.value);
            loadReport(e.target.value);
          }}
        >
          <option value="">اختر عقد</option>
          {contracts.map(c => (
            <option key={c.id} value={c.id}>
              {c.contract_no}
            </option>
          ))}
        </select>
      </div>

      {loading && <p>جاري تحميل التقرير...</p>}

      {data && (
        <>
          {/* ===== Info Cards ===== */}
          <div className="grid">
            <div className="card">
              <h4>بيانات المستأجر</h4>
              <p><b>الاسم:</b> {data.tenants.name}</p>
              <p><b>الجنسية:</b> {data.tenants.nationality || '-'}</p>
              <p><b>الهوية:</b> {data.tenants.id_type} - {data.tenants.national_id}</p>
              <p><b>الجوال:</b> {data.tenants.phone}</p>
              <p><b>البريد:</b> {data.tenants.email || '-'}</p>
            </div>

            <div className="card">
              <h4>بيانات الوحدة</h4>
              <p><b>العقار:</b> {data.properties.code}</p>
              <p><b>نوع الوحدة:</b> {data.unit_type || '-'}</p>
              <p><b>رقم الوحدة:</b> {data.unit_no || '-'}</p>
              <p><b>الدور:</b> {data.floor_no || '-'}</p>
              <p><b>المساحة:</b> {data.unit_area || '-'} م²</p>
            </div>

            <div className="card">
              <h4>بيانات العقد</h4>
              <p><b>رقم العقد:</b> {data.contract_no}</p>
              <p><b>بداية:</b> {data.start_date}</p>
              <p><b>نهاية:</b> {data.end_date}</p>
              <p><b>المدة:</b> {data.duration_months} شهر</p>
              <p><b>الدفع:</b> {data.pay_frequency}</p>
            </div>
          </div>

          {/* ===== Financial Summary ===== */}
          <div className="grid">
            <div className="card">
              <h4 className="muted">القيمة السنوية</h4>
              <div className="stat">{yearlyRent.toLocaleString()}</div>
            </div>

            <div className="card">
              <h4 className="muted">إجمالي العقد</h4>
              <div className="stat">{totalContract.toLocaleString()}</div>
            </div>

            <div className="card">
              <h4 className="muted">المدفوع</h4>
              <div className="stat success">{paid.toLocaleString()}</div>
            </div>

            <div className="card">
              <h4 className="muted">المتبقي</h4>
              <div className="stat warning">{remaining.toLocaleString()}</div>
            </div>
          </div>

          {/* ===== Installments Table ===== */}
          <div className="card">
            <h3 className="card-title">جدول سداد الدفعات</h3>

            <table className="table">
              <thead>
                <tr>
                  <th>تاريخ الاستحقاق</th>
                  <th>المبلغ</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {installments.map(i => (
                  <tr key={i.id}>
                    <td>{i.due_date}</td>
                    <td>{i.amount.toLocaleString()}</td>
                    <td>
                      {i.status === 'paid'
                        ? <span className="badge success">مدفوع</span>
                        : <span className="badge warning">غير مدفوع</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AppShell>
  );
}