import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FileText, 
  Download, 
  Calendar, 
  User, 
  LogOut, 
  RefreshCw, 
  ExternalLink,
  Trash2,
  Eye
} from 'lucide-react';
import axios from 'axios';

interface Archive {
  _id: string;
  filename: string;
  originalName: string;
  size: number;
  uploadDate: string;
  s3Url: string;
  tweetCount?: number;
  profileInfo?: {
    username?: string;
    displayName?: string;
  };
}

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [archives, setArchives] = useState<Archive[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'https://api-extractor.aayushman.dev';

  useEffect(() => {
    fetchArchives();
  }, []);

  // Add keyboard shortcut for refresh
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        event.preventDefault();
        if (!refreshing) {
          handleRefresh();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [refreshing]);

  const fetchArchives = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_BASE}/api/recent-uploads`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('🔍 [DASHBOARD] Received archives data:', response.data);
      console.log('🔍 [DASHBOARD] Archives array:', response.data.archives);
      if (response.data.archives && response.data.archives.length > 0) {
        console.log('🔍 [DASHBOARD] First archive profileInfo:', response.data.archives[0].profileInfo);
      }
      setArchives(response.data.archives || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch archives:', error);
      toast({
        title: "Error",
        description: "Failed to load your archives",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchArchives();
      toast({
        title: "Success",
        description: "Archives refreshed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh archives",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    });
  };

  const handleDeleteArchive = async (archiveId: string) => {
    // Add confirmation dialog
    const isConfirmed = window.confirm('Are you sure you want to delete this archive? This action cannot be undone.');
    if (!isConfirmed) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(`${API_BASE}/api/archive/${archiveId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Remove the archive from the local state
      setArchives(archives.filter(archive => archive._id !== archiveId));

      toast({
        title: "Archive Deleted",
        description: "Archive has been successfully deleted",
      });
    } catch (error) {
      console.error('Failed to delete archive:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete the archive",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const downloadArchive = async (archive: Archive) => {
    try {
      const token = localStorage.getItem('authToken');
      const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'https://api-extractor.aayushman.dev';
      
      // Use the API endpoint instead of direct S3 access to avoid CORS issues
      const response = await axios.get(`${API_BASE}/api/report/${archive._id}/download`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', archive.originalName.replace('.html', '.json'));
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: `${archive.originalName.replace('.html', '.json')} is being downloaded`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download the archive",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Tweet Extractor
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{user?.email}</span>
              </div>
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Manage your tweet archives and extraction history
              </p>
            </div>
            <div className="flex flex-col items-end">
              <Button 
                onClick={handleRefresh} 
                disabled={refreshing}
                variant="outline"
                className="border-blue-200 hover:bg-blue-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh Archives'}
              </Button>
              <p className="text-xs text-gray-500 mt-1">
                Press Ctrl+R to refresh
              </p>
              {lastUpdated && (
                <p className="text-xs text-gray-400 mt-1">
                  Last updated: {formatDate(lastUpdated.toISOString())}
                </p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Archives</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{archives.length}</div>
                <p className="text-xs text-muted-foreground">
                  Tweet archives created
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Size</CardTitle>
                <Download className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatFileSize(archives.reduce((acc, archive) => acc + archive.size, 0))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Combined archive size
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Latest Archive</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {archives.length > 0 ? formatDate(archives[0].uploadDate).split(',')[0] : 'None'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Most recent extraction
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Archives List */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Your Archives</h2>
          
          {archives.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No archives yet</h3>
                <p className="text-gray-600 text-center mb-4">
                  Use the browser extension to extract your first tweet archive
                </p>
                <Button>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Get Extension
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(() => { 
                console.log('🔍 [DASHBOARD] Rendering archives:', archives);
                archives.forEach((archive, index) => {
                  console.log(`🔍 [DASHBOARD] Archive ${index} profileInfo:`, archive.profileInfo);
                });
                return null;
              })()}
              {archives.map((archive) => (
                <Card key={archive._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                                         <div className="flex items-center justify-between">
                       <div className="flex items-center space-x-2">
                         <FileText className="w-5 h-5 text-blue-500" />
                         <CardTitle className="text-lg">
                           {archive.profileInfo?.username ? `@${archive.profileInfo.username}` : 'Tweet Archive'}
                         </CardTitle>
                       </div>
                     </div>
                     <CardDescription>
                       {formatFileSize(archive.size)} • {formatDate(archive.uploadDate)}
                       {archive.profileInfo?.displayName && (
                         <span className="block text-xs text-gray-500 mt-1">
                           {archive.profileInfo.displayName}
                         </span>
                       )}
                     </CardDescription>
                  </CardHeader>
                                     <CardContent>
                     {archive.tweetCount && (
                       <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                         <p className="text-sm font-medium text-blue-900">
                           📊 {archive.tweetCount} tweets extracted
                         </p>
                       </div>
                     )}
                     
                     <div className="flex space-x-2">
                       <Button 
                         size="sm" 
                         onClick={() => downloadArchive(archive)}
                       >
                         <Download className="w-4 h-4 mr-2" />
                         Download
                       </Button>
                       <Button 
                         size="sm" 
                         variant="outline"
                         onClick={() => {
                           // Navigate to the React report viewer
                           console.log('Navigating to report with ID:', archive._id);
                           console.log('Archive object:', archive);
                           navigate(`/report/${archive._id}`);
                         }}
                         title="View Report"
                         className="flex-1"
                       >
                         <Eye className="w-4 h-4 mr-2" />
                         View
                       </Button>
                       <Button 
                         size="sm" 
                         variant="outline"
                         onClick={() => handleDeleteArchive(archive._id)}
                         title="Delete Archive"
                       >
                         <Trash2 className="w-4 h-4" />
                       </Button>
                     </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8 mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">Tweet Extractor</span>
            </div>
            <p className="text-gray-400 mb-4">
              Powerful tweet extraction made simple
            </p>
            <div className="flex justify-center space-x-6 text-sm text-gray-400 mb-4">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
            </div>
            <div className="border-t border-gray-800 pt-4">
              <p className="text-gray-400 text-sm">
                Built with ❤️ by{' '}
                <a 
                  href="https://github.com/aayushman-singh" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
                >
                  Aayushman Singh
                </a>
                {' '}•{' '}
                <a 
                  href="https://aayushman.dev" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
                >
                  aayushman.dev
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard; 