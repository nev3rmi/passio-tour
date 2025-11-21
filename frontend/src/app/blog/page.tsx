import LayoutWrapper from '@/components/layout/LayoutWrapper'

export default function BlogPage() {
  return (
    <LayoutWrapper>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Travel Blog</h1>
        
        <div className="mb-8 text-center">
          <p className="text-gray-700">
            Discover travel tips, destination guides, and stories from around the world. 
            Get inspired for your next adventure with our collection of articles.
          </p>
        </div>
        
        <div className="space-y-8">
          <article className="border-b border-gray-200 pb-8">
            <div className="flex items-center text-sm text-gray-500 mb-3">
              <span>May 15, 2024</span>
              <span className="mx-2">•</span>
              <span>Tourism Insights</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Top 10 Destinations for 2024: Travel Trends and Predictions</h2>
            <p className="text-gray-700 mb-4">
              As we look ahead to 2024, the travel industry continues to evolve with new trends 
              and destinations capturing the attention of travelers worldwide. From sustainable 
              tourism to unique cultural experiences, here are the top destinations that should 
              be on your travel radar.
            </p>
            <button className="text-blue-600 font-medium hover:underline">
              Read More
            </button>
          </article>
          
          <article className="border-b border-gray-200 pb-8">
            <div className="flex items-center text-sm text-gray-500 mb-3">
              <span>April 28, 2024</span>
              <span className="mx-2">•</span>
              <span>Travel Tips</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">How to Plan the Perfect Multi-City Tour</h2>
            <p className="text-gray-700 mb-4">
              Planning a multi-city tour can be overwhelming, but with the right approach, 
              it can lead to the most rewarding travel experiences. Learn how to efficiently 
              navigate between cities while maximizing your time and minimizing stress.
            </p>
            <button className="text-blue-600 font-medium hover:underline">
              Read More
            </button>
          </article>
          
          <article className="border-b border-gray-200 pb-8">
            <div className="flex items-center text-sm text-gray-500 mb-3">
              <span>April 12, 2024</span>
              <span className="mx-2">•</span>
              <span>Destination Guides</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Hidden Gems: Off-the-Beaten-Path Destinations in Europe</h2>
            <p className="text-gray-700 mb-4">
              While millions of travelers flock to Paris, Rome, and Barcelona each year, 
              Europe has countless hidden gems waiting to be discovered. We explore some 
              of the continent's most beautiful and lesser-known destinations that offer 
              authentic experiences without the crowds.
            </p>
            <button className="text-blue-600 font-medium hover:underline">
              Read More
            </button>
          </article>
          
          <article className="border-b border-gray-200 pb-8">
            <div className="flex items-center text-sm text-gray-500 mb-3">
              <span>March 30, 2024</span>
              <span className="mx-2">•</span>
              <span>Travel Tips</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Sustainable Travel: Making Responsible Choices</h2>
            <p className="text-gray-700 mb-4">
              As awareness of environmental and social impact grows, sustainable travel 
              has become more important than ever. Learn how to make responsible choices 
              that benefit local communities and protect the destinations we love.
            </p>
            <button className="text-blue-600 font-medium hover:underline">
              Read More
            </button>
          </article>
          
          <article className="border-b border-gray-200 pb-8">
            <div className="flex items-center text-sm text-gray-500 mb-3">
              <span>March 15, 2024</span>
              <span className="mx-2">•</span>
              <span>Tourism Business</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">The Future of Tour Management: Trends for Operators</h2>
            <p className="text-gray-700 mb-4">
              The tour management industry is rapidly evolving with new technologies and 
              changing consumer preferences. We examine the key trends that tour operators 
              should be aware of to stay competitive and meet customer expectations.
            </p>
            <button className="text-blue-600 font-medium hover:underline">
              Read More
            </button>
          </article>
        </div>
        
        <div className="mt-12 text-center">
          <button className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors">
            Load More Articles
          </button>
        </div>
        
        <div className="mt-16">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Subscribe to Our Newsletter</h2>
          <div className="max-w-md mx-auto flex">
            <input
              type="email"
              placeholder="Enter your email address"
              className="flex-grow px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button className="bg-blue-600 text-white px-6 py-2 rounded-r-md hover:bg-blue-700">
              Subscribe
            </button>
          </div>
          <p className="text-gray-600 text-sm mt-2">
            Get the latest travel tips and destination guides delivered to your inbox.
          </p>
        </div>
      </div>
    </LayoutWrapper>
  )
}