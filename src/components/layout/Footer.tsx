import React from 'react';
import Link from 'next/link';
import { BookOpen, ShieldCheck, CheckCircle2 } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white text-gray-600">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Overview */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded bg-brand-red text-white">
                <BookOpen className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold text-brand-red">EXAM CAGO</span>
            </div>
            <p className="text-sm text-gray-500 max-w-md leading-relaxed">
              Dedicated online examination and question bank system specifically designed for ICAB (Institute of Chartered Accountants of Bangladesh) Certificate Level students.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-200 w-fit">
              <ShieldCheck className="h-4 w-4" />
              <span>ICAB Certificate Level Syllabus Aligned</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-900 mb-4">
              ICAB Subjects
            </h4>
            <ul className="space-y-2.5 text-sm">
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
            <ul className="space-y-2.5 text-sm">
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
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} EXAM CAGO (examcago.com). All rights reserved.</p>
          <p className="text-gray-400">
            Designed exclusively for ICAB Certificate Level Exam Preparation.
          </p>
        </div>
      </div>
    </footer>
  );
}
