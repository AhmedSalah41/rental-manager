'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';

type ChartRow = {
  month: string;
  paid: number;
  pending: number;
  total: number;
};

export default function MonthlyRevenueChart({ data }: { data: ChartRow[] }) {
  return (
    <div className="card">
      <h3 className="card-title">الإيرادات الشهرية</h3>

      <div style={{ width: '100%', height: 350 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip
              formatter={(v: number) => v.toLocaleString()}
              labelFormatter={(l) => `شهر ${l}`}
            />
            <Legend />

            <Bar dataKey="paid" fill="#22c55e" name="المدفوع" />
            <Bar dataKey="pending" fill="#f59e0b" name="المتبقي" />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#3b82f6"
              strokeWidth={3}
              name="الإجمالي"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}