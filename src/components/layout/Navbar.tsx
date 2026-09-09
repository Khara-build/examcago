'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Coins, User, LogOut, Menu, X, Shield, History } from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { logoutAction } from '@/app/actions/auth';

interface NavbarProps {
  user?: {
    email: string;
    role?: string;
  } | null;
  tokens?: number;
  onLogout?: () => void;
}

export function Navbar({ user, tokens = 0, onLogout }: NavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-red text-white shadow-sm transition-transform group-hover:scale-105">
              <BrandLogo className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-brand-red">
                EXAM CAGO
              </span>
              <span className="text-[10px] font-medium tracking-wider text-gray-500 uppercase">
                ICAB Exam Portal
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors ${
                isActive('/') ? 'text-brand-red font-semibold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Home
            </Link>
            <Link
              href="/subjects"
              className={`text-sm font-medium transition-colors ${
                pathname.startsWith('/subjects')
                  ? 'text-brand-red font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Subjects (7)
            </Link>
            {user && (
              <Link
                href="/dashboard"
                className={`text-sm font-medium transition-colors ${
                  pathname.startsWith('/dashboard')
                    ? 'text-brand-red font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Dashboard
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link
                href="/admin"
                className={`flex items-center gap-1 text-sm font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 hover:bg-amber-100 transition-colors`}
              >
                <Shield className="h-3.5 w-3.5" />
                Admin Panel
              </Link>
            )}
          </nav>
        </div>

        {/* Right CTA / Auth Status */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              {/* Token Counter */}
              <Link href="/dashboard/tokens">
                <Badge variant="brand" className="flex items-center gap-1.5 px-3 py-1 text-xs cursor-pointer hover:bg-red-100 transition-colors">
                  <Coins className="h-3.5 w-3.5 text-brand-red" />
                  <span className="font-semibold text-brand-red">{tokens} Tokens</span>
                </Badge>
              </Link>

              {/* User Dropdown / Dashboard Pill */}
              <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                <Link href="/dashboard/profile">
                  <span className="text-xs font-medium text-gray-700 hover:text-brand-red max-w-[150px] truncate block">
                    {user.email}
                  </span>
                </Link>

                {onLogout ? (
                  <button
                    onClick={onLogout}
                    title="Sign Out"
                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                ) : (
                  <form action={logoutAction}>
                    <button
                      type="submit"
                      title="Sign Out"
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </form>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">
                  Register
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Menu Toggle */}
        <div className="flex md:hidden items-center gap-2">
          {user && (
            <Link href="/dashboard/tokens">
              <Badge variant="brand" className="flex items-center gap-1 px-2 py-0.5 text-xs">
                <Coins className="h-3 w-3" />
                <span>{tokens}</span>
              </Badge>
            </Link>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-gray-200 bg-white px-4 pt-2 pb-6 space-y-3">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-gray-700 hover:text-brand-red"
          >
            Home
          </Link>
          <Link
            href="/subjects"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-gray-700 hover:text-brand-red"
          >
            Subjects (7)
          </Link>
          {user ? (
            <>
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-base font-medium text-gray-700 hover:text-brand-red"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/history"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-base font-medium text-gray-700 hover:text-brand-red"
              >
                Exam History
              </Link>
              <Link
                href="/dashboard/tokens"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-base font-medium text-gray-700 hover:text-brand-red"
              >
                Token Wallet ({tokens} tokens)
              </Link>
              {user.role === 'admin' && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-base font-medium text-amber-800 font-semibold"
                >
                  Admin Panel
                </Link>
              )}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-500 truncate">{user.email}</span>
                {onLogout ? (
                  <Button variant="danger" size="sm" onClick={onLogout}>
                    Sign Out
                  </Button>
                ) : (
                  <form action={logoutAction}>
                    <Button variant="danger" size="sm" type="submit">
                      Sign Out
                    </Button>
                  </form>
                )}
              </div>
            </>
          ) : (
            <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full">
                  Sign In
                </Button>
              </Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" className="w-full">
                  Register
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
