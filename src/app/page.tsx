import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";

export default function Home() {
  return (
    <MainLayout>
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-2">
              Marathon Training
            </h1>
            <p className="text-3xl md:text-4xl font-semibold text-blue-600 mb-6">
              Made Simple
            </p>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Create, track, and complete your marathon training plans with
              detailed progress monitoring and analytics.
            </p>

            {/* Call-to-Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/users/create"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 shadow-lg"
              >
                Get Started
              </Link>
              <Link
                href="#features"
                className="border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
              >
                Learn More
              </Link>
            </div>
          </div>

          {/* Feature Overview */}
          <section id="features" className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-blue-600 text-3xl mb-4">📅</div>
              <h3 className="text-xl font-semibold mb-3">Plan Management</h3>
              <p className="text-gray-600">
                Create detailed training plans with weekly schedules, workout
                types, and mileage targets. Customize plans for your specific
                marathon goals.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-blue-600 text-3xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-3">Progress Tracking</h3>
              <p className="text-gray-600">
                Log your daily runs, track actual vs planned mileage, and
                monitor your training consistency with detailed progress
                analytics.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-blue-600 text-3xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-3">Goal Achievement</h3>
              <p className="text-gray-600">
                Stay motivated with visual progress indicators, goal
                projections, and insights that help you reach your marathon
                finish line.
              </p>
            </div>
          </section>

          {/* How It Works */}
          <section className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              How It Works
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="flex flex-col items-center">
                <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-4">
                  1
                </div>
                <h4 className="font-semibold mb-2">Create Your Plan</h4>
                <p className="text-sm text-gray-600">
                  Set up your marathon training schedule with weekly goals and
                  workout types
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-4">
                  2
                </div>
                <h4 className="font-semibold mb-2">Track Workouts</h4>
                <p className="text-sm text-gray-600">
                  Log your daily runs, record actual distances, and add personal
                  notes
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-4">
                  3
                </div>
                <h4 className="font-semibold mb-2">Monitor Progress</h4>
                <p className="text-sm text-gray-600">
                  View your training analytics, weekly summaries, and goal
                  projections
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-4">
                  4
                </div>
                <h4 className="font-semibold mb-2">Achieve Your Goals</h4>
                <p className="text-sm text-gray-600">
                  Cross the marathon finish line prepared and confident
                </p>
              </div>
            </div>
          </section>

          {/* Call-to-Action Section */}
          <section className="bg-blue-600 text-white p-8 rounded-lg text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Start Training?
            </h2>
            <p className="text-xl mb-6">
              Join thousands of runners achieving their marathon goals
            </p>
            <Link
              href="/users/create"
              className="bg-white text-blue-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition-colors duration-200 inline-block"
            >
              Sign Up Free
            </Link>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
