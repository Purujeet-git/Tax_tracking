import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="border-b bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
                CryptoTax
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 font-medium">
                Login
              </Link>
              <Link href="/dashboard" className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition">
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Track Your Crypto Taxes
            <span className="block text-primary-600">Effortlessly</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Know your P&L and tax liability in real-time, not during year-end panic. 
            Auto-sync trades, calculate taxes, and export reports for your accountant.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/dashboard" className="bg-primary-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-700 transition shadow-lg">
              Start Tracking Free
            </Link>
            <button className="border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-8 py-4 rounded-lg text-lg font-semibold hover:border-primary-600 hover:text-primary-600 transition">
              See Demo
            </button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="mt-20 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard 
            icon="🔄"
            title="Auto-Sync Exchanges"
            description="Connect Binance, WazirX, and more. We fetch all your trades automatically."
          />
          <FeatureCard 
            icon="📊"
            title="Real-Time P&L"
            description="See if you're profitable right now, not months later when filing taxes."
          />
          <FeatureCard 
            icon="💰"
            title="Tax Calculations"
            description="Accurate capital gains calculation following India tax laws (30% VDA tax)."
          />
          <FeatureCard 
            icon="📥"
            title="Export Reports"
            description="Generate ITR-2 format reports. Download CSV or send directly to your CA."
          />
        </div>

        {/* How It Works */}
        <div className="mt-32">
          <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-16">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            <Step 
              number="1"
              title="Connect Your Exchanges"
              description="Add your exchange API keys (read-only). We support Binance, WazirX, CoinDCX and more."
            />
            <Step 
              number="2"
              title="Auto-Sync Transactions"
              description="We fetch all your trading history automatically. Set it and forget it."
            />
            <Step 
              number="3"
              title="Track & Export"
              description="View real-time P&L, tax estimates, and export reports whenever you need them."
            />
          </div>
        </div>

        {/* Pricing */}
        <div className="mt-32">
          <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-16">
            Simple Pricing
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <PricingCard 
              name="Free"
              price="₹0"
              period="forever"
              features={[
                "Up to 100 transactions",
                "1 exchange connection",
                "Basic P&L tracking",
                "CSV export"
              ]}
              buttonText="Start Free"
              buttonVariant="secondary"
            />
            <PricingCard 
              name="Trader"
              price="₹4,000"
              period="per year"
              features={[
                "Unlimited transactions",
                "All exchanges supported",
                "Tax calculations & reports",
                "ITR-2 format export",
                "Email support"
              ]}
              buttonText="Get Started"
              buttonVariant="primary"
              popular={true}
            />
            <PricingCard 
              name="Pro"
              price="₹8,000"
              period="per year"
              features={[
                "Everything in Trader",
                "Tax-loss harvesting tips",
                "Portfolio analytics",
                "Priority support",
                "Accountant collaboration"
              ]}
              buttonText="Go Pro"
              buttonVariant="secondary"
            />
          </div>
        </div>

        {/* CTA */}
        <div className="mt-32 bg-gradient-to-r from-primary-600 to-primary-400 rounded-2xl p-12 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Stop Stressing About Crypto Taxes
          </h2>
          <p className="text-xl text-primary-50 mb-8">
            Join thousands of traders who track their P&L and taxes in real-time
          </p>
          <Link href="/dashboard" className="bg-white text-primary-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition shadow-lg inline-block">
            Start Your Free Trial
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t mt-20 py-12 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">CryptoTax</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Making crypto tax tracking simple for traders
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Product</h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li><a href="#" className="hover:text-primary-600">Features</a></li>
                <li><a href="#" className="hover:text-primary-600">Pricing</a></li>
                <li><a href="#" className="hover:text-primary-600">Exchanges</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li><a href="#" className="hover:text-primary-600">Documentation</a></li>
                <li><a href="#" className="hover:text-primary-600">Tax Guide</a></li>
                <li><a href="#" className="hover:text-primary-600">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li><a href="#" className="hover:text-primary-600">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary-600">Terms of Service</a></li>
                <li><a href="#" className="hover:text-primary-600">Disclaimer</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-gray-600 dark:text-gray-400">
            <p>© 2024 CryptoTax. All rights reserved. Not financial or tax advice. Consult a professional.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  )
}

function Step({ number, title, description }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  )
}

function PricingCard({ name, price, period, features, buttonText, buttonVariant, popular }) {
  return (
    <div className={`bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg ${popular ? 'ring-2 ring-primary-600 relative' : ''}`}>
      {popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
            Most Popular
          </span>
        </div>
      )}
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{name}</h3>
      <div className="mb-6">
        <span className="text-4xl font-bold text-gray-900 dark:text-white">{price}</span>
        <span className="text-gray-600 dark:text-gray-400 ml-2">/ {period}</span>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-gray-600 dark:text-gray-300">{feature}</span>
          </li>
        ))}
      </ul>
      <Link 
        href="/dashboard"
        className={`block w-full text-center py-3 rounded-lg font-semibold transition ${
          buttonVariant === 'primary' 
            ? 'bg-primary-600 text-white hover:bg-primary-700' 
            : 'border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-primary-600 hover:text-primary-600'
        }`}
      >
        {buttonText}
      </Link>
    </div>
  )
}