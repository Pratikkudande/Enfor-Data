import React, { useEffect, useState } from 'react';
import logo from '../../assets/enfordata-logo.svg';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../routes/routePaths';
import { apiClient } from '../../services/api';
import { 
  Building2, 
  Users, 
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
  Zap,
  Play,
  Award,
  Clock,
  Globe,
  BarChart3,
  Smartphone,
  HeadphonesIcon,
  Sparkles
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [liveStats, setLiveStats] = useState({
    brokers: 0,
    properties: 0,
    clients: 0,
    loaded: false,
  });

  useEffect(() => {
    setIsVisible(true);

    // Fetch real platform stats from the public /api/stats endpoint
    const fetchStats = async () => {
      try {
        const baseUrl = (import.meta.env.VITE_API_URL as string | undefined)
          ?.replace('/api', '') ?? 'http://localhost:8080';
        const res = await fetch(`${baseUrl}/api/stats`);
        if (!res.ok) throw new Error('stats fetch failed');
        const data = await res.json();
        setLiveStats({
          brokers: data.brokers ?? 0,
          properties: data.properties ?? 0,
          clients: data.clients ?? 0,
          loaded: true,
        });
      } catch {
        setLiveStats((prev) => ({ ...prev, loaded: true }));
      }
    };

    fetchStats();
  }, []);

  const handleGetStarted = () => {
    navigate(ROUTES.LOGIN);
  };

  const handleWatchDemo = () => {
    // Add demo video functionality here
    console.log('Watch demo clicked');
  };

  const features = [
    {
      icon: Building2,
      title: 'Smart Property Management',
      description: 'AI-powered property listing with advanced search, virtual tours, and automated valuation tools.',
      color: 'from-blue-500 to-blue-600',
      delay: '0ms'
    },
    {
      icon: Users,
      title: 'Intelligent Client CRM',
      description: 'Advanced client profiling with behavior analytics, preferences tracking, and automated follow-ups.',
      color: 'from-green-500 to-green-600',
      delay: '100ms'
    },
    {
      icon: Network,
      title: 'Global Broker Network',
      description: 'Connect with verified brokers across 25+ cities for referrals and partnerships.',
      color: 'from-orange-500 to-orange-600',
      delay: '200ms'
    },
    {
      icon: Calendar,
      title: 'Smart Scheduling',
      description: 'AI-optimized appointment scheduling with conflict detection and automated reminders.',
      color: 'from-teal-500 to-teal-600',
      delay: '300ms'
    },
    {
      icon: FileText,
      title: 'Legal Document Hub',
      description: 'Automated agreement generation, e-signatures, renewal tracking, and compliance management.',
      color: 'from-red-500 to-red-600',
      delay: '400ms'
    }
  ];

  const benefits = [
    {
      icon: TrendingUp,
      title: 'Boost Revenue by 40%',
      description: 'Increase your income through better lead management, automated follow-ups, and referral optimization.',
      stat: '40%',
      statLabel: 'Revenue Increase'
    },
    {
      icon: Zap,
      title: 'Save 60% Time',
      description: 'Reduce administrative work with automation, streamlined workflows, and intelligent task management.',
      stat: '60%',
      statLabel: 'Time Saved'
    },
    {
      icon: Shield,
      title: 'Professional Excellence',
      description: 'Deliver world-class service with organized data, timely communication, and professional tools.',
      stat: '99.9%',
      statLabel: 'Client Satisfaction'
    }
  ];

  const testimonials = [
    {
      name: 'Rajesh Kumar',
      role: 'Real Estate Broker, Mumbai',
      content: 'ENFOR DATA transformed my business completely. I now manage 3x more clients and never miss renewal opportunities. The WhatsApp automation alone increased my client engagement by 200%.',
      rating: 5,
      avatar: 'RK',
      company: 'Kumar Properties'
    },
    {
      name: 'Priya Sharma',
      role: 'Channel Partner, Delhi',
      content: 'The platform is incredibly intuitive. The broker network feature helped me expand to 5 new cities, and my referral income doubled in just 6 months. Best investment for my business!',
      rating: 5,
      avatar: 'PS',
      company: 'Sharma Realty'
    },
    {
      name: 'Amit Patel',
      role: 'Real Estate Broker, Bangalore',
      content: 'Outstanding support and features. The automated agreement system saved me countless hours, and the analytics help me make data-driven decisions. Highly recommended!',
      rating: 5,
      avatar: 'AP',
      company: 'Patel Estates'
    }
  ];

  const stats = [
    {
      number: liveStats.loaded ? `${liveStats.brokers}+` : '…',
      label: 'Active Brokers',
      icon: Users,
    },
    {
      number: liveStats.loaded ? `${liveStats.properties}+` : '…',
      label: 'Properties Listed',
      icon: Building2,
    },
    {
      number: liveStats.loaded ? `${liveStats.clients}+` : '…',
      label: 'Clients Managed',
      icon: Users,
    },
    { number: '25+', label: 'Cities Connected', icon: Globe },
  ];

  const whyChooseUs = [
    {
      icon: Award,
      title: 'Industry Leader',
      description: 'Trusted by 10,000+ professionals across India'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'ISO 27001 certified with 99.9% uptime guarantee'
    },
    {
      icon: HeadphonesIcon,
      title: '24/7 Support',
      description: 'Round-the-clock customer support in multiple languages'
    },
    {
      icon: Sparkles,
      title: 'Regular Updates',
      description: 'Monthly feature releases based on user feedback'
    }
  ];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center animate-fade-in">
              <img src={logo} alt="Enfor Data" className="h-10 mr-3" />
              <div className="hidden sm:block">
                <div className="text-lg font-bold text-gray-900">ENFOR DATA</div>
                <div className="text-xs text-gray-500">Real Estate Platform</div>
              </div>
            </div>
            <div className="flex items-center space-x-4 animate-fade-in">
              <button
                onClick={() => navigate(ROUTES.PRICING)}
                className="text-gray-700 hover:text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all duration-300 font-medium"
              >
                Pricing
              </button>
              <button
                onClick={handleWatchDemo}
                className="text-gray-700 hover:text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all duration-300 font-medium"
              >
                Demo
              </button>
              <button
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-20 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-teal-400/20 to-blue-400/20 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className={`transition-all duration-1000 ${isVisible ? 'animate-fade-in-up' : 'opacity-0 translate-y-10'}`}>
              <div className="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6 animate-bounce-in">
                <Sparkles className="h-4 w-4 mr-2" />
                India's #1 Real Estate Business Platform
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                Transform Your
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Real Estate </span>
                Business
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
                The ultimate AI-powered business management platform for real estate brokers and builders. 
                Manage properties, clients, and grow your network with intelligent automation tools.
              </p>
            </div>
            
            <div className={`flex flex-col sm:flex-row gap-4 justify-center mb-12 transition-all duration-1000 delay-300 ${isVisible ? 'animate-fade-in-up' : 'opacity-0 translate-y-10'}`}>
              <button
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 flex items-center justify-center text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:-translate-y-1 animate-glow"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              <button 
                onClick={handleWatchDemo}
                className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 text-lg font-semibold flex items-center justify-center group"
              >
                <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Watch Demo
              </button>
            </div>

            {/* Trust Indicators */}
            <div className={`flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500 mb-16 transition-all duration-1000 delay-500 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                No Credit Card Required
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                15-Day Free Trial
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                Setup in 5 Minutes
              </div>
            </div>
            
            {/* Role-based Sign Up Options */}
            <div className={`max-w-6xl mx-auto transition-all duration-1000 delay-700 ${isVisible ? 'animate-fade-in-up' : 'opacity-0 translate-y-10'}`}>
              <h3 className="text-3xl font-bold text-gray-900 mb-8">Choose Your Role</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Broker Sign Up */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group">
                  <div className="text-center">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                      <Building2 className="h-10 w-10 text-white" />
                    </div>
                    <h4 className="text-2xl font-bold text-gray-900 mb-4">Real Estate Broker</h4>
                    <p className="text-gray-600 mb-6 text-lg">
                      Manage properties, clients, appointments, and grow your business with our comprehensive broker tools.
                    </p>
                    <ul className="text-left space-y-3 mb-8 text-gray-600">
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        Smart Property & Client Management
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        SMS Marketing Suite
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        Global Broker Network & Referrals
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        AI-Powered Appointment Scheduling
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        Automated Agreement Management
                      </li>
                    </ul>
                    <button
                      onClick={handleGetStarted}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      Start as Broker
                    </button>
                  </div>
                </div>

                {/* Channel Partner Sign Up */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group">
                  <div className="text-center">
                    <div className="bg-gradient-to-br from-teal-500 to-teal-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                      <Network className="h-10 w-10 text-white" />
                    </div>
                    <h4 className="text-2xl font-bold text-gray-900 mb-4">Channel Partner</h4>
                    <p className="text-gray-600 mb-6 text-lg">
                      Showcase your projects, connect with brokers, and manage your sales network effectively.
                    </p>
                    <ul className="text-left space-y-3 mb-8 text-gray-600">
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        Advanced Project Portfolio Management
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        Verified Broker Network Access
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        Intelligent Lead Management System
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        Multi-Channel Marketing Tools
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        Advanced Sales Analytics & Reports
                      </li>
                    </ul>
                    <button
                      onClick={handleGetStarted}
                      className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white py-4 px-6 rounded-xl hover:from-teal-700 hover:to-teal-800 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      Start as Channel Partner
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="text-center mt-8">
                <p className="text-gray-600 text-lg">
                  Already have an account?{' '}
                  <button
                    onClick={handleGetStarted}
                    className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors"
                  >
                    Sign In Here
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Animated Stats Section */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-purple-50/50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 animate-fade-in-up">
              Trusted by Industry Leaders
            </h2>
            <p className="text-xl text-gray-600 animate-fade-in-up" style={{animationDelay: '200ms'}}>
              Join thousands of successful professionals across India
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={index} 
                  className="text-center group animate-scale-in"
                  style={{animationDelay: `${index * 100}ms`}}
                >
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 group-hover:scale-105 transition-transform">
                    {stat.number}
                  </div>
                  <div className="text-gray-600 font-medium">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="py-24 bg-gray-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6 animate-bounce-in">
              <Zap className="h-4 w-4 mr-2" />
              Powerful Features
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 animate-fade-in-up">
              Everything You Need to 
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Dominate </span>
              Your Market
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto animate-fade-in-up" style={{animationDelay: '200ms'}}>
              Comprehensive AI-powered tools designed specifically for real estate professionals to streamline operations and maximize revenue.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index} 
                  className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group animate-fade-in-up"
                  style={{animationDelay: feature.delay}}
                >
                  <div className={`bg-gradient-to-br ${feature.color} w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  <div className="mt-6">
                    <button className="text-blue-600 font-semibold hover:text-blue-700 transition-colors flex items-center group-hover:translate-x-1 transition-transform">
                      Learn More
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Enhanced Benefits Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50/30 to-purple-50/30"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 animate-fade-in-up">
              Why Choose 
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> ENFOR DATA</span>?
            </h2>
            <p className="text-xl text-gray-600 animate-fade-in-up" style={{animationDelay: '200ms'}}>
              Join thousands of successful brokers who have transformed their business with our platform.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div 
                  key={index} 
                  className="text-center group animate-fade-in-up"
                  style={{animationDelay: `${index * 200}ms`}}
                >
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-all duration-300 shadow-xl">
                    <Icon className="h-10 w-10 text-white" />
                  </div>
                  <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                      {benefit.stat}
                    </div>
                    <div className="text-sm text-gray-500 mb-4">{benefit.statLabel}</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{benefit.title}</h3>
                    <p className="text-gray-600 text-lg leading-relaxed">{benefit.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Enhanced Testimonials Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium mb-6 animate-bounce-in">
              <Star className="h-4 w-4 mr-2 fill-current" />
              Customer Success Stories
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 animate-fade-in-up">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600 animate-fade-in-up" style={{animationDelay: '200ms'}}>
              Real stories from real estate professionals who've grown their business with ENFOR DATA.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index} 
                className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1 animate-fade-in-up"
                style={{animationDelay: `${index * 200}ms`}}
              >
                <div className="flex items-center mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-8 italic text-lg leading-relaxed">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold mr-4">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-lg">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                    <div className="text-xs text-blue-600 font-medium">{testimonial.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-gray-900 mb-6 animate-fade-in-up">
              Why Industry Leaders Choose Us
            </h2>
            <p className="text-xl text-gray-600 animate-fade-in-up" style={{animationDelay: '200ms'}}>
              Built by real estate professionals, for real estate professionals
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {whyChooseUs.map((item, index) => {
              const Icon = item.icon;
              return (
                <div 
                  key={index} 
                  className="text-center group animate-fade-in-up"
                  style={{animationDelay: `${index * 100}ms`}}
                >
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Enhanced Company Info Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 left-20 w-64 h-64 bg-gradient-to-br from-teal-400/10 to-blue-400/10 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Building2 className="h-4 w-4 mr-2" />
                About Our Company
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
                Pioneering the Future of 
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Real Estate Technology</span>
              </h2>
              <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                Founded in 2020, ENFOR DATA has been at the forefront of digital transformation in the real estate industry. 
                We understand the unique challenges faced by brokers and builders, and we've built a comprehensive platform 
                that addresses every aspect of real estate business management.
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Our mission is to empower real estate professionals with cutting-edge AI technology that simplifies operations, 
                enhances client relationships, and drives exponential business growth. With over 10,000 active users across 25+ cities, 
                we're proud to be India's leading real estate business platform.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="flex items-center p-4 bg-white rounded-xl shadow-sm">
                  <Shield className="h-8 w-8 text-green-500 mr-4 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-gray-900">ISO 27001 Certified</div>
                    <div className="text-sm text-gray-600">Enterprise-grade security</div>
                  </div>
                </div>
                <div className="flex items-center p-4 bg-white rounded-xl shadow-sm">
                  <HeadphonesIcon className="h-8 w-8 text-blue-500 mr-4 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-gray-900">24/7 Support</div>
                    <div className="text-sm text-gray-600">Always here to help</div>
                  </div>
                </div>
                <div className="flex items-center p-4 bg-white rounded-xl shadow-sm">
                  <Clock className="h-8 w-8 text-purple-500 mr-4 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-gray-900">99.9% Uptime</div>
                    <div className="text-sm text-gray-600">Reliable & consistent</div>
                  </div>
                </div>
                <div className="flex items-center p-4 bg-white rounded-xl shadow-sm">
                  <Sparkles className="h-8 w-8 text-orange-500 mr-4 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-gray-900">Monthly Updates</div>
                    <div className="text-sm text-gray-600">Continuous innovation</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleGetStarted}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center"
                >
                  Start Your Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
                <button className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 font-semibold">
                  Learn More
                </button>
              </div>
            </div>
            
            <div className="animate-fade-in-up" style={{animationDelay: '300ms'}}>
              <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
                <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                  <Phone className="h-6 w-6 text-blue-600 mr-3" />
                  Get in Touch
                </h3>
                
                <div className="space-y-6">
                  <div className="flex items-start p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <MapPin className="h-6 w-6 text-blue-600 mr-4 mt-1 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-gray-900 mb-1">Head Office</div>
                      <div className="text-gray-600">
                        Tower A, Business Park<br />
                        Bandra Kurla Complex, Mumbai - 400051<br />
                        Maharashtra, India
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <Phone className="h-6 w-6 text-blue-600 mr-4 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-gray-900">Phone</div>
                      <div className="text-gray-600">+91 22 4567 8900</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <Mail className="h-6 w-6 text-blue-600 mr-4 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-gray-900">Email</div>
                      <div className="text-gray-600">contact@enfordata.com</div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 p-4 bg-blue-50 rounded-xl">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                    <Clock className="h-5 w-5 text-blue-600 mr-2" />
                    Business Hours
                  </h4>
                  <div className="text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Monday - Friday:</span>
                      <span className="font-medium">9:00 AM - 7:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Saturday:</span>
                      <span className="font-medium">9:00 AM - 5:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sunday:</span>
                      <span className="font-medium text-red-500">Closed</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                    Schedule a Call
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Pricing Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50/30 to-purple-50/30"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-6 animate-bounce-in">
              <BarChart3 className="h-4 w-4 mr-2" />
              Simple Pricing
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 animate-fade-in-up">
              Choose the Perfect Plan for 
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Your Business</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto animate-fade-in-up" style={{animationDelay: '200ms'}}>
              Start with our free trial and upgrade as you grow. No hidden fees, no long-term contracts.
            </p>
          </div>
          
          <div className="flex justify-center mb-16">
            <button
              onClick={() => navigate(ROUTES.PRICING)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-10 py-5 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 text-xl font-bold inline-flex items-center shadow-xl hover:shadow-2xl transform hover:-translate-y-1 animate-glow"
            >
              View All Plans & Pricing
              <ArrowRight className="ml-3 h-6 w-6" />
            </button>
          </div>

          {/* Enhanced Pricing Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Trial */}
            <div className="bg-white p-8 rounded-2xl border-2 border-gray-200 text-center hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 animate-fade-in-up">
              <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-full text-sm font-medium mb-6 inline-block">
                Perfect to Start
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Free Trial</h3>
              <div className="text-5xl font-bold text-gray-600 mb-2">₹0</div>
              <p className="text-gray-500 mb-8">15 days free trial</p>
              <ul className="text-left space-y-3 text-gray-600 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  5 Properties
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  10 Clients
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  50 SMS/WhatsApp
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  Basic Support
                </li>
              </ul>
              <button
                onClick={handleGetStarted}
                className="w-full bg-gray-600 text-white py-4 px-6 rounded-xl hover:bg-gray-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Start Free Trial
              </button>
            </div>

            {/* Starter Plan - Most Popular */}
            <div className="bg-white p-8 rounded-2xl border-2 border-blue-300 text-center relative hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 animate-fade-in-up" style={{animationDelay: '200ms'}}>
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                  Most Popular
                </span>
              </div>
              <div className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6 inline-block">
                Best Value
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Starter Plan</h3>
              <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">₹999</div>
              <p className="text-gray-500 mb-8">per month</p>
              <ul className="text-left space-y-3 text-gray-600 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  50 Properties
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  100 Clients
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  500 SMS/WhatsApp
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  Analytics Dashboard
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  Priority Support
                </li>
              </ul>
              <button
                onClick={() => navigate(ROUTES.PRICING)}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Choose Plan
              </button>
            </div>

            {/* Professional Plan */}
            <div className="bg-white p-8 rounded-2xl border-2 border-gray-200 text-center hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 animate-fade-in-up" style={{animationDelay: '400ms'}}>
              <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium mb-6 inline-block">
                For Professionals
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Professional</h3>
              <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">₹2,499</div>
              <p className="text-gray-500 mb-8">per month</p>
              <ul className="text-left space-y-3 text-gray-600 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  Unlimited Properties
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  Unlimited Clients
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  2000 SMS/WhatsApp
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  Advanced Analytics
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  24/7 Premium Support
                </li>
              </ul>
              <button
                onClick={() => navigate(ROUTES.PRICING)}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Choose Plan
              </button>
            </div>
          </div>

          {/* Money Back Guarantee */}
          <div className="text-center mt-16">
            <div className="inline-flex items-center bg-green-100 text-green-800 px-6 py-3 rounded-full font-medium animate-bounce-in">
              <Shield className="h-5 w-5 mr-2" />
              30-Day Money Back Guarantee
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/90 to-purple-700/90"></div>
          <div className="absolute top-20 right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full text-sm font-medium mb-8">
              <Sparkles className="h-4 w-4 mr-2" />
              Join 10,000+ Successful Professionals
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Ready to Transform Your 
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent"> Business?</span>
            </h2>
            <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed">
              Join thousands of successful brokers and builders who are already using ENFOR DATA to grow their business exponentially.
            </p>
          </div>
          
          <div className="animate-fade-in-up" style={{animationDelay: '300ms'}}>
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
              <button
                onClick={handleGetStarted}
                className="bg-white text-blue-600 px-10 py-5 rounded-xl hover:bg-gray-50 transition-all duration-300 text-xl font-bold inline-flex items-center shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 hover:scale-105"
              >
                Start Your Free Trial Today
                <ArrowRight className="ml-3 h-6 w-6" />
              </button>
              <button
                onClick={handleWatchDemo}
                className="border-2 border-white/30 backdrop-blur-sm text-white px-10 py-5 rounded-xl hover:bg-white/10 transition-all duration-300 text-xl font-bold inline-flex items-center"
              >
                <Play className="mr-3 h-6 w-6" />
                Watch Demo
              </button>
            </div>
            
            <div className="flex flex-wrap justify-center items-center gap-8 text-blue-100 mb-8">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-300 mr-2" />
                No Credit Card Required
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-300 mr-2" />
                15-Day Free Trial
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-300 mr-2" />
                Cancel Anytime
              </div>
            </div>
          </div>

          {/* Success Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 animate-fade-in-up" style={{animationDelay: '600ms'}}>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">40%</div>
              <div className="text-blue-200">Average Revenue Increase</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">60%</div>
              <div className="text-blue-200">Time Saved Daily</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">99.9%</div>
              <div className="text-blue-200">Customer Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-gray-900 text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Company Info */}
            <div className="md:col-span-1">
              <div className="flex items-center mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-12 h-12 rounded-xl flex items-center justify-center mr-4">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">ENFOR DATA</h3>
                  <p className="text-sm text-gray-400">Real Estate Platform</p>
                </div>
              </div>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Empowering real estate professionals with cutting-edge AI technology for exponential business growth and success.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                  <Phone className="h-5 w-5" />
                </div>
              </div>
            </div>
            
            {/* Product Links */}
            <div>
              <h4 className="font-bold mb-6 text-lg">Product</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors hover:translate-x-1 transform inline-block">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors hover:translate-x-1 transform inline-block">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors hover:translate-x-1 transform inline-block">API Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors hover:translate-x-1 transform inline-block">Integrations</a></li>
                <li><a href="#" className="hover:text-white transition-colors hover:translate-x-1 transform inline-block">Mobile App</a></li>
              </ul>
            </div>
            
            {/* Company Links */}
            <div>
              <h4 className="font-bold mb-6 text-lg">Company</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors hover:translate-x-1 transform inline-block">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors hover:translate-x-1 transform inline-block">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors hover:translate-x-1 transform inline-block">Press & Media</a></li>
                <li><a href="#" className="hover:text-white transition-colors hover:translate-x-1 transform inline-block">Partner Program</a></li>
                <li><a href="#" className="hover:text-white transition-colors hover:translate-x-1 transform inline-block">Contact Us</a></li>
              </ul>
            </div>
            
            {/* Support Links */}
            <div>
              <h4 className="font-bold mb-6 text-lg">Support</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors hover:translate-x-1 transform inline-block">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors hover:translate-x-1 transform inline-block">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors hover:translate-x-1 transform inline-block">Video Tutorials</a></li>
                <li><a href="#" className="hover:text-white transition-colors hover:translate-x-1 transform inline-block">Community Forum</a></li>
                <li><a href="#" className="hover:text-white transition-colors hover:translate-x-1 transform inline-block">System Status</a></li>
              </ul>
            </div>
          </div>
          
          {/* Footer Bottom */}
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-400 mb-4 md:mb-0">
                <p>&copy; 2024 ENFOR DATA. All rights reserved.</p>
              </div>
              <div className="flex space-x-6 text-gray-400">
                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
              </div>
            </div>
            <div className="mt-4 text-center text-gray-500 text-sm">
              <p>Made with ❤️ in India | Trusted by 10,000+ Real Estate Professionals</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;