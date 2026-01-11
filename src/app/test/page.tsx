'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function TestPage() {
  const [msg, setMsg] = useState('Testing Supabase connection...');

  useEffect(() => {
    const run = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        setMsg('❌ Error: ' + error.message);
      } else {
        setMsg(
          '✅ Supabase connected successfully. Session: ' +
            (data.session ? 'YES' : 'NO')
        );
      }
    };

    run();
  }, []);

  return (
    <div style={{ padding: 20, fontSize: 18 }}>
      {msg}
    </div>
  );
}