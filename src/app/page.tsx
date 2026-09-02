'use client';
import Link from 'next/link';
import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ui/ProductCard';
import ContactSection from '@/components/sections/ContactSection';
import LiveNotificationMarquee from '@/components/ui/LiveNotificationMarquee';
import styles from './page.module.css';

interface HighlightItem {
  title: string;
  desc: string;
  icon: React.ReactNode;
}

interface ExamCategoryItem {
  name: string;
  cadre: string;
  tag: string;
  desc: string;
  icon: React.ReactNode;
}

const HIGHLIGHTS: HighlightItem[] = [
  {
    title: 'MOST UPDATED SYLLABUS',
    desc: 'Content aligned with the latest examination pattern.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
        <polyline points="10 10 13 13 18 8"/>
      </svg>
    )
  },
  {
    title: 'LATEST ADMINISTRATIVE INSTRUCTIONS',
    desc: 'Updated information based on current examination requirements.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    )
  },
  {
    title: 'CONCEPT-BASED NOTES & TABLES',
    desc: 'Important concepts explained clearly and systematically.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="3" rx="2"/>
        <path d="M3 9h18"/>
        <path d="M3 15h18"/>
        <path d="M9 3v18"/>
      </svg>
    )
  },
  {
    title: 'SIMPLE & EASY EXPLANATION',
    desc: 'Student-friendly explanations designed for easier understanding.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
        <path d="M9 18h6"/>
        <path d="M10 22h4"/>
      </svg>
    )
  },
  {
    title: 'EXAM-FOCUSED PREPARATION',
    desc: 'Resources designed specifically around competitive examinations.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="12" r="6"/>
        <circle cx="12" cy="12" r="2"/>
      </svg>
    )
  },
];

const EXAM_CATEGORIES: ExamCategoryItem[] = [
  {
    name: 'MTS',
    cadre: 'Multi-Tasking Staff',
    tag: 'MTS LDCE',
    desc: 'Postal Manual Vol V, Office Organization, Mathematics & General Awareness syllabus.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    )
  },
  {
    name: 'POSTMAN / MAIL GUARD',
    cadre: 'Postman & Mail Guard (MG)',
    tag: 'POSTMAN / MAILGUARD LDCE',
    desc: 'Postal Manual Vol VI & VII, India Post Products, Sorting Rules, Arithmetics & Reasoning.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
      </svg>
    )
  },
  {
    name: 'PA / SA',
    cadre: 'Postal Assistant / Sorting Assistant',
    tag: 'PA / SA LDCE',
    desc: 'Comprehensive syllabus for Postal Operations, SB Rules, POSB, PO Guide Part I & II, and RMS Logistics.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/>
      </svg>
    )
  }
];

