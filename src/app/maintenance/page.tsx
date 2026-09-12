import { Metadata } from 'next';
import MaintenanceClientCheck from '@/components/ui/MaintenanceClientCheck';

export const metadata: Metadata = {
  title: 'Maintenance Mode | Tenali Exam Publisher',
  description: 'Currently the application is on maintenance mode please try again later.',
};

export default function MaintenancePage() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-slate-50 dark:bg-[#1a1b1e] p-6 text-center">
      <div className="max-w-md w-full bg-white dark:bg-[#25262b] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center">
        
        {/* App Logo */}
        <div className="mb-6 relative w-24 h-24 sm:w-32 sm:h-32 drop-shadow-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.png" alt="Tenali Exam Publisher" className="w-full h-full object-contain" />
        </div>
        
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-4">
          Maintenance Mode
        </h1>
        
        <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed font-medium">
          Currently the application is on maintenance mode please try again later
        </p>

        <MaintenanceClientCheck />
      </div>
    </div>
  );
}
