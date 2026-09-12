'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function MaintenanceClientCheck() {
  const router = useRouter();

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/settings/maintenance');
        if (res.ok) {
          const data = await res.json();
          if (!data.maintenanceMode) {
            router.replace('/');
          }
        }
      } catch {
        // Safe fallback
      }
    };

    const interval = setInterval(check, 10_000);
    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 w-full flex justify-center">
      <Link
        href="/login?redirect=/admin"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-blue-500 transition-colors"
      >
        <ShieldAlert size={13} />
        Administrator Login
      </Link>
    </div>
  );
}
