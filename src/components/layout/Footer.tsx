import React from 'react';
import Link from 'next/link';
import { BookOpen, ShieldCheck } from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';

export function Footer() {
  const socialLinks = [
    {
      name: 'Facebook',
      href: 'https://www.facebook.com/share/1JNKGiozCk/',
      ariaLabel: 'Follow Exam CAGO on Facebook',
      hoverColor: 'hover:bg-blue-600 hover:text-white',
      badgeColor: 'text-[#1877F2]',
      icon: (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      name: 'YouTube',
      href: 'https://youtube.com/@cagobd',
      ariaLabel: 'Subscribe to Exam CAGO on YouTube',
      hoverColor: 'hover:bg-red-600 hover:text-white',
      badgeColor: 'text-[#FF0000]',
      icon: (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    },
    {
      name: 'Telegram',
      href: 'https://t.me/cagobd',
      ariaLabel: 'Join Exam CAGO on Telegram',
      hoverColor: 'hover:bg-sky-500 hover:text-white',
      badgeColor: 'text-[#24A1DE]',
      icon: (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      ),
    },
    {
      name: 'WhatsApp',
      href: 'https://whatsapp.com/channel/0029VbCJ7dM35fLoBIct7j42',
      ariaLabel: 'Follow Exam CAGO on WhatsApp Channel',
      hoverColor: 'hover:bg-emerald-600 hover:text-white',
      badgeColor: 'text-[#25D366]',
      icon: (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12.004 0C5.372 0 0 5.372 0 12.004c0 2.115.55 4.18 1.6 6.002L.055 24l6.16-1.616a11.96 11.96 0 0 0 5.789 1.488h.005c6.627 0 12-5.373 12-12.005C24.009 5.372 18.636 0 12.004 0zm0 21.84a9.835 9.835 0 0 1-5.02-1.378l-.36-.214-3.733.98.996-3.64-.235-.374a9.85 9.85 0 0 1-1.51-5.21c0-5.438 4.423-9.86 9.867-9.86 2.634 0 5.11 1.026 6.972 2.889A9.813 9.813 0 0 1 21.867 12c0 5.44-4.424 9.84-9.863 9.84zm5.405-7.394c-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.942 1.165-.173.199-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.099-.198.05-.372-.025-.52-.074-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479c0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        </svg>
      ),
    },
  ];

  return (
    <footer className="border-t border-gray-200 bg-white text-gray-600">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Overview */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded bg-brand-red text-white">
                <BrandLogo className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold text-brand-red">EXAM CAGO</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Dedicated online examination and question bank system specifically designed for ICAB (Institute of Chartered Accountants of Bangladesh) Certificate Level students.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-200 w-fit">
              <ShieldCheck className="h-4 w-4" />
              <span>ICAB Certificate Level Syllabus Aligned</span>
            </div>
          </div>

          {/* Quick Links: Subjects */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-900 mb-4">
              ICAB Subjects
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/subjects/accounting" className="hover:text-brand-red transition-colors">
                  Accounting
                </Link>
              </li>
              <li>
                <Link href="/subjects/management-information" className="hover:text-brand-red transition-colors">
                  Management Information
                </Link>
              </li>
              <li>
                <Link href="/subjects/business-technology-and-finance" className="hover:text-brand-red transition-colors">
                  Business Technology and Finance
                </Link>
              </li>
              <li>
                <Link href="/subjects/taxation" className="hover:text-brand-red transition-colors">
                  Taxation
                </Link>
              </li>
              <li>
                <Link href="/subjects/assurance" className="hover:text-brand-red transition-colors">
                  Assurance
                </Link>
              </li>
              <li>
                <Link href="/subjects/business-law" className="hover:text-brand-red transition-colors">
                  Business Law
                </Link>
              </li>
              <li>
                <Link href="/subjects/information-technology" className="hover:text-brand-red transition-colors">
                  Information Technology
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform & Legal */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-900 mb-4">
              Platform & Legal
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="hover:text-brand-red transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-brand-red transition-colors">
                  Contact Support
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-brand-red transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-brand-red transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/subjects" className="hover:text-brand-red transition-colors">
                  All 7 Subjects
                </Link>
              </li>
            </ul>
          </div>

          {/* Follow Exam CAGO */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-900 mb-4">
              Follow Exam CAGO
            </h4>
            <p className="text-xs text-gray-500 mb-3 leading-relaxed">
              Join our student communities for syllabus updates, exam announcements, and study discussions.
            </p>
            <div className="flex flex-col gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.ariaLabel}
                  className="flex items-center gap-3 px-3 py-2 rounded-md border border-gray-200 bg-gray-50/70 text-xs font-medium text-gray-700 hover:border-gray-300 hover:bg-white transition-colors group"
                >
                  <span className={`p-1.5 rounded bg-white shadow-xs border border-gray-100 ${social.badgeColor} group-hover:scale-110 transition-transform`}>
                    {social.icon}
                  </span>
                  <span>{social.name}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} EXAM CAGO (examcago.com). All rights reserved.</p>
          <p className="text-gray-400">
            Independent educational platform designed for ICAB Certificate Level Exam Preparation.
          </p>
        </div>
      </div>
    </footer>
  );
}
