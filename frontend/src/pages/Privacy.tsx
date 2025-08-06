import React from 'react';

const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy for X Archive Extractor</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-sm text-gray-600 mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Overview</h2>
              <p className="text-gray-700 mb-4">
                X Archive Extractor is a browser extension that allows users to extract and archive tweets from Twitter/X. 
                This privacy policy explains how we collect, use, and protect your information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information We Collect</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">User Account Information</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li><strong>Email address</strong> - Required for account creation and login</li>
                <li><strong>Phone number</strong> - Optional, for account verification</li>
                <li><strong>Password</strong> - Stored securely using industry-standard encryption</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">Authentication Data</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li><strong>JWT tokens</strong> - Stored locally in browser storage for session management</li>
                <li><strong>User profile data</strong> - Basic account information (email, user ID)</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">Tweet Data</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li><strong>Extracted tweets</strong> - Content, metadata, engagement metrics</li>
                <li><strong>User IDs and usernames</strong> - From the Twitter/X profiles you extract from</li>
                <li><strong>Extraction timestamps</strong> - When data was collected</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">Account Management</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Create and manage your user account</li>
                <li>Authenticate your login sessions</li>
                <li>Provide customer support</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">Tweet Archiving</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Process and store extracted tweet data</li>
                <li>Generate JSON archives with metadata</li>
                <li>Upload archives to secure cloud storage (AWS S3)</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">Service Improvement</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Analyze usage patterns (anonymized)</li>
                <li>Improve extension functionality</li>
                <li>Fix bugs and technical issues</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Extension Permissions</h2>
              
              <div className="bg-gray-50 p-6 rounded-lg mb-4">
                <h3 className="text-xl font-medium text-gray-900 mb-3">Required Permissions</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">activeTab</h4>
                    <ul className="list-disc pl-6 text-sm text-gray-700">
                      <li>Purpose: Access the currently active Twitter/X tab</li>
                      <li>Usage: Only when you click the extension button</li>
                      <li>Data accessed: Tweet content and metadata from the page DOM</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900">storage</h4>
                    <ul className="list-disc pl-6 text-sm text-gray-700">
                      <li>Purpose: Store authentication tokens locally</li>
                      <li>Usage: Maintain login sessions between browser sessions</li>
                      <li>Data stored: JWT tokens, user preferences</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900">scripting</h4>
                    <ul className="list-disc pl-6 text-sm text-gray-700">
                      <li>Purpose: Inject tweet extraction script into Twitter/X pages</li>
                      <li>Usage: Enable reading tweet data from page structure</li>
                      <li>Data accessed: DOM elements containing tweet information</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900">host_permissions: https://api-extractor.aayushman.dev/</h4>
                    <ul className="list-disc pl-6 text-sm text-gray-700">
                      <li>Purpose: Communicate with our backend API</li>
                      <li>Usage: User authentication and S3 uploads</li>
                      <li>Data transmitted: Login credentials, extracted tweet data</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">No Remote Code Execution</h4>
                <ul className="list-disc pl-6 text-sm text-green-800">
                  <li>All extension scripts run locally in your browser</li>
                  <li>No external code is downloaded or executed</li>
                  <li>All functionality is contained within the extension bundle</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Storage and Security</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">Local Storage</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Authentication tokens stored in browser's local storage</li>
                <li>No sensitive data stored in plain text</li>
                <li>Data remains on your device until you clear browser data</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">Cloud Storage</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Tweet archives uploaded to AWS S3</li>
                <li>Encrypted in transit and at rest</li>
                <li>Accessible only to authenticated users</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights</h2>
              <p className="text-gray-700 mb-3">You have the right to:</p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Access your stored data</li>
                <li>Delete your account and all associated data</li>
                <li>Export your tweet archives</li>
                <li>Opt out of data collection (by not using the service)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Sharing</h2>
              <p className="text-gray-700 mb-3">We do not:</p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Sell your personal information</li>
                <li>Share data with third-party advertisers</li>
                <li>Use data for purposes other than service provision</li>
                <li>Access your data without your explicit action</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
              <p className="text-gray-700 mb-3">For privacy-related questions or concerns:</p>
              <ul className="list-none pl-6 mb-4 text-gray-700">
                <li>Email: privacy@your-domain.com</li>
                <li>Website: https://your-domain.com</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Legal Basis</h2>
              <p className="text-gray-700 mb-3">This privacy policy complies with:</p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>General Data Protection Regulation (GDPR)</li>
                <li>California Consumer Privacy Act (CCPA)</li>
                <li>Other applicable privacy laws</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Consent</h2>
              <p className="text-gray-700">
                By using X Archive Extractor, you consent to the collection and use of information as described in this privacy policy.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy; 