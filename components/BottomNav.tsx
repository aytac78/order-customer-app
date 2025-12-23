'use client';

import { usePathname, useRouter } from 'next/navigation';
import { House, Wallet, MessageSquare, Cog } from 'lucide-react';

const navItems = [
  { href: '/', icon: House, label: 'Ana Sayfa' },
  { href: '/bill', icon: Wallet, label: 'Hesap' },
  { href: '/messages', icon: MessageSquare, label: 'Mesajlar' },
  { href: '/settings', icon: Cog, label: 'Ayarlar' },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  // Hide on certain pages
  const hiddenPaths = ['/login', '/onboarding', '/scan', '/auth'];
  if (hiddenPaths.some(p => pathname.startsWith(p))) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/95 backdrop-blur-lg border-t border-white/10 z-50 pb-safe">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all ${
                isActive ? 'text-orange-500' : 'text-gray-500'
              }`}
            >
              <div className={`relative ${isActive ? 'scale-110' : ''} transition-transform`}>
                <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
                {item.href === '/bill' && (
                  <span 
                    className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" 
                    id="bill-indicator" 
                    style={{ display: 'none' }} 
                  />
                )}
                {item.href === '/messages' && (
                  <span 
                    className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full" 
                    id="messages-indicator" 
                    style={{ display: 'none' }} 
                  />
                )}
              </div>
              <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-normal'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
