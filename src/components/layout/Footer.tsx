import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="text-2xl">🏃‍♂️</div>
              <span className="text-xl font-bold">Marathon Planner</span>
            </div>
            <p className="text-gray-400">
              Your training companion for marathon success. Create, track, and
              complete your marathon training plans.
            </p>
          </div>

          {/* Navigation Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Navigation</h3>
            <div className="space-y-2">
              <Link
                href="/"
                className="block text-gray-400 hover:text-white transition-colors"
              >
                Home
              </Link>
              <Link
                href="/dashboard"
                className="block text-gray-400 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/training-plans"
                className="block text-gray-400 hover:text-white transition-colors"
              >
                Training Plans
              </Link>
              <Link
                href="/auth"
                className="block text-gray-400 hover:text-white transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Support/Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <div className="space-y-2">
              <a
                href="mailto:support@marathonplanner.com"
                className="block text-gray-400 hover:text-white transition-colors"
              >
                Contact Support
              </a>
              <a
                href="#"
                className="block text-gray-400 hover:text-white transition-colors"
              >
                Help Center
              </a>
              <a
                href="#"
                className="block text-gray-400 hover:text-white transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="block text-gray-400 hover:text-white transition-colors"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            &copy; 2024 Marathon Planner. Built for runners, by runners.
          </p>
        </div>
      </div>
    </footer>
  );
}
