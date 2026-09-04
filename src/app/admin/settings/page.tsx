'use client';

import { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  AlertTriangle, 
  ShieldCheck, 
  Save, 
  Loader2, 
  Radio, 
  BellRing, 
  Bookmark, 
  ExternalLink,
  Sliders,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { Switch } from '@/components/ui/switch-button';
import { motion } from 'motion/react';
import { SPRING_UI, SPRING_PRESS } from '@/components/admin/AdminUI';

interface LiveNotificationState {
  enabled: boolean;
  text: string;
  badge: string;
  link: string;
  speed: 'slow' | 'normal' | 'fast';
  direction: 'left-to-right' | 'right-to-left';
}

const TEMPLATES = [
  {
    badge: 'FLASH UPDATE',
    text: 'Welcome postal aspirants! Latest 2026 Edition LDCE Guides for MTS, Postman & PA/SA are now available in all mediums.',
    link: '#books'
  },
  {
    badge: 'FREE DELIVERY',
    text: 'Free Shipping across all Postal Circles in India on orders of 2 or more LDCE exam guide books!',
    link: '#books'
  },
  {
    badge: 'NEW SYLLABUS',
    text: '100% Updated Postal Manual Volume V, VI & VII Notes & Objective Question Banks Ready for 2026 Exams.',
    link: '/study-materials'
  }
];

export default function AdminSettingsPage() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [notification, setNotification] = useState<LiveNotificationState>({
    enabled: true,
    text: 'Welcome to Tenali Exams Publishers! Latest 2026 Edition LDCE Guides for MTS, Postman & PA/SA are available now in all mediums.',
    badge: 'FLASH UPDATE',
    link: '#books',
    speed: 'normal',
    direction: 'left-to-right'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        const s = data.settings || {};
        
        if (s.maintenance_mode !== undefined) {
          setMaintenanceMode(s.maintenance_mode);
        }

        setNotification({
          enabled: s.live_notification_enabled !== undefined ? Boolean(s.live_notification_enabled) : true,
          text: s.live_notification_text || 'Welcome to Tenali Exams Publishers! Latest 2026 Edition LDCE Guides for MTS, Postman & PA/SA are available now in all mediums.',
          badge: s.live_notification_badge || 'FLASH UPDATE',
          link: s.live_notification_link || '#books',
          speed: (s.live_notification_speed as 'slow' | 'normal' | 'fast') || 'normal',
          direction: (s.live_notification_direction as 'left-to-right' | 'right-to-left') || 'left-to-right'
        });
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const saveAllSettings = async () => {
    setSaving(true);
    try {
      const payload = {
        settings: {
          maintenance_mode: maintenanceMode,
          live_notification_enabled: notification.enabled,
          live_notification_text: notification.text,
          live_notification_badge: notification.badge,
          live_notification_link: notification.link,
          live_notification_speed: notification.speed,
          live_notification_direction: notification.direction
        }
      };

      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error('Failed to update settings');
      
      toast.success('All settings saved successfully');
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const applyTemplate = (tmpl: typeof TEMPLATES[0]) => {
    setNotification(prev => ({
      ...prev,
      badge: tmpl.badge,
      text: tmpl.text,
      link: tmpl.link
    }));
    toast.success('Preset message applied! Click "Save Settings" to publish.');
  };

  if (loading) {
    return (
      <div className="admin-loading flex flex-col items-center justify-center p-16">
        <div className="admin-loading__spinner size-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="admin-loading__text font-medium text-slate-500">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING_UI}
        className="admin-page-header flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h2 className="admin-page-title text-2xl font-black text-(--color-text-primary) flex items-center gap-2.5">
            <SettingsIcon size={24} className="text-blue-600" />
            System & Notification Settings
          </h2>
          <p className="admin-page-desc text-sm text-(--color-text-secondary) mt-1">
            Manage live notification banner ticker, hero alerts, and global store states.
          </p>
        </div>

        <motion.button
          onClick={saveAllSettings}
          disabled={saving}
          whileTap={{ scale: 0.97 }}
          transition={SPRING_PRESS}
          className="btn btn-primary px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shrink-0 shadow-md shadow-blue-500/20 disabled:opacity-60"
        >
          {saving ? (
            <><Loader2 size={18} className="animate-spin" /> Saving Changes...</>
          ) : (
            <><Save size={18} /> Save All Settings</>
          )}
        </motion.button>
      </motion.div>

      {/* 1. HERO LIVE NOTIFICATION SCROLLING MARQUEE CARD */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING_UI, delay: 0.06 }}
        className="admin-card rounded-2xl border border-(--color-border) bg-(--color-bg-card) shadow-sm overflow-hidden"
      >
        {/* Header */}
        <div className="border-b border-(--color-border) p-6 bg-gradient-to-r from-red-500/10 via-amber-500/5 to-transparent flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-(--color-text-primary) flex items-center gap-2">
              <Radio className="text-red-500 animate-pulse" size={20} />
              Hero Live Notification Marquee (Scrolling Ticker)
            </h3>
            <p className="text-sm text-(--color-text-secondary) mt-1">
              Displays a continuous scrolling live notice ticker right after the top headline banner in the user hero section.
            </p>
          </div>

          {/* Toggle Button */}
          <div className="flex items-center gap-3 p-2 px-4 rounded-xl bg-(--color-bg-page) border border-(--color-border)">
            <Switch 
              value={notification.enabled}
              onToggle={() => setNotification(prev => ({ ...prev, enabled: !prev.enabled }))}
              iconOn={<Radio size={14} className="text-green-500" />}
              iconOff={<BellRing size={14} className="text-slate-400" />}
              className="scale-110"
            />
            <span className={`font-bold text-xs uppercase tracking-wider ${notification.enabled ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>
              {notification.enabled ? 'LIVE (ON)' : 'OFFLINE (OFF)'}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Live Preview Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-(--color-text-secondary) flex items-center gap-1.5">
                <Eye size={14} /> Real-time Live Preview
              </span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${notification.enabled ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400'}`}>
                {notification.enabled ? '● Currently Visible to Users' : '○ Hidden from Users'}
              </span>
            </div>

            <div className="rounded-xl overflow-hidden border border-slate-700/40 bg-[#0A1428] text-white p-0 shadow-inner">
              <div className="flex items-stretch min-h-[44px]">
                <div className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 font-extrabold text-xs tracking-wider uppercase shrink-0 shadow-md">
                  <span className="size-2 rounded-full bg-white animate-ping" />
                  {notification.badge || 'LIVE UPDATE'}
                </div>
                <div className="flex-1 flex items-center px-4 overflow-hidden text-sm text-slate-200">
                  <span className="truncate">{notification.text || 'Enter your announcement message below...'}</span>
                  {notification.link && (
                    <span className="ml-3 shrink-0 text-[11px] font-bold text-amber-400 bg-amber-400/20 px-2 py-0.5 rounded-full border border-amber-400/40">
                      View Details &rarr;
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-(--color-text-secondary) uppercase tracking-wider flex items-center gap-1.5">
              <Bookmark size={14} className="text-amber-500" /> Quick Message Presets
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {TEMPLATES.map((tmpl, idx) => (
                <motion.button
                  key={idx}
                  type="button"
                  onClick={() => applyTemplate(tmpl)}
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ y: -2 }}
                  transition={SPRING_PRESS}
                  className="text-left p-3 rounded-xl border border-(--color-border) bg-(--color-bg-hover) hover:border-blue-500/50 hover:bg-blue-500/5 transition-colors group"
                >
                  <span className="inline-block text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">
                    {tmpl.badge}
                  </span>
                  <p className="text-xs text-(--color-text-primary) line-clamp-2 leading-relaxed">
                    {tmpl.text}
                  </p>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Configuration Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-(--color-border)">
            {/* Notification Text */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-(--color-text-primary) uppercase tracking-wider flex items-center justify-between">
                <span>Announcement Message Text</span>
                <span className="text-[11px] font-normal text-(--color-text-muted)">
                  {notification.text.length} characters
                </span>
              </label>
              <textarea
                rows={3}
                value={notification.text}
                onChange={(e) => setNotification({ ...notification, text: e.target.value })}
                placeholder="Type your live scrolling announcement here..."
                className="w-full rounded-xl border border-(--color-border) bg-(--color-bg-page) p-3 text-sm text-(--color-text-primary) focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-y"
              />
            </div>

            {/* Badge Label */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-(--color-text-primary) uppercase tracking-wider">
                Live Badge Title
              </label>
              <input
                type="text"
                value={notification.badge}
                onChange={(e) => setNotification({ ...notification, badge: e.target.value })}
                placeholder="e.g., FLASH UPDATE, LIVE NOTICE"
                className="w-full rounded-xl border border-(--color-border) bg-(--color-bg-page) px-3.5 py-2.5 text-sm text-(--color-text-primary) focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Optional Target Link */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-(--color-text-primary) uppercase tracking-wider flex items-center gap-1.5">
                Target Link / Action <span className="text-[10px] text-(--color-text-muted) lowercase font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={notification.link}
                onChange={(e) => setNotification({ ...notification, link: e.target.value })}
                placeholder="#books or /study-materials"
                className="w-full rounded-xl border border-(--color-border) bg-(--color-bg-page) px-3.5 py-2.5 text-sm text-(--color-text-primary) focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Scroll Direction */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-(--color-text-primary) uppercase tracking-wider flex items-center gap-1.5">
                <Sliders size={14} /> Scroll Direction
              </label>
              <select
                value={notification.direction}
                onChange={(e) => setNotification({ ...notification, direction: e.target.value as any })}
                className="w-full rounded-xl border border-(--color-border) bg-(--color-bg-page) px-3.5 py-2.5 text-sm text-(--color-text-primary) focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none cursor-pointer"
              >
                <option value="left-to-right">Left to Right (Requested)</option>
                <option value="right-to-left">Right to Left (Standard)</option>
              </select>
            </div>

            {/* Scroll Speed */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-(--color-text-primary) uppercase tracking-wider flex items-center gap-1.5">
                <Sliders size={14} /> Scroll Speed
              </label>
              <select
                value={notification.speed}
                onChange={(e) => setNotification({ ...notification, speed: e.target.value as any })}
                className="w-full rounded-xl border border-(--color-border) bg-(--color-bg-page) px-3.5 py-2.5 text-sm text-(--color-text-primary) focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none cursor-pointer"
              >
                <option value="slow">Slow & Steady (45s)</option>
                <option value="normal">Normal (30s)</option>
                <option value="fast">Fast (18s)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer save */}
        <div className="p-4 bg-(--color-bg-hover) border-t border-(--color-border) flex items-center justify-between">
          <span className="text-xs text-(--color-text-muted) flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-green-500" />
            Changes take effect immediately on public pages upon saving.
          </span>
          <button 
            onClick={saveAllSettings}
            disabled={saving}
            className="btn btn-primary px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Notification Settings
          </button>
        </div>
      </motion.div>

      {/* 2. MAINTENANCE MODE CARD */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING_UI, delay: 0.12 }}
        className="admin-card rounded-2xl border border-(--color-border) bg-(--color-bg-card) shadow-sm overflow-hidden"
      >
        <div className="border-b border-(--color-border) p-6">
          <h3 className="text-lg font-bold text-(--color-text-primary) flex items-center gap-2">
            <ShieldCheck className="text-blue-500" size={20} />
            Store Maintenance Mode
          </h3>
          <p className="text-sm text-(--color-text-secondary) mt-1">
            Control the overall accessibility of the public-facing application.
          </p>
        </div>

        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-5 rounded-xl border border-orange-200 dark:border-orange-900/30 bg-orange-50/50 dark:bg-orange-900/10">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-orange-500" />
                <h4 className="text-base font-bold text-(--color-text-primary)">Maintenance Mode</h4>
              </div>
              <p className="text-sm text-(--color-text-secondary) leading-relaxed">
                When enabled, all public pages will be hidden behind a maintenance screen. 
                Users will see <span className="font-semibold text-(--color-text-primary)">&quot;Currently the application is on maintenance mode please try again later.&quot;</span>
                <br className="mb-1"/>
                <strong className="text-orange-600 dark:text-orange-400">Note:</strong> The admin dashboard will remain fully accessible to you.
              </p>
            </div>

            <div className="flex items-center shrink-0">
              <Switch 
                value={maintenanceMode}
                onToggle={() => setMaintenanceMode(!maintenanceMode)}
                iconOn={<ShieldCheck size={14} className="text-green-500" />}
                iconOff={<AlertTriangle size={14} className="text-orange-500" />}
                className="scale-125 mx-2"
              />
              <span className={`ml-4 font-bold text-sm ${maintenanceMode ? 'text-orange-600 dark:text-orange-400' : 'text-(--color-text-muted)'}`}>
                {maintenanceMode ? 'ENABLED' : 'DISABLED'}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-(--color-bg-hover) border-t border-(--color-border) flex justify-end">
          <motion.button
            onClick={saveAllSettings}
            disabled={saving}
            whileTap={{ scale: 0.97 }}
            transition={SPRING_PRESS}
            className="btn btn-primary px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Settings
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
