'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

type ChartRow = {
  month: string;
  paid: number;
  pending: number;
  total: number;
};

export default function MonthlyRevenueChart({
  data,
}: {
  data: ChartRow[];
}) {
  if (!data || data.length === 0) {
    return <p className="muted">لا توجد بيانات للرسم البياني</p>;
  }

  return (
    <div style={{ width: '100%', height: 320 }}>
      <ResponsiveContainer>
        <BarChart data={data}>
          <XAxis
            dataKey="month"
            tickFormatter={(m) => m.replace('-', '/')}
          />
          <YAxis />
          <Tooltip
            formatter={(value) =>
              typeof value === 'number'
                ? value.toLocaleString()
                : ''
            }
            labelFormatter={(label) => `شهر ${label}`}
          />
          <Legend />
          <Bar
            dataKey="paid"
            name="مدفوع"
            fill="#22c55e"
            radius={[6, 6, 0, 0]}
          />
          <Bar
            dataKey="pending"
            name="غير مدفوع"
            fill="#f59e0b"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}