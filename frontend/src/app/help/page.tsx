import LayoutWrapper from '@/components/layout/LayoutWrapper'

export default function HelpPage() {
  return (
    <LayoutWrapper>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Help & Support</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Getting Started</h2>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-blue-600 hover:underline">Creating your first tour</a>
              </li>
              <li>
                <a href="#" className="text-blue-600 hover:underline">Setting up pricing and inventory</a>
              </li>
              <li>
                <a href="#" className="text-blue-600 hover:underline">Managing bookings and customers</a>
              </li>
              <li>
                <a href="#" className="text-blue-600 hover:underline">Processing payments</a>
              </li>
              <li>
                <a href="#" className="text-blue-600 hover:underline">Reporting and analytics</a>
              </li>
            </ul>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Management</h2>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-blue-600 hover:underline">Updating profile information</a>
              </li>
              <li>
                <a href="#" className="text-blue-600 hover:underline">Changing password</a>
              </li>
              <li>
                <a href="#" className="text-blue-600 hover:underline">Managing subscriptions</a>
              </li>
              <li>
                <a href="#" className="text-blue-600 hover:underline">Security settings</a>
              </li>
              <li>
                <a href="#" className="text-blue-600 hover:underline">Account deletion</a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Troubleshooting</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Login Issues</h3>
              <p className="text-gray-700 mb-2">
                If you're having trouble logging in:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li>Check that your email and password are correct</li>
                <li>Try resetting your password using the "Forgot Password" link</li>
                <li>Clear your browser cache and cookies</li>
                <li>Try using a different browser or device</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Booking Problems</h3>
              <p className="text-gray-700 mb-2">
                If customers are experiencing issues with bookings:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li>Verify that tour inventory is properly set</li>
                <li>Check that dates and times are correctly configured</li>
                <li>Ensure payment processing is working</li>
                <li>Review pricing settings for accuracy</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Issues</h3>
              <p className="text-gray-700 mb-2">
                For payment processing problems:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li>Verify your Stripe integration is properly configured</li>
                <li>Check that payment methods are enabled</li>
                <li>Review any error messages from the payment processor</li>
                <li>Ensure customer payment information is valid</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-12 p-6 bg-blue-50 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Need More Help?</h2>
          <p className="text-gray-700 mb-4">
            If you can't find the answer to your question in our help documentation, 
            our support team is ready to assist you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              Contact Support
            </button>
            <button className="border border-blue-600 text-blue-600 px-4 py-2 rounded-md hover:bg-blue-50 transition-colors">
              Schedule a Demo
            </button>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  )
}