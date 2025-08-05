import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              © 2024 Tweet Extractor. Made with ❤️
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
                               <a
                     href="https://buymeacoffee.com/aayushmansingh"
                     target="_blank"
                     rel="noopener noreferrer"
                     className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black text-sm font-medium rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-all duration-200 shadow-sm hover:shadow-md"
                   >
                     <span className="mr-2">☕</span>
                     Buy me a coffee
                   </a>
            
            <a
              href="https://github.com/your-username/tweet-extractor"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              GitHub
            </a>
            
            <a
              href="/privacy"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Privacy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 