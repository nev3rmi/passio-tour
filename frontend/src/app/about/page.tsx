import LayoutWrapper from '@/components/layout/LayoutWrapper'

export default function AboutPage() {
  return (
    <LayoutWrapper>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">About Us</h1>
        
        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Transforming Tour Management</h2>
            <p className="text-gray-700">
              At Passio Tour, we're passionate about helping tour operators and Destination Management 
              Companies streamline their operations and focus on what they do best - creating 
              unforgettable experiences for travelers.
            </p>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Our Story</h2>
            <p className="text-gray-700 mb-4">
              Founded in 2023, Passio Tour was born from the frustration of seeing tour operators 
              struggle with outdated, complex systems that hindered rather than helped their business growth. 
              Our founders, experienced professionals from both the travel and technology industries, 
              recognized the need for a modern, intuitive platform specifically designed for tour operators.
            </p>
            <p className="text-gray-700">
              We set out to create a comprehensive solution that would handle everything from inventory 
              management to customer relations, all while providing the flexibility and insights needed 
              to grow a successful tour business in today's competitive market.
            </p>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-700">
              Our mission is to empower tour operators and DMCs with the technology they need to 
              manage their business efficiently, serve their customers better, and scale their operations. 
              We believe that by simplifying complex processes and providing actionable insights, 
              we can help our partners focus on what matters most - creating amazing travel experiences.
            </p>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">What We Offer</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Complete Tour Management</h3>
                <p className="text-gray-700">
                  From inventory management to customer relations, our platform handles every aspect 
                  of your tour operations in one unified system.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Real-time Analytics</h3>
                <p className="text-gray-700">
                  Get actionable insights into your business performance with our comprehensive 
                  reporting and analytics tools.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Seamless Booking Experience</h3>
                <p className="text-gray-700">
                  Provide your customers with a smooth, intuitive booking experience that converts 
                  visitors into paying customers.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Global Payment Processing</h3>
                <p className="text-gray-700">
                  Accept payments in multiple currencies from customers around the world with 
                  our integrated payment processing system.
                </p>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Our Team</h2>
            <p className="text-gray-700 mb-4">
              Our team combines deep expertise in travel operations with cutting-edge technology knowledge. 
              We're a diverse group of professionals who share a common goal: helping tour operators 
              succeed in an increasingly competitive market.
            </p>
            <p className="text-gray-700">
              We're constantly innovating and adding new features based on feedback from our partners, 
              ensuring that Passio Tour continues to meet the evolving needs of the travel industry.
            </p>
          </div>
          
          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Join Our Community</h2>
            <p className="text-gray-700 mb-4">
              Thousands of tour operators trust Passio Tour to manage their business operations. 
              Join them and discover how our platform can help grow your business.
            </p>
            <div className="text-center">
              <button className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors">
                Start Your Free Trial
              </button>
            </div>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  )
}