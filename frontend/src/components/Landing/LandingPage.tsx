import React from 'react';
import { 
  Building2, 
  Users, 
  MessageSquare, 
  Network, 
  Calendar, 
  FileText,
  CheckCircle,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Star,
  TrendingUp,
  Shield,
  Zap
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const features = [
    {
      icon: Building2,
      title: 'Property Management',
      description: 'Comprehensive property listing, tracking, and management system with advanced search and filtering capabilities.'
    },
    {
      icon: Users,
      title: 'Client Management',
      description: 'Organize and manage all your clients with detailed profiles, requirements, and communication history.'
    },
    {
      icon: MessageSquare,
      title: 'WhatsApp Marketing',
      description: 'Bulk messaging, appointment reminders, and acknowledgment messages directly to your clients via WhatsApp.'
    },
    {
      icon: Network,
      title: 'Broker Network',
      description: 'Connect with brokers across different cities for referrals, partnerships, and business expansion.'
    },
    {
      icon: Calendar,
      title: 'Appointment Scheduling',
      description: 'Schedule, track, and manage all your client appointments with automated reminders and notifications.'
    },
    {
      icon: FileText,
      title: 'Agreement Management',
      description: 'Automated rental agreement generation and renewal reminders to never miss business opportunities.'
    }
  ];

  const benefits = [
    {
      icon: TrendingUp,
      title: 'Increase Revenue',
      description: 'Boost your income by 40% through better client management and automated follow-ups.'
    },
    {
      icon: Zap,
      title: 'Save Time',
      description: 'Reduce administrative work by 60% with automated processes and streamlined workflows.'
    },
    {
      icon: Shield,
      title: 'Professional Service',
      description: 'Provide world-class service to your clients with organized data and timely communication.'
    }
  ];

  const testimonials = [
    {
      name: 'Rajesh Kumar',
      role: 'Real Estate Broker, Mumbai',
      content: 'ENFOR DATA has transformed my business. I can now manage 3x more clients and never miss a renewal opportunity.',
      rating: 5
    },
    {
      name: 'Priya Sharma',
      role: 'Channel Partner, Delhi',
      content: 'The WhatsApp integration is game-changing. My client engagement has increased by 200% since using this platform.',
      rating: 5
    },
    {
      name: 'Amit Patel',
      role: 'Real Estate Broker, Bangalore',
      content: 'The broker network feature helped me expand to 5 new cities. My referral income has doubled in 6 months.',
      rating: 5
    }
  ];

  const stats = [
    { number: '10,000+', label: 'Active Brokers' },
    { number: '50,000+', label: 'Properties Listed' },
    { number: '1M+', label: 'WhatsApp Messages Sent' },
    { number: '25+', label: 'Cities Connected' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-blue-600">ENFOR DATA</h1>
                <p className="text-sm text-gray-600">Real Estate Business Platform</p>
              </div>
            </div>
            <button
              onClick={onGetStarted}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Transform Your Real Estate Business
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              The ultimate business management platform for real estate brokers and builders. 
              Manage properties, clients, and grow your network with powerful automation tools.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <button
                onClick={onGetStarted}
                className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center text-lg font-semibold"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              <button className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg hover:bg-gray-50 transition-colors text-lg font-semibold">
                Watch Demo
              </button>
            </div>
            
            {/* Role-based Sign Up Options */}
            <div className="max-w-4xl mx-auto">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Choose Your Role</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Broker Sign Up */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-shadow">
                  <div className="text-center">
                    <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Building2 className="h-8 w-8 text-blue-600" />
                    </div>
                    <h4 className="text-2xl font-bold text-gray-900 mb-3">Real Estate Broker</h4>
                    <p className="text-gray-600 mb-6">
                      Manage properties, clients, appointments, and grow your business with our comprehensive broker tools.
                    </p>
                    <ul className="text-left space-y-2 mb-6 text-sm text-gray-600">
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        Property & Client Management
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        WhatsApp Marketing Suite
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        Broker Network & Referrals
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        Appointment Scheduling
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        Agreement Management
                      </li>
                    </ul>
                    <button
                      onClick={onGetStarted}
                      className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                    >
                      Sign Up as Broker
                    </button>
                  </div>
                </div>

                {/* Channel Partner Sign Up */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-shadow">
                  <div className="text-center">
                    <div className="bg-teal-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Network className="h-8 w-8 text-teal-600" />
                    </div>
                    <h4 className="text-2xl font-bold text-gray-900 mb-3">Channel Partner</h4>
                    <p className="text-gray-600 mb-6">
                      Showcase your projects, connect with brokers, and manage your sales network effectively.
                    </p>
                    <ul className="text-left space-y-2 mb-6 text-sm text-gray-600">
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        Project Portfolio Management
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        Broker Network Access
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        Lead Management System
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        WhatsApp Marketing Tools
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        Sales Analytics & Reports
                      </li>
                    </ul>
                    <button
                      onClick={onGetStarted}
                      className="w-full bg-teal-600 text-white py-3 px-6 rounded-lg hover:bg-teal-700 transition-colors font-semibold"
                    >
                      Sign Up as Channel Partner
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="text-center mt-8">
                <p className="text-gray-600">
                  Already have an account?{' '}
                  <button
                    onClick={onGetStarted}
                    className="text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Sign In Here
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Grow Your Business
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive tools designed specifically for real estate professionals to streamline operations and maximize revenue.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose ENFOR DATA?
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of successful brokers who have transformed their business with our platform.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div key={index} className="text-center">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">{benefit.title}</h3>
                  <p className="text-gray-600 text-lg">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600">
              Real stories from real estate professionals who've grown their business with ENFOR DATA.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-500">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Company Info Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                About ENFOR DATA
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Founded in 2020, ENFOR DATA has been at the forefront of digital transformation in the real estate industry. 
                We understand the unique challenges faced by brokers and builders, and we've built a comprehensive platform 
                that addresses every aspect of real estate business management.
              </p>
              <p className="text-lg text-gray-600 mb-8">
                Our mission is to empower real estate professionals with cutting-edge technology that simplifies operations, 
                enhances client relationships, and drives business growth. With over 10,000 active users across 25+ cities, 
                we're proud to be India's leading real estate business platform.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                  <span className="text-gray-700">ISO 27001 Certified for Data Security</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                  <span className="text-gray-700">24/7 Customer Support</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                  <span className="text-gray-700">99.9% Uptime Guarantee</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                  <span className="text-gray-700">Regular Feature Updates</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-xl">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Get in Touch</h3>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <MapPin className="h-6 w-6 text-blue-600 mr-4" />
                  <div>
                    <div className="font-semibold text-gray-900">Head Office</div>
                    <div className="text-gray-600">
                      Tower A, Business Park<br />
                      Bandra Kurla Complex, Mumbai - 400051<br />
                      Maharashtra, India
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Phone className="h-6 w-6 text-blue-600 mr-4" />
                  <div>
                    <div className="font-semibold text-gray-900">Phone</div>
                    <div className="text-gray-600">+91 22 4567 8900</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Mail className="h-6 w-6 text-blue-600 mr-4" />
                  <div>
                    <div className="font-semibold text-gray-900">Email</div>
                    <div className="text-gray-600">contact@enfordata.com</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <h4 className="font-semibold text-gray-900 mb-4">Business Hours</h4>
                <div className="text-gray-600">
                  <div>Monday - Friday: 9:00 AM - 7:00 PM</div>
                  <div>Saturday: 9:00 AM - 5:00 PM</div>
                  <div>Sunday: Closed</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of successful brokers and builders who are already using ENFOR DATA to grow their business.
          </p>
          <button
            onClick={onGetStarted}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-gray-50 transition-colors text-lg font-semibold inline-flex items-center"
          >
            Start Your Free Trial Today
            <ArrowRight className="ml-2 h-5 w-5" />
          </button>
          <p className="text-blue-100 mt-4">No credit card required • 14-day free trial</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Building2 className="h-8 w-8 text-blue-400 mr-3" />
                <div>
                  <h3 className="text-xl font-bold">ENFOR DATA</h3>
                  <p className="text-sm text-gray-400">Real Estate Platform</p>
                </div>
              </div>
              <p className="text-gray-400">
                Empowering real estate professionals with cutting-edge technology for business growth and success.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Training</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ENFOR DATA. All rights reserved. | Privacy Policy | Terms of Service</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;