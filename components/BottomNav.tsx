'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, Receipt, MessageCircle, Settings } from 'lucide-react';

const navItems = [
  { href: '/', icon: Home, label: 'Ana Sayfa' },
  { href: '/bill', icon: Receipt, label: 'Hesap' },
  { href: '/messages', icon: MessageCircle, label: 'Mesajlar' },
  { href: '/settings', icon: Settings, label: 'Ayarlar' },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  // Hide on certain pages
  const hiddenPaths = ['/login', '/onboarding', '/scan'];
  if (hiddenPaths.some(p => pathname.startsWith(p))) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-white/10 z-50 pb-safe">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          
          // Special styling for Bill (Hesap) - show badge if active order
          const isBill = item.href === '/bill';
          
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                isActive ? 'text-orange-500' : 'text-gray-500'
              }`}
            >
              <div className="relative">
                <Icon className={`w-6 h-6 ${isActive ? 'text-orange-500' : ''}`} />
                {isBill && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" 
                        id="bill-indicator" 
                        style={{ display: 'none' }} />
                )}
              </div>
              <span className={`text-xs ${isActive ? 'font-medium' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
