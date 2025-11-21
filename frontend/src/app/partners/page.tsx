import LayoutWrapper from '@/components/layout/LayoutWrapper'

export default function PartnersPage() {
  return (
    <LayoutWrapper>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Partners</h1>
        
        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Partner With Us</h2>
            <p className="text-gray-700">
              At Passio Tour, we believe in the power of partnerships. We work with a diverse 
              network of tour operators, destination management companies, and travel service 
              providers to create exceptional experiences for travelers.
            </p>
          </div>
          
          <div className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Benefits of Partnership</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <p className="ml-3 text-gray-700">Access to our global customer network</p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <p className="ml-3 text-gray-700">Competitive commission structures</p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <p className="ml-3 text-gray-700">Marketing and promotional support</p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <p className="ml-3 text-gray-700">Dedicated partner support team</p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <p className="ml-3 text-gray-700">Real-time availability and booking data</p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <p className="ml-3 text-gray-700">Comprehensive analytics and reporting</p>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Our Partner Network</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto mb-3" />
                <h3 className="font-medium text-gray-900">Tour Operators</h3>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto mb-3" />
                <h3 className="font-medium text-gray-900">DMCs</h3>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto mb-3" />
                <h3 className="font-medium text-gray-900">Activity Providers</h3>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto mb-3" />
                <h3 className="font-medium text-gray-900">Accommodations</h3>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Partner Requirements</h2>
            <p className="text-gray-700 mb-4">
              We work with partners who share our commitment to excellence and customer satisfaction.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Valid business registration and licensing in your operating region</li>
              <li>Professional customer service with multilingual support capability</li>
              <li>Quality assurance and safety compliance certifications</li>
              <li>Experience in tour or travel operations (minimum 2 years preferred)</li>
              <li>Ability to maintain accurate availability and pricing information</li>
              <li>Commitment to providing exceptional customer experiences</li>
            </ul>
          </div>
          
          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Become a Partner</h2>
            <p className="text-gray-700 mb-6">
              Interested in partnering with Passio Tour? Join our network of trusted travel 
              service providers and grow your business with our global customer base.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Application Process</h3>
                <ol className="list-decimal pl-6 space-y-3 text-gray-700">
                  <li>Submit your application with business details</li>
                  <li>Review and approval by our partner team</li>
                  <li>Integration with our platform</li>
                  <li>Training and onboarding</li>
                  <li>Go live and start receiving bookings</li>
                </ol>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Get Started</h3>
                <button className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors">
                  Apply to Partner
                </button>
                <p className="text-gray-600 text-sm mt-2 text-center">
                  Questions? Contact us at partners@passiotour.com
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  )
}