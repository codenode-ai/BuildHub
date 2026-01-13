import { Link, useLocation } from 'react-router-dom';
import { Building2, Users, Briefcase, DollarSign, LayoutDashboard, Menu, LogOut, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);

  const navigation = [
    { name: t('nav.dashboard'), href: '/', icon: LayoutDashboard },
    { name: t('nav.projects'), href: '/obras', icon: Building2 },
    { name: t('nav.clients'), href: '/clientes', icon: Users },
    { name: t('nav.employees'), href: '/funcionarios', icon: Briefcase },
    { name: t('nav.financial'), href: '/financeiro', icon: DollarSign },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Building2 className="h-6 w-6 text-primary" />
        <span className="ml-2 text-lg font-semibold">ERP Obras</span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b border-border bg-background px-4 xl:px-6">
        {/* Mobile menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="xl:hidden">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>

        <div className="flex flex-1 items-center justify-between">
          <div className="hidden xl:block">
            <h1 className="text-lg font-semibold">{t('auth.loginTitle')}</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Globe className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLanguage('pt')}>
                  Português {language === 'pt' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('en')}>
                  English {language === 'en' && '✓'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {user.email?.split('@')[0]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('auth.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-border xl:block">
          <SidebarContent />
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-4 xl:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
