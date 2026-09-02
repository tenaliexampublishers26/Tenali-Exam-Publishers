'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './LiveNotificationMarquee.module.css';

interface NotificationSettings {
  enabled: boolean;
  text: string;
  badge: string;
  link: string;
  speed: 'slow' | 'normal' | 'fast';
  direction: 'left-to-right' | 'right-to-left';
}

interface LiveNotificationMarqueeProps {
  initialSettings?: NotificationSettings;
}

export default function LiveNotificationMarquee({ initialSettings }: LiveNotificationMarqueeProps) {
  const [settings, setSettings] = useState<NotificationSettings | null>(initialSettings || null);
  const [loading, setLoading] = useState(!initialSettings);

  useEffect(() => {
    let isMounted = true;
    const fetchNotification = async () => {
      try {
        const res = await fetch('/api/settings/live-notification', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setSettings({
              enabled: Boolean(data.enabled),
              text: data.text || '',
              badge: data.badge || 'LIVE UPDATE',
              link: data.link || '#books',
              speed: data.speed || 'normal',
              direction: data.direction || 'left-to-right',
            });
          }
        }
      } catch (err) {
        console.error('Failed to load live notification:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchNotification();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading || !settings || !settings.enabled || !settings.text.trim()) {
    return null;
  }

  // Determine animation duration based on speed
  const durationMap = {
    fast: '18s',
    normal: '30s',
    slow: '45s',
  };
  const duration = durationMap[settings.speed] || '30s';

  const isLeftToRight = settings.direction === 'left-to-right';
  const animationClass = isLeftToRight ? styles.scrollLeftToRight : styles.scrollRightToLeft;

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const targetId = href.substring(1);
      const element = document.getElementById(targetId);
      if (element) {
        const yOffset = -90;
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }
  };

  const renderContentItem = (index: number) => {
    const isInternalHash = settings.link?.startsWith('#');
    const isExternal = settings.link?.startsWith('http');

    const inner = (
      <>
        <span className={styles.itemText}>{settings.text}</span>
        {settings.link && (
          <span className={styles.actionPill}>
            View Details &rarr;
          </span>
        )}
        <span className={styles.bulletDot}>✦</span>
      </>
    );

    if (!settings.link) {
      return (
        <span key={index} className={styles.item}>
          {inner}
        </span>
      );
    }

    if (isInternalHash) {
      return (
        <a
          key={index}
          href={settings.link}
          onClick={(e) => handleLinkClick(e, settings.link)}
          className={styles.item}
        >
          {inner}
        </a>
      );
    }

    if (isExternal) {
      return (
        <a
          key={index}
          href={settings.link}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.item}
        >
          {inner}
        </a>
      );
    }

    return (
      <Link key={index} href={settings.link} className={styles.item}>
        {inner}
      </Link>
    );
  };

  return (
    <div className={styles.marqueeWrapper} role="region" aria-label="Live Notice Scrolling Ticker">
      {/* Live Badge */}
      <div className={styles.badgeContainer}>
        <span className={styles.liveBeacon} />
        <span>{settings.badge || 'LIVE UPDATE'}</span>
      </div>

      {/* Scrolling Ticker Track */}
      <div className={styles.trackContainer}>
        <div className={styles.fadeLeft} />
        <div 
          className={`${styles.track} ${animationClass}`}
          style={{ '--marquee-duration': duration } as React.CSSProperties}
        >
          {/* Repeating sequence for continuous smooth loop */}
          {Array.from({ length: 6 }).map((_, idx) => renderContentItem(idx))}
        </div>
        <div className={styles.fadeRight} />
      </div>
    </div>
  );
}
