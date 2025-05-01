import { Check, Lock, Share } from "lucide-react";
import DomainSearch from "@/components/domain/DomainSearch";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const Home = () => {
  const features = [
    {
      icon: <Lock className="h-8 w-8 text-primary" />,
      title: "True Ownership",
      description: "Your domains are NFTs that you truly own, stored securely on the blockchain."
    },
    {
      icon: <Share className="h-8 w-8 text-secondary" />,
      title: "Subdomain Control",
      description: "Create and manage unlimited subdomains for your organization or personal use."
    },
    {
      icon: <Check className="h-8 w-8 text-accent" />,
      title: "Easy Trading",
      description: "Buy, sell, and transfer domains with ease through our marketplace."
    }
  ];

  const pricingTiers = [
    {
      name: "3+ Characters",
      price: "0.05",
      unit: "ETH",
      features: [
        "Full NFT ownership",
        "Unlimited subdomains",
        "1 year registration"
      ],
      popular: false,
      color: "primary"
    },
    {
      name: "2 Characters",
      price: "0.10",
      unit: "ETH",
      features: [
        "Full NFT ownership",
        "Unlimited subdomains",
        "1 year registration",
        "Premium short name"
      ],
      popular: true,
      color: "accent"
    },
    {
      name: "1 Character",
      price: "1.00",
      unit: "ETH",
      features: [
        "Full NFT ownership",
        "Unlimited subdomains",
        "1 year registration",
        "Ultra-rare single character"
      ],
      popular: false,
      color: "secondary"
    }
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="mt-12 mb-24 text-center">
        <h1 className="font-montserrat font-bold text-4xl md:text-5xl lg:text-6xl mb-6 text-foreground">
          Own Your Digital Identity <span className="text-primary">On-Chain</span>
        </h1>
        <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto mb-12">
          Register and manage blockchain domains as NFTs, create subdomains, and take control of your Web3 identity.
        </p>
        
        <DomainSearch />
      </section>

      {/* Features Section */}
      <section className="mb-20">
        <h2 className="font-montserrat font-bold text-3xl mb-12 text-center">Why Choose BlockDNS?</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="neumorphic p-6 text-center domain-card">
              <div className="w-16 h-16 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
                {feature.icon}
              </div>
              <h3 className="font-montserrat font-semibold text-xl mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="mb-20">
        <h2 className="font-montserrat font-bold text-3xl mb-3 text-center">Domain Registration Pricing</h2>
        <p className="text-gray-600 text-center max-w-3xl mx-auto mb-12">
          Simple, transparent pricing based on domain length. All domains include full NFT ownership and subdomain management.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingTiers.map((tier, index) => (
            <div
              key={index}
              className={`neumorphic p-8 text-center domain-card ${
                tier.popular ? "relative transform scale-105 z-10" : ""
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-0 right-0">
                  <span className="bg-accent text-white text-sm font-bold px-4 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className={`text-2xl font-montserrat font-bold mb-2 text-${tier.color}`}>
                {tier.name}
              </div>
              
              <div className="flex items-center justify-center mb-6">
                <span className="text-4xl font-bold">{tier.price}</span>
                <span className="text-xl text-gray-600 ml-2">{tier.unit}</span>
              </div>
              
              <ul className="text-left space-y-3 mb-8">
                {tier.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center">
                    <Check className="h-5 w-5 text-success mr-2" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link href="/">
                <Button
                  className={`w-full bg-${tier.color} text-white font-medium py-3 px-6 rounded-xl transition hover:bg-${tier.color}/90`}
                >
                  Search Domains
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default Home;
