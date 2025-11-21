import LayoutWrapper from '@/components/layout/LayoutWrapper'

export default function FAQPage() {
  return (
    <LayoutWrapper>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h1>
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">What is Passio Tour?</h2>
            <p className="text-gray-700">
              Passio Tour is a comprehensive tour management platform designed for Destination 
              Management Companies (DMCs) and tour operators. It helps manage inventory, process 
              bookings, handle payments, and manage customer relationships with minimal operational overhead.
            </p>
          </div>
          
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">How do I create an account?</h2>
            <p className="text-gray-700">
              You can create an account by clicking on the "Register" link in the navigation bar 
              and filling out the registration form with your email, name, and password. After 
              registration, you'll need to verify your email address before you can access the platform.
            </p>
          </div>
          
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">How do I reset my password?</h2>
            <p className="text-gray-700">
              If you've forgotten your password, click on the "Forgot Password" link on the login 
              page and enter your email address. We'll send you an email with instructions to 
              reset your password.
            </p>
          </div>
          
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Can I manage multiple tours?</h2>
            <p className="text-gray-700">
              Yes, Passio Tour allows you to create and manage multiple tours from a single dashboard. 
              You can set different pricing, inventory, and availability for each tour.
            </p>
          </div>
          
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">How do customers book tours?</h2>
            <p className="text-gray-700">
              Customers can browse available tours on the public listings page and select their 
              preferred date and number of participants. They can then proceed through the booking 
              process, which includes payment processing and confirmation.
            </p>
          </div>
          
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">What payment methods do you accept?</h2>
            <p className="text-gray-700">
              Passio Tour integrates with Stripe for secure payment processing. We support all 
              major credit cards and other payment methods supported by Stripe depending on your region.
            </p>
          </div>
          
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">How can I contact support?</h2>
            <p className="text-gray-700">
              You can contact our support team by emailing support@passiotour.com or using the 
              contact form on our Contact page. Our support team typically responds within 24 hours.
            </p>
          </div>
          
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Do you offer any training or onboarding?</h2>
            <p className="text-gray-700">
              Yes, we offer onboarding assistance for new users. After creating your account, 
              you'll have access to our documentation and video tutorials. For enterprise customers, 
              we provide personalized onboarding sessions.
            </p>
          </div>
          
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Can I integrate Passio Tour with other tools?</h2>
            <p className="text-gray-700">
              Passio Tour offers API access for enterprise customers, allowing integration with 
              your existing systems. We also have partnerships with various tools for accounting, 
              CRM, and marketing automation.
            </p>
          </div>
          
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">How do you handle customer data privacy?</h2>
            <p className="text-gray-700">
              We take data privacy seriously. All customer data is encrypted and stored securely. 
              We comply with GDPR and other data protection regulations. Please review our Privacy 
              Policy for detailed information about how we collect, use, and protect your data.
            </p>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  )
}