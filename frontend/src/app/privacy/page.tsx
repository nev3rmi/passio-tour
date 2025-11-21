import LayoutWrapper from '@/components/layout/LayoutWrapper'

export default function PrivacyPage() {
  return (
    <LayoutWrapper>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-700 mb-4">
            <strong>Last updated:</strong> [Current Date]
          </p>
          
          <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Introduction</h2>
          <p className="text-gray-700 mb-4">
            Passio Tour ("us", "we", or "our") operates the Passio Tour platform (the "Service"). 
            This page informs you of our policies regarding the collection, use, and disclosure 
            of personal data when you use our Service and the choices you have associated with that data.
          </p>
          
          <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Information Collection and Use</h2>
          <p className="text-gray-700 mb-4">
            We collect several different types of information for various purposes to provide and 
            improve our Service to you.
          </p>
          
          <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">Types of Data Collected</h3>
          <p className="text-gray-700 mb-2"><strong>Personal Data</strong></p>
          <p className="text-gray-700 mb-4">
            While using our Service, we may ask you to provide us with certain personally 
            identifiable information that can be used to contact or identify you ("Personal Data").
          </p>
          
          <p className="text-gray-700 mb-2"><strong>Usage Data</strong></p>
          <p className="text-gray-700 mb-4">
            We may also collect information how the Service is accessed and used ("Usage Data"). 
            This Usage Data may include information such as your computer's Internet Protocol address 
            (e.g. IP address), browser type, browser version, the pages of our Service that you visit, 
            the time and date of your visit, the time spent on those pages, and other diagnostic data.
          </p>
          
          <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Use of Data</h2>
          <p className="text-gray-700 mb-2">Passio Tour uses the collected data for various purposes:</p>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li>To provide and maintain our Service</li>
            <li>To notify you about changes to our Service</li>
            <li>To allow you to participate in interactive features of our Service</li>
            <li>To provide customer support</li>
            <li>To gather analysis or valuable information so that we can improve our Service</li>
            <li>To monitor the usage of our Service</li>
            <li>To detect, prevent, and address technical issues</li>
          </ul>
          
          <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Security of Data</h2>
          <p className="text-gray-700 mb-4">
            The security of your data is important to us but remember that no method of transmission 
            over the Internet or method of electronic storage is 100% secure. While we strive to use 
            commercially acceptable means to protect your Personal Data, we cannot guarantee its 
            absolute security.
          </p>
          
          <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Service Providers</h2>
          <p className="text-gray-700 mb-4">
            We may employ third party companies and individuals to facilitate our Service ("Service Providers"), 
            provide the Service on our behalf, perform Service-related services or assist us in analyzing 
            how our Service is used.
          </p>
          
          <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Changes to This Privacy Policy</h2>
          <p className="text-gray-700 mb-4">
            We may update our Privacy Policy from time to time. We will notify you of any changes by 
            posting the new Privacy Policy on this page and updating the "Last updated" date.
          </p>
          
          <p className="text-gray-700 mb-4">
            You are advised to review this Privacy Policy periodically for any changes. Changes to 
            this Privacy Policy are effective when they are posted on this page.
          </p>
          
          <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Contact Us</h2>
          <p className="text-gray-700">
            If you have any questions about this Privacy Policy, please contact us:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mt-2">
            <li>By email: privacy@passiotour.com</li>
          </ul>
        </div>
      </div>
    </LayoutWrapper>
  )
}