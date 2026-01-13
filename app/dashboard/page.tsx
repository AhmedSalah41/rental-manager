'use client';

import AppShell from '@/components/AppShell';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

/* =====================
   Types
===================== */
type InstallmentRow = {
  id: string;
  amount: number;
  status: 'paid' | 'pending';
  due_date: string;
};

/* =====================
   Page
===================== */
export default function DashboardPage() {
  const router = useRouter();

  const [stats, setStats] = useState({
    properties: 0,
    tenants: 0,
    contracts: 0,
  });

  const [installments, setInstallments] = useState<InstallmentRow[]>([]);

  /* =====================
     Load Data
  ===================== */
  useEffect(() => {
    loadStats();
    loadInstallments();
  }, []);

  async function loadStats() {
    const { count: properties } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true });

    const { count: tenants } = await supabase
      .from('tenants')
      .select('*', { count: 'exact', head: true });

    const { count: contracts } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true });

    setStats({
      properties: properties || 0,
      tenants: tenants || 0,
      contracts: contracts || 0,
    });
  }

  async function loadInstallments() {
    const { data } = await supabase
      .from('installments')
      .select('id, amount, status, due_date');

    setInstallments(data || []);
  }

  /* =====================
     Calculations
  ===================== */
  const today = new Date().toISOString().slice(0, 10);

  const totalPaid = useMemo(
    () => installments
      .filter(i => i.status === 'paid')
      .reduce((s, i) => s + i.amount, 0),
    [installments]
  );

  const totalPending = useMemo(
    () => installments
      .filter(i => i.status === 'pending')
      .reduce((s, i) => s + i.amount, 0),
    [installments]
  );

  const lateCount = useMemo(
    () => installments.filter(
      i => i.status === 'pending' && i.due_date < today
    ).length,
    [installments]
  );

  /* =====================
     Chart
  ===================== */
  const chartData = {
    labels: ['مدفوع', 'قادم', 'متأخر'],
    datasets: [
      {
        label: 'الحالة',
        data: [
          totalPaid,
          totalPending,
          lateCount,
        ],
        backgroundColor: [
          '#22c55e',
          '#f59e0b',
          '#ef4444',
        ],
        borderRadius: 8,
      },
    ],
  };

  /* =====================
     UI
  ===================== */
  return (
    <AppShell title="لوحة التحكم">
      <div className="page-header">
        <div>
          <h1>لوحة التحكم</h1>
          <p>نظرة عامة على الأداء</p>
        </div>
      </div>

      {/* ===== KPI CARDS ===== */}
      <div className="grid">
        <div className="card">
          <h4 className="muted">إجمالي المدفوع</h4>
          <p className="stat success">{totalPaid.toLocaleString()}</p>
        </div>

        <div className="card">
          <h4 className="muted">إجمالي المتبقي</h4>
          <p className="stat warning">{totalPending.toLocaleString()}</p>
        </div>

        <div className="card">
          <h4 className="muted">أقساط متأخرة</h4>
          <p className="stat danger">{lateCount}</p>
        </div>
      </div>

      {/* ===== CHART ===== */}
      <div className="content-card">
        <div className="card-body">
          <h3 style={{ marginBottom: 16 }}>حالة التحصيل</h3>
          <Bar data={chartData} />
        </div>
      </div>

      {/* ===== SYSTEM STATS ===== */}
      <div className="grid">
        <div className="card">
          <h4 className="muted">العقارات</h4>
          <p className="stat">{stats.properties}</p>
        </div>

        <div className="card">
          <h4 className="muted">المستأجرين</h4>
          <p className="stat">{stats.tenants}</p>
        </div>

        <div className="card">
          <h4 className="muted">العقود</h4>
          <p className="stat">{stats.contracts}</p>
        </div>
      </div>
    </AppShell>
  );
}