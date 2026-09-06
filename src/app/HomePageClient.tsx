/**
 * HomePageClient — thin client wrapper for interactive homepage elements.
 * 
 * Only the scroll-to-section handler needs to be a client component.
 * The bulk of the page is server-rendered HTML that is immediately visible
 * to users — no JavaScript required to see the content.
 */
'use client';
import { useCallback } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

interface HomePageClientActionsProps {
  className?: string;
}

export function useScrollToSection() {
  return useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -90; // Navbar height offset
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, []);
}

export default function HeroActions() {
  const scrollToSection = useScrollToSection();

  return (
    <div className={styles.heroActions}>
      <a
        href="#books"
        onClick={(e) => scrollToSection(e, 'books')}
        className={`btn btn-lg ${styles.ctaPrimaryRed}`}
      >
        Explore Our Books
      </a>
      <a
        href="#exams"
        onClick={(e) => scrollToSection(e, 'exams')}
        className="btn btn-secondary btn-lg"
      >
        View Categories
      </a>
    </div>
  );
}
