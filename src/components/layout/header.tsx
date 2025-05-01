import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import Web3ModalButton from '@/components/wallet/Web3ModalButton';
import NetworkSelector from '@/components/wallet/NetworkSelector';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  
  return (
    <header className="bg-white border-b border-gray-100">
      <div className="container mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="hexagon bg-primary w-10 h-10 flex items-center justify-center">
            <span className="text-white font-bold">BD</span>
          </div>
          <Link href="/">
            <span className="font-montserrat font-bold text-2xl text-primary cursor-pointer">BlockDNS</span>
          </Link>
        </div>
        
        <nav className="hidden md:flex space-x-8">
          <Link href="/">
            <span className={`font-medium cursor-pointer ${location === '/' ? 'text-primary' : 'text-foreground hover:text-primary'} transition`}>Home</span>
          </Link>
          <Link href="/my-domains">
            <span className={`font-medium cursor-pointer ${location === '/my-domains' ? 'text-primary' : 'text-foreground hover:text-primary'} transition`}>My Domains</span>
          </Link>
          <Link href="/marketplace">
            <span className={`font-medium cursor-pointer ${location === '/marketplace' ? 'text-primary' : 'text-foreground hover:text-primary'} transition`}>Marketplace</span>
          </Link>
          <Link href="/about">
            <span className={`font-medium cursor-pointer ${location === '/about' ? 'text-primary' : 'text-foreground hover:text-primary'} transition`}>About</span>
          </Link>
        </nav>
        
        <div className="hidden md:flex items-center space-x-3">
          <NetworkSelector />
          <Web3ModalButton />
        </div>
        
        {/* Mobile menu button */}
        <button 
          className="md:hidden focus:outline-none"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
      </div>
      
      {/* Mobile menu */}
      <div className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="px-2 pt-2 pb-3 space-y-1 border-t">
          <Link href="/">
            <span className="block px-3 py-2 text-base font-medium text-foreground hover:bg-gray-50 rounded-md cursor-pointer">Home</span>
          </Link>
          <Link href="/my-domains">
            <span className="block px-3 py-2 text-base font-medium text-foreground hover:bg-gray-50 rounded-md cursor-pointer">My Domains</span>
          </Link>
          <Link href="/marketplace">
            <span className="block px-3 py-2 text-base font-medium text-foreground hover:bg-gray-50 rounded-md cursor-pointer">Marketplace</span>
          </Link>
          <Link href="/about">
            <span className="block px-3 py-2 text-base font-medium text-foreground hover:bg-gray-50 rounded-md cursor-pointer">About</span>
          </Link>
          <div className="mt-4 px-3 space-y-3">
            <div className="mb-2">
              <NetworkSelector />
            </div>
            <Web3ModalButton isMobile />
          </div>
        </div>
      </div>
    </header>
  );
}
