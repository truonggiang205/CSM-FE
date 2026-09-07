import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { ConnectionBadge } from './ConnectionBadge';
import { CartDrawer } from '../cart/CartDrawer';

export function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-surface text-neutral-900">
      <Header />
      
      <main className="flex-1 w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      <Footer />
      <ConnectionBadge />
      
      <CartDrawer />
    </div>
  );
}
