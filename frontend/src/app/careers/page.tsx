import LayoutWrapper from '@/components/layout/LayoutWrapper'

export default function CareersPage() {
  return (
    <LayoutWrapper>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Careers</h1>
        
        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Join Our Team</h2>
            <p className="text-gray-700">
              At Passio Tour, we're building the future of tour management. We're looking for 
              passionate individuals who want to help shape the travel industry and make a 
              meaningful impact on how people experience the world.
            </p>
          </div>
          
          <div className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Why Work With Us?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <p className="ml-3 text-gray-700">Competitive salary and equity packages</p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <p className="ml-3 text-gray-700">Flexible working arrangements</p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <p className="ml-3 text-gray-700">Health, dental, and vision insurance</p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <p className="ml-3 text-gray-700">Professional development opportunities</p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <p className="ml-3 text-gray-700">Unlimited PTO policy</p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <p className="ml-3 text-gray-700">Remote-friendly culture</p>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Openings</h2>
            
            <div className="border border-gray-200 rounded-lg mb-4">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900">Senior Frontend Developer</h3>
                <div className="flex flex-wrap items-center text-sm text-gray-500 mt-1">
                  <span className="mr-4">Remote</span>
                  <span className="mr-4">Full-time</span>
                  <span>Engineering</span>
                </div>
                <p className="text-gray-700 mt-3">
                  We're looking for an experienced Frontend Developer to help build our next-generation 
                  tour management platform. You'll work with React, TypeScript, and modern web technologies 
                  to create intuitive user experiences for tour operators and travelers.
                </p>
                <button className="mt-4 text-blue-600 font-medium hover:underline">
                  View Details
                </button>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg mb-4">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900">Tour Operations Manager</h3>
                <div className="flex flex-wrap items-center text-sm text-gray-500 mt-1">
                  <span className="mr-4">San Francisco, CA</span>
                  <span className="mr-4">Full-time</span>
                  <span>Operations</span>
                </div>
                <p className="text-gray-700 mt-3">
                  Join our operations team to help manage relationships with tour operators and 
                  ensure smooth platform functionality. You'll work directly with our clients 
                  to optimize their tour management processes.
                </p>
                <button className="mt-4 text-blue-600 font-medium hover:underline">
                  View Details
                </button>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg mb-4">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900">Product Designer</h3>
                <div className="flex flex-wrap items-center text-sm text-gray-500 mt-1">
                  <span className="mr-4">Remote</span>
                  <span className="mr-4">Full-time</span>
                  <span>Product</span>
                </div>
                <p className="text-gray-700 mt-3">
                  As a Product Designer, you'll be responsible for creating intuitive user experiences 
                  for our platform. You'll work closely with our development team to design 
                  solutions that make tour management simple and efficient.
                </p>
                <button className="mt-4 text-blue-600 font-medium hover:underline">
                  View Details
                </button>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Life at Passio Tour</h2>
            <p className="text-gray-700 mb-4">
              We're a team of travel enthusiasts, technology innovators, and customer advocates 
              who share a common goal: making tour management easier and more efficient. We foster 
              a culture of continuous learning, collaboration, and innovation where everyone's 
              ideas are valued.
            </p>
            <p className="text-gray-700">
              Our team members come from diverse backgrounds and we believe that different 
              perspectives make us stronger. We're committed to creating an inclusive environment 
              where everyone can do their best work.
            </p>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  )
}