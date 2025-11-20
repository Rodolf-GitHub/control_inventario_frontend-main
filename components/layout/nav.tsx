'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Store, Package, ShoppingCart, Users, User } from 'lucide-react';

const navigation = [
  { name: 'Tiendas', href: '/', icon: Store, color: 'text-blue-500', activeColor: 'text-blue-600 bg-blue-50' },
  { name: 'Proveedores', href: '/proveedores', icon: Users, color: 'text-purple-500', activeColor: 'text-purple-600 bg-purple-50' },
  { name: 'Productos', href: '/productos', icon: Package, color: 'text-green-500', activeColor: 'text-green-600 bg-green-50' },
  { name: 'Compras', href: '/compras', icon: ShoppingCart, color: 'text-orange-500', activeColor: 'text-orange-600 bg-orange-50' },
  { name: 'Usuarios', href: '/usuarios', icon: User, color: 'text-indigo-500', activeColor: 'text-indigo-600 bg-indigo-50' },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-border bg-card">
      <div className="mx-auto max-w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-8 w-full justify-center">
            <div className="flex gap-2 sm:gap-4 flex-1 justify-evenly">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 rounded-lg px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-all ${
                      isActive
                        ? `${item.activeColor} shadow-sm scale-110`
                        : `${item.color} hover:bg-secondary/50 hover:scale-105`
                    }`}
                  >
                    <item.icon className="h-6 w-6 sm:h-7 sm:w-7" />
                    <span className="text-[10px] sm:text-sm">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
