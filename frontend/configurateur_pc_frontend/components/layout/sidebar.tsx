'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  Users,
  Settings,
  FileText,
  Store,
  LogOut,
  FolderTree,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Catégories', href: '/categories', icon: FolderTree },
  { name: 'Composants', href: '/components', icon: Package },
  { name: 'Utilisateurs', href: '/users', icon: Users },
  { name: 'Configurations', href: '/configurations', icon: FileText },
  { name: 'Partenaires', href: '/merchants', icon: Store },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <h1 className="text-lg font-semibold">ConfigurateurPC</h1>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-4">
        <div className="mb-2 px-3 text-xs font-medium text-sidebar-foreground/70">
          {user?.firstName} {user?.lastName}
        </div>
        <div className="mb-4 px-3 text-xs text-sidebar-foreground/50">
          {user?.email}
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={logout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Déconnexion
        </Button>
      </div>
    </div>
  );
}

