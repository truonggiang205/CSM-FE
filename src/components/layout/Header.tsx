import { Link } from 'react-router-dom';
import { ShoppingCart, Search, MapPin, User as UserIcon } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useSystemStore } from '../../store/systemStore';
import { useSessionStore } from '../../store/sessionStore';
import { mockBranches } from '../../mocks/inventory.mock';

export function Header() {
  const { items, toggleCart } = useCartStore();
  const { branchId, setBranchId } = useSystemStore();
  const { user } = useSessionStore();
  
  const cartItemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 w-full bg-brand-primary/95 backdrop-blur-md text-white shadow-md border-b border-brand-primary-dark/20">
      <div className="mx-auto flex min-h-[4rem] py-3 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-black text-2xl tracking-tight shrink-0 group">
          <div className="bg-white text-brand-primary p-1.5 rounded-lg shadow-sm group-hover:scale-105 transition-transform">
            <ShoppingCart size={24} />
          </div>
          <span className="hidden sm:block bg-gradient-to-r from-white to-neutral-200 bg-clip-text text-transparent">CSM</span>
        </Link>

        {/* Search Bar */}
        <div className="hidden md:flex flex-1 max-w-xl relative group">
          <input 
            type="text" 
            placeholder="Tìm kiếm sản phẩm..." 
            className="w-full rounded-full py-2.5 pl-5 pr-12 text-neutral-900 bg-white/95 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent shadow-inner transition-all"
          />
          <div className="absolute right-1 top-1 bottom-1 w-10 flex items-center justify-center bg-brand-primary rounded-full text-white cursor-pointer hover:bg-brand-primary-dark transition-colors">
            <Search size={18} />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3 sm:gap-5 shrink-0">
          
          {/* Branch Selector */}
          <div className="hidden lg:flex items-center gap-2 bg-black/10 hover:bg-black/20 transition-colors px-3 py-1.5 rounded-full border border-white/10">
            <MapPin size={16} className="text-brand-accent" />
            <select 
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="bg-transparent text-sm font-semibold focus:outline-none cursor-pointer appearance-none outline-none"
            >
              {mockBranches.map(branch => (
                <option key={branch.id} value={branch.id} className="text-neutral-900">{branch.name}</option>
              ))}
            </select>
          </div>

          {/* User / Login */}
          <Link to={user ? "/profile" : "/login"} className="flex items-center gap-2 hover:bg-black/10 px-3 py-1.5 rounded-full transition-colors">
            <div className="bg-white/20 p-1 rounded-full">
              <UserIcon size={18} />
            </div>
            <span className="hidden sm:inline-block text-sm font-semibold">
              {user ? user.name : 'Đăng nhập'}
            </span>
          </Link>

          {/* Cart Toggle */}
          <button 
            onClick={toggleCart}
            className="relative p-2.5 hover:bg-black/10 rounded-full transition-colors flex items-center justify-center"
          >
            <ShoppingCart size={22} />
            {cartItemCount > 0 && (
              <span className="absolute top-0 right-0 -mt-0.5 -mr-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-accent shadow-md text-[11px] font-bold text-white border-2 border-brand-primary animate-bounce">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
