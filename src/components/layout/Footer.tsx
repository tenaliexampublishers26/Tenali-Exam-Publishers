import Link from 'next/link';
import { MapPin, Navigation } from 'lucide-react';
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

        {/* Office Address & Google Map Section */}
        <div className={styles.footerLocationSection}>
          <div className={styles.locationInfoCard}>
            <div className={styles.locationBadge}>
              <MapPin size={15} />
              <span>Official Publisher Location</span>
            </div>
            <h3 className={styles.locationTitle}>Tenali Exams Publishers</h3>
            <address className={styles.locationAddress}>
              new canal, Near, LVN tent house road,<br />
              Namburu, Andhra Pradesh 522508
            </address>
            <p className={styles.locationNote}>
              Dedicated to delivering verified India Post exam preparation guides right to your doorstep.
            </p>
            <div className={styles.locationActions}>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Tenali+Exams+Publishers,+new+canal,+Near,+LVN+tent+house+road,+Namburu,+Andhra+Pradesh+522508"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.mapDirectionsBtn}
              >
                <Navigation size={15} />
                <span>Open in Google Maps</span>
              </a>
            </div>
          </div>

          <div className={styles.mapEmbedContainer}>
            <iframe
              title="Google Map Location - Tenali Exams Publishers"
              src="https://maps.google.com/maps?q=Tenali%20Exams%20Publishers,%20new%20canal,%20Near,%20LVN%20tent%20house%20road,%20Namburu,%20Andhra%20Pradesh%20522508&t=&z=15&ie=UTF8&iwloc=&output=embed"
              className={styles.mapIframe}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
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
