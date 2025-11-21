import LayoutWrapper from '@/components/layout/LayoutWrapper'

export default function PressPage() {
  return (
    <LayoutWrapper>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Press & Media</h1>
        
        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Press Resources</h2>
            <p className="text-gray-700">
              Welcome to the Passio Tour press center. Here you'll find press releases, 
              company information, and media resources to help you write about our company.
            </p>
          </div>
          
          <div className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">About Passio Tour</h2>
            <p className="text-gray-700 mb-4">
              Founded in 2023, Passio Tour is a leading tour management platform designed for 
              Destination Management Companies (DMCs) and tour operators. Our platform streamlines 
              tour operations, from inventory management to customer relations, helping our clients 
              focus on creating unforgettable travel experiences.
            </p>
            <p className="text-gray-700">
              Based in San Francisco, California, Passio Tour serves thousands of tour operators 
              across more than 50 countries, processing millions of bookings annually.
            </p>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Press Releases</h2>
            
            <div className="border-b border-gray-200 pb-6 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Passio Tour Raises $15M Series A to Expand Global Footprint</h3>
                  <p className="text-sm text-gray-500 mt-1">June 12, 2024</p>
                </div>
                <button className="text-blue-600 font-medium hover:underline">Read</button>
              </div>
              <p className="text-gray-700 mt-3">
                Funding will support international expansion and product development as Passio Tour 
                continues to transform tour management for operators worldwide.
              </p>
            </div>
            
            <div className="border-b border-gray-200 pb-6 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Passio Tour Partners with Major DMCs to Enhance Tour Experience</h3>
                  <p className="text-sm text-gray-500 mt-1">March 28, 2024</p>
                </div>
                <button className="text-blue-600 font-medium hover:underline">Read</button>
              </div>
              <p className="text-gray-700 mt-3">
                Strategic partnerships with leading destination management companies enable 
                Passio Tour to offer travelers more diverse and authentic tour experiences.
              </p>
            </div>
            
            <div className="border-b border-gray-200 pb-6 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">New Passio Tour Feature Simplifies Multi-Location Tour Management</h3>
                  <p className="text-sm text-gray-500 mt-1">January 15, 2024</p>
                </div>
                <button className="text-blue-600 font-medium hover:underline">Read</button>
              </div>
              <p className="text-gray-700 mt-3">
                Latest platform update allows tour operators to manage complex, multi-location 
              tours with a single interface.
              </p>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Media Resources</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Company Logos</h3>
                <p className="text-gray-700 mb-4">
                  Download our official logos and brand assets for media use.
                </p>
                <button className="text-blue-600 font-medium hover:underline">
                  Download Logo Pack
                </button>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Fact Sheet</h3>
                <p className="text-gray-700 mb-4">
                  Key facts and figures about Passio Tour in a downloadable format.
                </p>
                <button className="text-blue-600 font-medium hover:underline">
                  Download Fact Sheet
                </button>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Executive Photos</h3>
                <p className="text-gray-700 mb-4">
                  High-resolution photos of our executive team for media use.
                </p>
                <button className="text-blue-600 font-medium hover:underline">
                  View Photos
                </button>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Press Kit</h3>
                <p className="text-gray-700 mb-4">
                  Complete press kit with company information, product details, and key statistics.
                </p>
                <button className="text-blue-600 font-medium hover:underline">
                  Download Press Kit
                </button>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Press Inquiries</h3>
                <p className="text-gray-700 mb-2">Sarah Johnson</p>
                <p className="text-gray-700 mb-2">Director of Communications</p>
                <p className="text-gray-700">press@passiotour.com</p>
                <p className="text-gray-700">+1 (555) 123-4567</p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">General Inquiries</h3>
                <p className="text-gray-700 mb-2">Media Relations</p>
                <p className="text-gray-700">media@passiotour.com</p>
                <p className="text-gray-700">+1 (555) 123-4568</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  )
}