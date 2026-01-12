'use client';

import React, { useEffect, useState } from 'react';
import Topbar from './Topbar';
import Sidebar from './Sidebar';
import { supabase } from '../lib/supabaseClient';
import { usePathname, useRouter } from 'next/navigation';

type AppShellProps = {
  title?: string;
  children: React.ReactNode;
};

export default function AppShell({ title, children }: AppShellProps) {
  const [showMobile, setShowMobile] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const check = async () => {
      if (pathname === '/login') return;
      const { data } = await supabase.auth.getSession();
      if (!data.session) router.push('/login');
    };
    check();
  }, [pathname, router]);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      />

      <Topbar onToggleSidebar={() => setShowMobile((s) => !s)} />
      <Sidebar showMobile={showMobile} />

      <main className="main-content" id="mainContent">
        {title && <h1 className="page-title">{title}</h1>}
        {children}
      </main>
    </>
  );
}