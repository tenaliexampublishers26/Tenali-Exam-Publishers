import Link from 'next/link';
import {
  SUPPORT_EMAIL,
  WHATSAPP_CHANNEL_URL,
  WHATSAPP_CHAT_URL
} from '@/lib/data';
import styles from './Footer.module.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.footerGrid}>
          {/* Brand */}
          <div className={styles.footerBrand}>
            <div className={styles.footerLogo}>
              <img src="/images/logo.png" alt="Tenali Exams Publishers Official Logo" className={styles.footerLogoImg} width={44} height={44} />
              <span className={styles.footerLogoText}>TENALI EXAMS PUBLISHERS</span>
            </div>
            <p className={styles.footerTagline}>
              Excellence in Every Page. Quality exam preparation materials designed to help aspirants prepare with confidence.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <a href={`mailto:${SUPPORT_EMAIL}`} className={styles.footerEmail}>
                {SUPPORT_EMAIL}
              </a>
            </div>
          </div>

          {/* Company */}
          <div className={styles.footerSection}>
            <h4>COMPANY</h4>
            <Link href="/about" className={styles.footerLink}>About Us</Link>
            <Link href="/contact" className={styles.footerLink}>Contact Us</Link>
            <a href={WHATSAPP_CHANNEL_URL} target="_blank" rel="noopener noreferrer" className={styles.footerLink}>
              WhatsApp Channel
            </a>
            <Link href="/faq" className={styles.footerLink}>FAQ</Link>
          </div>

          {/* Shop */}
          <div className={styles.footerSection}>
            <h4>SHOP</h4>
            <Link href="/study-materials" className={styles.footerLink}>Study Materials</Link>
            <Link href="/study-materials?lang=en" className={styles.footerLink}>English Books</Link>
            <Link href="/study-materials?lang=te" className={styles.footerLink}>Telugu Books</Link>
            <Link href="/study-materials?lang=hi" className={styles.footerLink}>Hindi Books</Link>
          </div>

          {/* Customer Support */}
          <div className={styles.footerSection}>
            <h4>CUSTOMER SUPPORT</h4>
            <a href={WHATSAPP_CHAT_URL} target="_blank" rel="noopener noreferrer" className={styles.footerLink}>
              Chat on WhatsApp
            </a>
            <Link href="/track-order" className={styles.footerLink}>Track Order</Link>
            <Link href="/faq" className={styles.footerLink}>Shipping Information</Link>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p className={styles.footerCopy}>
            © {currentYear} Tenali Exams Publishers. All rights reserved.
          </p>
          <div className={styles.footerBottomLinks}>
            <Link href="/privacy-policy" className={styles.footerBottomLink}>Privacy Policy</Link>
            <Link href="/terms" className={styles.footerBottomLink}>Terms & Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