export default function HomePage() {
  const { products, loading } = useProducts();
  
  const scrollToSection = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -90; // Navbar height offset
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Government / Postal Official Theme Top Banner */}
      <div className={styles.topGovBanner}>
        <span>Dedicated Departmental Study Materials & Guides for India Post Examinations</span>
      </div>

      {/* Live Scrolling Notification Marquee Banner */}
      <LiveNotificationMarquee />

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          {/* Left Side: Brand Message & Direct Career Heading */}
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>TENALI EXAMS PUBLISHERS</div>
            
            {/* Verification Badge */}
            <div className={styles.verificationBadge}>
              Updated as per Latest India Post Syllabus & Administrative Instructions
            </div>

            <h1 className={styles.heroTitle}>
              Pass Your Departmental LDCE Exams on the First Attempt
            </h1>

            <p className={styles.heroSubtitle}>
              Syllabus-aligned study guides for GDS to Postman, MTS & PA/SA. Find reliable resources that simplify learning, strengthen concepts, and help you prepare with confidence.
            </p>
            
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

            <div className={styles.heroTrust}>
              <div className={styles.heroTrustItem}>
                Quality learning resources for every stage of your departmental promotion.
              </div>
            </div>
          </div>

          {/* Right Side: Hero Visual & Social Proof Counter Bar */}
          <div className={styles.heroVisual}>
            <div className={styles.heroBannerContainer}>
              <div className={styles.ambientGlow}></div>
              <img
                src="/images/hero-graduates-books.jpg"
                alt="Successful Postal Exam Graduates with Tenali Exams Publishers Books"
                className={styles.heroBannerImage}
              />
            </div>

            {/* High-Trust Counter Bar */}
            <div className={styles.heroTrustCounterBar}>
              <div className={styles.counterItem}>
                <span className={styles.counterNumber}>10,000+</span>
                <span className={styles.counterLabel}>Postal Aspirants Guided</span>
              </div>
              <div className={styles.counterDivider} />
              <div className={styles.counterItem}>
                <span className={styles.counterNumber}>100%</span>
                <span className={styles.counterLabel}>Latest Syllabus Covered</span>
              </div>
              <div className={styles.counterDivider} />
              <div className={styles.counterItem}>
                <span className={styles.counterNumber}>All Mediums</span>
                <span className={styles.counterLabel}>Available</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className={styles.highlightsSection} aria-label="Key Benefits and Highlights">
        <div className="container">
          {/* Desktop Grid (Static 5-column) */}
          <div className={styles.highlightsDesktopGrid}>
            {HIGHLIGHTS.map((item, idx) => (
              <div key={idx} className={styles.highlightCard}>
                <div className={styles.highlightIconWrap}>
                  {item.icon}
                </div>
                <div className={styles.highlightContent}>
                  <h3 className={styles.highlightTitle}>{item.title}</h3>
                  <p className={styles.highlightDesc}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Continuous Auto-scrolling Marquee */}
        <div className={styles.highlightsMarqueeContainer} aria-hidden="true">
          <div className={styles.highlightsMarqueeTrack}>
            {[...HIGHLIGHTS, ...HIGHLIGHTS].map((item, idx) => (
              <div key={idx} className={styles.highlightCard}>
                <div className={styles.highlightIconWrap}>
                  {item.icon}
                </div>
                <div className={styles.highlightContent}>
                  <h3 className={styles.highlightTitle}>{item.title}</h3>
                  <p className={styles.highlightDesc}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Exam Categories */}
      <section id="exams" className={styles.section}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionPreTitle}>TARGETED PREPARATION</div>
            <h2 className={styles.sectionTitle}>Prepare for the Exam You’re Targeting</h2>
            <p className={styles.sectionSubtitle}>
              Select your examination cadre to explore syllabus-aligned guides and comprehensive study materials.
            </p>
            <div className={styles.titleDivider}></div>
          </div>

          <div className={styles.categoryGrid}>
            {EXAM_CATEGORIES.map((cat, idx) => (
              <Link href={`/study-materials?category=${encodeURIComponent(cat.name)}`} key={idx} className={styles.categoryCard}>
                <div className={styles.categoryCardHeader}>
                  <div className={styles.categoryIconWrap}>
                    {cat.icon}
                  </div>
                  <span className={styles.categoryTag}>{cat.tag}</span>
                </div>
                
                <div className={styles.categoryCardBody}>
                  <div className={styles.categoryCadre}>{cat.cadre}</div>
                  <h3 className={styles.categoryName}>{cat.name}</h3>
                  <p className={styles.categoryDesc}>{cat.desc}</p>
                </div>

                <div className={styles.categoryCardFooter}>
                  <span className={styles.categoryActionText}>Explore Books</span>
                  <span className={styles.categoryArrow}>→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Books */}
      <section id="books" className={`${styles.section} ${styles.sectionAlt}`}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Featured Exam Preparation Books</h2>
            <div className={styles.titleDivider}></div>
          </div>
          <div className={styles.featuredGrid}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', gridColumn: '1 / -1' }}>Loading products...</div>
            ) : (
              products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Dedicated Contact Us Section */}
      <ContactSection />
    </>
  );
}
