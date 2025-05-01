import { Link } from "wouter";
import { Github, Twitter, Instagram, Linkedin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-100 py-12">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <div className="hexagon bg-primary w-8 h-8 flex items-center justify-center">
                <span className="text-white font-bold text-sm">BD</span>
              </div>
              <h3 className="font-montserrat font-bold text-xl text-primary">BlockDNS</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Decentralized domain management on the blockchain. Own your digital identity with NFT-powered domains.
            </p>
          </div>
          
          <div>
            <h4 className="font-montserrat font-semibold text-lg mb-4 text-foreground">Products</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="text-gray-600 hover:text-primary transition">Domain Registration</Link></li>
              <li><Link href="/my-domains" className="text-gray-600 hover:text-primary transition">Subdomain Management</Link></li>
              <li><Link href="/marketplace" className="text-gray-600 hover:text-primary transition">Domain Marketplace</Link></li>
              <li><Link href="/api" className="text-gray-600 hover:text-primary transition">API Access</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-montserrat font-semibold text-lg mb-4 text-foreground">Resources</h4>
            <ul className="space-y-2">
              <li><Link href="/docs" className="text-gray-600 hover:text-primary transition">Documentation</Link></li>
              <li><Link href="/tutorials" className="text-gray-600 hover:text-primary transition">Tutorials</Link></li>
              <li><Link href="/blog" className="text-gray-600 hover:text-primary transition">Blog</Link></li>
              <li><Link href="/faq" className="text-gray-600 hover:text-primary transition">FAQs</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-montserrat font-semibold text-lg mb-4 text-foreground">Company</h4>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-gray-600 hover:text-primary transition">About Us</Link></li>
              <li><Link href="/careers" className="text-gray-600 hover:text-primary transition">Careers</Link></li>
              <li><Link href="/contact" className="text-gray-600 hover:text-primary transition">Contact</Link></li>
              <li><Link href="/partners" className="text-gray-600 hover:text-primary transition">Partners</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-100 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-600 text-sm mb-4 md:mb-0">© {new Date().getFullYear()} BlockDNS. All rights reserved.</p>
          <div className="flex space-x-6">
            <a href="#" className="text-gray-600 hover:text-primary transition">
              <Twitter className="h-5 w-5" />
            </a>
            <a href="#" className="text-gray-600 hover:text-primary transition">
              <Github className="h-5 w-5" />
            </a>
            <a href="#" className="text-gray-600 hover:text-primary transition">
              <Instagram className="h-5 w-5" />
            </a>
            <a href="#" className="text-gray-600 hover:text-primary transition">
              <Linkedin className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
