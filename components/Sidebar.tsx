'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

function itemClass(pathname: string, href: string) {
  return pathname === href ? 'active' : '';
}

export default function Sidebar({
  showMobile,
}: {
  showMobile: boolean;
}) {
  const pathname = usePathname();

  return (
    <aside className={`sidebar ${showMobile ? 'show' : ''}`} id="sidebar">
      <nav className="sidebar-nav">
        <ul>
          <li className={itemClass(pathname, '/dashboard')}>
            <Link href="/dashboard">
              <i className="fas fa-home" />
              <span>لوحة التحكم</span>
              <span />
            </Link>
          </li>

          <li className={itemClass(pathname, '/properties')}>
            <Link href="/properties">
              <i className="fas fa-building" />
              <span>العقارات</span>
              <span />
            </Link>
          </li>

          <li className={itemClass(pathname, '/tenants')}>
            <Link href="/tenants">
              <i className="fas fa-users" />
              <span>المستأجرين</span>
              <span />
            </Link>
          </li>

          <li className={itemClass(pathname, '/contracts')}>
            <Link href="/contracts">
              <i className="fas fa-file-contract" />
              <span>العقود</span>
              <span />
            </Link>
          </li>

          <li className={itemClass(pathname, '/payments')}>
            <Link href="/payments">
              <i className="fas fa-money-bill-wave" />
              <span>الاستحقاقات</span>
              <span />
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}