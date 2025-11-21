import LayoutWrapper from '@/components/layout/LayoutWrapper'

export default function DestinationsPage() {
  return (
    <LayoutWrapper>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Popular Destinations</h1>
        
        <div className="mb-8 text-center max-w-2xl mx-auto">
          <p className="text-gray-700">
            Discover amazing destinations around the world with our curated collection of tours. 
            From cultural experiences to adventure activities, find the perfect tour for your next trip.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="h-48 bg-gradient-to-r from-blue-400 to-purple-500"></div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Paris, France</h3>
              <p className="text-gray-600 mb-4">
                Experience the romance of the City of Light with our guided tours of iconic landmarks.
              </p>
              <button className="text-blue-600 font-medium hover:underline">
                View Tours
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="h-48 bg-gradient-to-r from-green-400 to-blue-500"></div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Tokyo, Japan</h3>
              <p className="text-gray-600 mb-4">
                Immerse yourself in the vibrant culture and traditions of the Japanese capital.
              </p>
              <button className="text-blue-600 font-medium hover:underline">
                View Tours
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="h-48 bg-gradient-to-r from-yellow-400 to-red-500"></div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">New York, USA</h3>
              <p className="text-gray-600 mb-4">
                Explore the city that never sleeps with our diverse range of city tours.
              </p>
              <button className="text-blue-600 font-medium hover:underline">
                View Tours
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="h-48 bg-gradient-to-r from-purple-400 to-pink-500"></div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Bali, Indonesia</h3>
              <p className="text-gray-600 mb-4">
                Discover the tropical paradise of Bali with our beach and cultural tours.
              </p>
              <button className="text-blue-600 font-medium hover:underline">
                View Tours
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="h-48 bg-gradient-to-r from-red-400 to-yellow-500"></div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Rome, Italy</h3>
              <p className="text-gray-600 mb-4">
                Journey through ancient history with our guided tours of Rome's iconic sites.
              </p>
              <button className="text-blue-600 font-medium hover:underline">
                View Tours
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="h-48 bg-gradient-to-r from-indigo-400 to-blue-500"></div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Sydney, Australia</h3>
              <p className="text-gray-600 mb-4">
                Experience the beauty of Australia's largest city with our harbor and wildlife tours.
              </p>
              <button className="text-blue-600 font-medium hover:underline">
                View Tours
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Looking for Something Specific?</h2>
          <div className="max-w-md mx-auto flex">
            <input
              type="text"
              placeholder="Search destinations..."
              className="flex-grow px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button className="bg-blue-600 text-white px-6 py-2 rounded-r-md hover:bg-blue-700">
              Search
            </button>
          </div>
        </div>
        
        <div className="mt-16">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Why Choose Our Destination Tours?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Local Experts</h3>
              <p className="text-gray-600">
                Our guides are locals who know the best hidden gems and insider tips for each destination.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Flexible Booking</h3>
              <p className="text-gray-600">
                Easy to book, modify, or cancel with our flexible booking policies.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Memorable Experiences</h3>
              <p className="text-gray-600">
                Curated tours designed to create unforgettable memories and authentic experiences.
              </p>
            </div>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  )
}