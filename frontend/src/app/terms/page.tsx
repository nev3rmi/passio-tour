import LayoutWrapper from '@/components/layout/LayoutWrapper'

export default function TermsPage() {
  return (
    <LayoutWrapper>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-700 mb-4">
            <strong>Last updated:</strong> [Current Date]
          </p>
          
          <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Introduction</h2>
          <p className="text-gray-700 mb-4">
            Welcome to Passio Tour ("Company", "we", "our", "us")! These Terms of Service ("Terms", 
            "Terms of Service") govern your use of our website located at passiotour.com (together 
            or individually "Service") operated by Passio Tour.
          </p>
          
          <p className="text-gray-700 mb-4">
            Your agreement with us includes these Terms and our Privacy Policy ("Agreements"). 
            You acknowledge that you have read and understood the Agreements, and agree to be bound 
            by them.
          </p>
          
          <p className="text-gray-700 mb-4">
            If you do not agree with (or cannot comply with) Agreements, then you may not use 
            the Service. If these Terms are considered an offer, acceptance is expressly limited 
            to these Terms.
          </p>
          
          <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Use License</h2>
          <p className="text-gray-700 mb-4">
            Permission is granted to temporarily download one copy of the materials (information 
            or software) on Passio Tour's Service for personal, non-commercial transitory viewing 
            only. This is the grant of a license, not a transfer of title, and under this license 
            you may not:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li>Modify or copy the materials</li>
            <li>Use the materials for any commercial purpose or for any public display</li>
            <li>Attempt to decompile or reverse engineer any software contained on Passio Tour's Service</li>
            <li>Remove any copyright or other proprietary notations from the materials</li>
            <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
          </ul>
          
          <p className="text-gray-700 mb-4">
            This license shall automatically terminate if you violate any of these restrictions 
            and may be terminated by Passio Tour at any time.
          </p>
          
          <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Disclaimer</h2>
          <p className="text-gray-700 mb-4">
            The materials on Passio Tour's Service are provided on an "as is" basis. Passio Tour 
            makes no warranties, expressed or implied, and hereby disclaims and negates all other 
            warranties including, without limitation, implied warranties or conditions of 
            merchantability, fitness for a particular purpose, or non-infringement of intellectual 
            property or other violation of rights.
          </p>
          
          <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Limitations</h2>
          <p className="text-gray-700 mb-4">
            In no event shall Passio Tour or its suppliers be liable for any damages (including, 
            without limitation, damages for loss of data or profit, or due to business interruption) 
            arising out of the use or inability to use the Service, even if Passio Tour or a 
            Passio Tour authorized representative has been notified orally or in writing of the 
            possibility of such damage.
          </p>
          
          <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Accuracy of Materials</h2>
          <p className="text-gray-700 mb-4">
            The materials appearing on Passio Tour's Service may include technical, typographical, 
            or photographic errors. Passio Tour does not warrant that any of the materials on 
            its Service are accurate, complete, or current. Passio Tour may make changes to the 
            materials contained on its Service at any time without notice. However Passio Tour 
            does not make any commitment to update the materials.
          </p>
          
          <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Links</h2>
          <p className="text-gray-700 mb-4">
            Passio Tour has not reviewed all of the sites linked to its Service and is not 
            responsible for the contents of any such linked site. The presence of any link does 
            not imply endorsement by Passio Tour of the site. Use of any such linked website 
            is at your own risk.
          </p>
          
          <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Modifications</h2>
          <p className="text-gray-700 mb-4">
            Passio Tour may revise these Terms of Service at any time without notice. By using 
            this Service you are agreeing to be bound by the then current version of these Terms 
            of Service.
          </p>
          
          <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Governing Law</h2>
          <p className="text-gray-700 mb-4">
            These Terms shall be governed and construed in accordance with the laws of [Your State/Country], 
            without regard to its conflict of law provisions.
          </p>
          
          <p className="text-gray-700">
            Our failure to enforce any right or provision of these Terms will not be considered 
            a waiver of those rights. If any provision of these Terms is held to be invalid or 
            unenforceable by a court, the remaining provisions of these Terms will remain in effect. 
            These Terms constitute the entire agreement between us regarding our Service, and 
            supersede and replace any prior agreements we might have had between us regarding 
            the Service.
          </p>
        </div>
      </div>
    </LayoutWrapper>
  )
}