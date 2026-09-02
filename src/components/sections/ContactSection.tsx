'use client';
import { useState } from 'react';
import {
  COMPANY_PHONE,
  COMPANY_ADDRESS,
  WHATSAPP_CHAT_URL,
  WHATSAPP_CHANNEL_URL,
  WHATSAPP_NUMBER,
  SUPPORT_EMAIL
} from '@/lib/data';
import { isValidEmail, isValidMobile } from '@/lib/utils';
import { useToast } from '@/contexts/ToastContext';
import { CheckCircle2, MessageCircle, Send, ExternalLink, Mail, Phone, MapPin } from 'lucide-react';
import styles from './ContactSection.module.css';

interface ContactForm {
  fullName: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function ContactSection(): React.JSX.Element {
  const toast = useToast();
  const [form, setForm] = useState<ContactForm>({
    fullName: '',
    phone: '',
    email: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [lastWhatsAppUrl, setLastWhatsAppUrl] = useState<string>('');

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required';
    if (!form.phone.trim()) {
      errs.phone = 'Phone number is required';
    } else if (!isValidMobile(form.phone)) {
      errs.phone = 'Enter a valid 10-digit mobile number';
    }
    if (!form.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!isValidEmail(form.email)) {
      errs.email = 'Enter a valid email address';
    }
    if (!form.subject.trim()) errs.subject = 'Subject is required';
    if (!form.message.trim()) {
      errs.message = 'Message is required';
    } else if (form.message.trim().length < 5) {
      errs.message = 'Message must be at least 5 characters';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    // Build formatted WhatsApp message
    const formattedMsg =
      `*New Website Enquiry — Tenali Exams Publishers*\n\n` +
      `👤 *Name:* ${form.fullName.trim()}\n` +
      `📱 *Phone:* ${form.phone.trim()}\n` +
      `✉️ *Email:* ${form.email.trim()}\n` +
      `📌 *Subject:* ${form.subject.trim()}\n\n` +
      `💬 *Message / Query:*\n${form.message.trim()}`;

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(formattedMsg)}`;
    setLastWhatsAppUrl(whatsappUrl);

    // Open WhatsApp directly
    if (typeof window !== 'undefined') {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }

    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast.success('Enquiry compiled! Opening WhatsApp chat directly...');
    }, 600);
  };

  const handleChange = (field: keyof ContactForm, val: string): void => {
    setForm(prev => ({ ...prev, [field]: val }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  return (
    <section id="contact" className={styles.section}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <div className={styles.badge}>REACH OUT TO US</div>
          <h2 className={styles.title}>Contact &amp; Customer Support</h2>
          <p className={styles.subtitle}>
            Have questions regarding book editions, syllabus coverage, or order status? We are here to assist you directly.
          </p>
          <div className={styles.titleDivider}></div>
        </div>

        <div className={styles.grid}>
          {/* Company Details & Instant Connect */}
          <div className={styles.infoCol}>
            <div className={styles.infoCard}>
              <div className={styles.companyHeader}>
                <div className={styles.publisherBadge}>OFFICIAL PUBLISHER</div>
                <h3 className={styles.companyName}>TENALI EXAMS PUBLISHERS</h3>
                <p className={styles.tagline}>Excellence in Every Page</p>
              </div>

              <div className={styles.contactDetails}>
                <div className={styles.detailItem}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <MessageCircle size={18} color="#25D366" />
                    <div className={styles.detailLabel}>Direct WhatsApp Support</div>
                  </div>
                  <a
                    href={WHATSAPP_CHAT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.phoneLink}
                  >
                    +91 {COMPANY_PHONE} (Chat with Team)
                  </a>
                </div>

                <div className={styles.detailItem}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Mail size={18} color="var(--color-primary)" />
                    <div className={styles.detailLabel}>Official Support Email</div>
                  </div>
                  <a href={`mailto:${SUPPORT_EMAIL}`} className={styles.emailLink}>
                    {SUPPORT_EMAIL}
                  </a>
                </div>

                <div className={styles.detailItem}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <MapPin size={18} color="var(--color-primary)" />
                    <div className={styles.detailLabel}>Registered Address</div>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    {COMPANY_ADDRESS.line1}, {COMPANY_ADDRESS.line2}, {COMPANY_ADDRESS.line3}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className={styles.quickActions}>
                <a
                  href={WHATSAPP_CHAT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.whatsappBtn}
                >
                  <svg className={styles.btnIcon} viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24zm4.78 11.64c-.2-.1-.1.1-.38-.04l-1.39-.68c-.2-.1-.35-.15-.5.08-.15.22-.58.74-.71.89-.13.15-.26.17-.53.04-.26-.13-1.11-.41-2.11-1.3-.78-.7-1.31-1.56-1.46-1.83-.15-.26-.02-.41.11-.54.12-.12.26-.31.39-.46.13-.15.17-.26.26-.44.09-.17.04-.33-.02-.46-.07-.13-.59-1.42-.81-1.95-.21-.51-.43-.44-.59-.45h-.51c-.17 0-.46.07-.7.33-.24.26-.93.91-.93 2.22s.95 2.58 1.08 2.76c.13.17 1.87 2.86 4.53 4.01.63.27 1.13.44 1.51.56.64.2 1.22.17 1.68.1.51-.08 1.57-.64 1.79-1.26.22-.62.22-1.15.15-1.26-.07-.1-.26-.17-.53-.3z" />
                  </svg>
                  Chat on WhatsApp
                </a>

                <a
                  href={WHATSAPP_CHANNEL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.channelBtn}
                >
                  Join WhatsApp Channel
                </a>
              </div>
            </div>
          </div>

          {/* Enquiry Form */}
          <div className={styles.formCol}>
            <div className={styles.formCard}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <h3 className={styles.formTitle} style={{ margin: 0 }}>Send an Enquiry</h3>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'rgba(37, 211, 102, 0.12)',
                  color: '#166534',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: '12px',
                  border: '1px solid rgba(37, 211, 102, 0.3)'
                }}>
                  <MessageCircle size={12} color="#25D366" />
                  Direct WhatsApp Connect
                </span>
              </div>
              <p className={styles.formSubtitle}>
                Fill in your details and click below to send your query directly to our WhatsApp support team.
              </p>

              {submitted ? (
                <div className={styles.successBox}>
                  <div className={styles.successIcon} style={{ display: 'flex', justifyContent: 'center' }}>
                    <CheckCircle2 size={46} color="#10b981" />
                  </div>
                  <h4 className={styles.successHeading}>Enquiry Sent to WhatsApp!</h4>
                  <p className={styles.successText}>
                    Your message has been compiled for <strong>{form.fullName}</strong> ({form.phone}). WhatsApp has been opened in a new tab.
                  </p>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '16px' }}>
                    {lastWhatsAppUrl && (
                      <a
                        href={lastWhatsAppUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                      >
                        <ExternalLink size={14} /> Re-open WhatsApp Chat
                      </a>
                    )}
                    <button
                      className={styles.submitAnotherBtn}
                      onClick={() => {
                        setSubmitted(false);
                        setForm({ fullName: '', phone: '', email: '', subject: '', message: '' });
                      }}
                    >
                      Submit Another Enquiry
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className={styles.form}>
                  <div className={styles.formGroup}>
                    <label className={styles.label} htmlFor="enquiry-name">
                      Full Name <span className={styles.req}>*</span>
                    </label>
                    <input
                      id="enquiry-name"
                      type="text"
                      className={`${styles.input} ${errors.fullName ? styles.inputError : ''}`}
                      placeholder="e.g. Ramesh Kumar"
                      value={form.fullName}
                      onChange={(e) => handleChange('fullName', e.target.value)}
                    />
                    {errors.fullName && <span className={styles.errorMsg}>{errors.fullName}</span>}
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.label} htmlFor="enquiry-phone">
                        Phone Number <span className={styles.req}>*</span>
                      </label>
                      <input
                        id="enquiry-phone"
                        type="tel"
                        className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
                        placeholder="10-digit mobile number"
                        value={form.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                      />
                      {errors.phone && <span className={styles.errorMsg}>{errors.phone}</span>}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label} htmlFor="enquiry-email">
                        Email Address <span className={styles.req}>*</span>
                      </label>
                      <input
                        id="enquiry-email"
                        type="email"
                        className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                        placeholder="yourname@gmail.com"
                        value={form.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                      />
                      {errors.email && <span className={styles.errorMsg}>{errors.email}</span>}
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label} htmlFor="enquiry-subject">
                      Subject <span className={styles.req}>*</span>
                    </label>
                    <input
                      id="enquiry-subject"
                      type="text"
                      className={`${styles.input} ${errors.subject ? styles.inputError : ''}`}
                      placeholder="e.g. MTS Book availability / Postal Exam Guidance"
                      value={form.subject}
                      onChange={(e) => handleChange('subject', e.target.value)}
                    />
                    {errors.subject && <span className={styles.errorMsg}>{errors.subject}</span>}
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label} htmlFor="enquiry-message">
                      Message <span className={styles.req}>*</span>
                    </label>
                    <textarea
                      id="enquiry-message"
                      rows={4}
                      className={`${styles.textarea} ${errors.message ? styles.inputError : ''}`}
                      placeholder="Please write your questions or the exam books you are looking for..."
                      value={form.message}
                      onChange={(e) => handleChange('message', e.target.value)}
                    ></textarea>
                    {errors.message && <span className={styles.errorMsg}>{errors.message}</span>}
                  </div>

                  <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={loading}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24zm4.78 11.64c-.2-.1-.1.1-.38-.04l-1.39-.68c-.2-.1-.35-.15-.5.08-.15.22-.58.74-.71.89-.13.15-.26.17-.53.04-.26-.13-1.11-.41-2.11-1.3-.78-.7-1.31-1.56-1.46-1.83-.15-.26-.02-.41.11-.54.12-.12.26-.31.39-.46.13-.15.17-.26.26-.44.09-.17.04-.33-.02-.46-.07-.13-.59-1.42-.81-1.95-.21-.51-.43-.44-.59-.45h-.51c-.17 0-.46.07-.7.33-.24.26-.93.91-.93 2.22s.95 2.58 1.08 2.76c.13.17 1.87 2.86 4.53 4.01.63.27 1.13.44 1.51.56.64.2 1.22.17 1.68.1.51-.08 1.57-.64 1.79-1.26.22-.62.22-1.15.15-1.26-.07-.1-.26-.17-.53-.3z" />
                    </svg>
                    <span>{loading ? 'Connecting to WhatsApp...' : 'Send Enquiry via WhatsApp'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
