'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, Search, ShoppingBag, User } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useI18n();

  const navItems = [
    { icon: Home, label: t.nav.home, href: '/' },
    { icon: Search, label: t.nav.discover, href: '/discover' },
    { icon: ShoppingBag, label: t.nav.orders, href: '/orders' },
    { icon: User, label: t.nav.profile, href: '/profile' },
  ];

  // Auth sayfalarında gösterme
  const hideOnPaths = ['/auth'];
  if (hideOnPaths.some(path => pathname.startsWith(path))) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-white/10 z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className="flex flex-col items-center justify-center flex-1 h-full"
            >
              <item.icon className={isActive ? 'w-6 h-6 text-orange-500' : 'w-6 h-6 text-gray-400'} />
              <span className={isActive ? 'text-xs mt-1 text-orange-500 font-medium' : 'text-xs mt-1 text-gray-400'}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
