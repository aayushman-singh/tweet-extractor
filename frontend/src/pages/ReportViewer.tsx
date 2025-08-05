import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FileText, 
  Download, 
  User, 
  ArrowLeft,
  Heart,
  MessageCircle,
  Repeat,
  Eye
} from 'lucide-react';
import axios from 'axios';

interface Tweet {
  id: string;
  text: string;
  created_at: string;
  public_metrics?: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
    impression_count: number;
  };
  // Direct properties from extension
  retweet_count?: number;
  favorite_count?: number;
  reply_count?: number;
  view_count?: number;
  quote_count?: number;
  bookmark_count?: number;
  entities?: {
    urls?: Array<{
      url: string;
      expanded_url: string;
      display_url: string;
    }>;
    hashtags?: Array<{
      tag: string;
    }>;
    mentions?: Array<{
      username: string;
    }>;
  };
}

interface ReportData {
  profileInfo?: {
    username: string;
    displayName: string;
    description?: string;
    followers_count?: number;
    following_count?: number;
    tweet_count?: number;
  };
  tweets: Tweet[];
  stats: {
    totalTweets: number;
    totalLikes: number;
    totalRetweets: number;
    totalViews: number;
    totalReplies: number;
  };
  timeline: {
    startDate: string;
    endDate: string;
  };
  generatedAt: string;
}

const ReportViewer: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'likes' | 'retweets' | 'views' | 'engagement'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTweets, setFilteredTweets] = useState<Tweet[]>([]);

  const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'https://your-api-domain.com';

  // Helper functions to handle different tweet data formats
  const getLikeCount = (tweet: any) => {
    if (tweet.public_metrics) return tweet.public_metrics.like_count || 0;
    if (tweet.favorite_count !== undefined) return tweet.favorite_count || 0;
    if (tweet.metrics) return tweet.metrics.likes || 0;
    return 0;
  };
  
  const getRetweetCount = (tweet: any) => {
    if (tweet.public_metrics) return tweet.public_metrics.retweet_count || 0;
    if (tweet.retweet_count !== undefined) return tweet.retweet_count || 0;
    if (tweet.metrics) return tweet.metrics.retweets || 0;
    return 0;
  };
  
  const getViewCount = (tweet: any) => {
    if (tweet.public_metrics) return tweet.public_metrics.impression_count || 0;
    if (tweet.metrics) return tweet.metrics.views || 0;
    if (tweet.view_count !== undefined) return tweet.view_count || 0;
    return 0;
  };
  
  const getReplyCount = (tweet: any) => {
    if (tweet.public_metrics) return tweet.public_metrics.reply_count || 0;
    if (tweet.metrics) return tweet.metrics.replies || 0;
    if (tweet.reply_count !== undefined) return tweet.reply_count || 0;
    return 0;
  };

  useEffect(() => {
    console.log('ReportViewer mounted with reportId:', reportId);
    console.log('Current URL:', window.location.href);
    
    if (reportId) {
      console.log('ReportId is valid, fetching data...');
      fetchReportData();
    } else {
      console.error('No reportId provided in URL');
      console.error('URL pathname:', window.location.pathname);
      console.error('URL search:', window.location.search);
      toast({
        title: "Error",
        description: "No report ID provided in URL",
        variant: "destructive",
      });
      navigate('/dashboard');
    }
  }, [reportId]);

  useEffect(() => {
    if (reportData) {
      console.log('🔍 [FRONTEND] useEffect triggered, reportData changed:', reportData);
      filterAndSortTweets();
    }
  }, [reportData, sortBy, searchQuery]);

  const fetchReportData = async () => {
    try {
      console.log('🔍 [FRONTEND] Fetching report data for ID:', reportId);
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_BASE}/api/report/${reportId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('🔍 [FRONTEND] Received report data:', response.data);
      console.log('🔍 [FRONTEND] Number of tweets:', response.data.tweets?.length || 0);
      console.log('🔍 [FRONTEND] Profile info:', response.data.profileInfo);
      console.log('🔍 [FRONTEND] Profile info type:', typeof response.data.profileInfo);
      console.log('🔍 [FRONTEND] Profile info username:', response.data.profileInfo?.username);
      console.log('🔍 [FRONTEND] Stats:', response.data.stats);
      
      setReportData(response.data);
    } catch (error) {
      console.error('Failed to fetch report:', error);
      toast({
        title: "Error",
        description: "Failed to fetch report data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortTweets = () => {
    if (!reportData) return;

    console.log('🔍 [FRONTEND] Filtering tweets, reportData:', reportData);
    console.log('🔍 [FRONTEND] Profile info in filterAndSortTweets:', reportData.profileInfo);

    let filtered = reportData.tweets;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(tweet => 
        tweet.text.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      // Handle different tweet data formats
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'likes':
          return getLikeCount(b) - getLikeCount(a);
        case 'retweets':
          return getRetweetCount(b) - getRetweetCount(a);
        case 'views':
          return getViewCount(b) - getViewCount(a);
        case 'engagement':
          const engagementA = getLikeCount(a) + getRetweetCount(a) + getReplyCount(a);
          const engagementB = getLikeCount(b) + getRetweetCount(b) + getReplyCount(b);
          return engagementB - engagementA;
        default:
          return 0;
      }
    });

    setFilteredTweets(filtered);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const renderTweetText = (text: string) => {
    let processedText = text;
    
    // Replace URLs with clickable links
    processedText = processedText.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">$1</a>'
    );
    
    // Replace hashtags
    processedText = processedText.replace(
      /#(\w+)/g,
      '<span class="text-blue-500 font-medium">#$1</span>'
    );
    
    // Replace mentions
    processedText = processedText.replace(
      /@(\w+)/g,
      '<span class="text-blue-500 font-medium">@$1</span>'
    );
    
    return <span dangerouslySetInnerHTML={{ __html: processedText }} />;
  };

  const downloadReport = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_BASE}/api/report/${reportId}/download`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportData?.profileInfo?.username || 'user'}_tweet_archive.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: "Report is being downloaded",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download the report",
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

  if (!reportData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Report Not Found</h2>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center space-x-2">
                <img src="/extractor.png" alt="X Archive Extractor" className="w-8 h-8 rounded-lg" />
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  X Archive Extractor
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{user?.email}</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                📊 Tweet Archive for @{reportData.profileInfo?.username || 'user'}
              </h1>
              <p className="text-gray-600 mt-2">
                {reportData.profileInfo?.displayName || 'User'}
                {reportData.profileInfo?.description && (
                  <span className="block text-sm text-gray-500 mt-1">
                    {reportData.profileInfo?.description}
                  </span>
                )}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Generated on {formatDate(reportData.generatedAt)}
              </p>
            </div>
            <Button onClick={downloadReport}>
              <Download className="w-4 h-4 mr-2" />
              Download JSON
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{formatNumber(reportData.stats.totalTweets)}</div>
                <p className="text-xs text-gray-600">Total Tweets</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{formatNumber(reportData.stats.totalLikes)}</div>
                <p className="text-xs text-gray-600">Total Likes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{formatNumber(reportData.stats.totalRetweets)}</div>
                <p className="text-xs text-gray-600">Total RTs</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{formatNumber(reportData.stats.totalViews)}</div>
                <p className="text-xs text-gray-600">Total Views</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{formatNumber(reportData.stats.totalReplies)}</div>
                <p className="text-xs text-gray-600">Total Replies</p>
              </CardContent>
            </Card>
          </div>

          {/* Timeline */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">📅 Timeline Span</h3>
                <p className="text-gray-600">
                  {formatDate(reportData.timeline.startDate)} → {formatDate(reportData.timeline.endDate)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search tweets by text content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="sm:w-48">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">📅 Newest First</option>
                <option value="oldest">⏰ Oldest First</option>
                <option value="likes">❤️ Most Liked</option>
                <option value="retweets">🔄 Most Retweeted</option>
                <option value="views">👀 Most Viewed</option>
                <option value="engagement">🚀 Most Engaging</option>
              </select>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Showing {filteredTweets.length} of {reportData.tweets.length} tweets
          </div>
        </div>

        {/* Tweets */}
        <div className="space-y-4">
          {(() => { console.log('🔍 [FRONTEND] Rendering tweets, profileInfo:', reportData.profileInfo); return null; })()}
          {filteredTweets.map((tweet) => (
            <Card key={tweet.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {reportData.profileInfo?.username?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">
                        {reportData.profileInfo?.displayName || 'User'}
                      </span>
                      <span className="text-gray-500 ml-2">@{reportData.profileInfo?.username || 'user'}</span>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">{formatDate(tweet.created_at)}</span>
                </div>
                
                <div className="text-gray-900 mb-4 leading-relaxed">
                  {renderTweetText(tweet.text)}
                </div>
                
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>{formatNumber(getViewCount(tweet))}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Heart className="w-4 h-4" />
                    <span>{formatNumber(getLikeCount(tweet))}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Repeat className="w-4 h-4" />
                    <span>{formatNumber(getRetweetCount(tweet))}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="w-4 h-4" />
                    <span>{formatNumber(getReplyCount(tweet))}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTweets.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tweets found</h3>
              <p className="text-gray-600 text-center">
                Try adjusting your search or filter criteria
              </p>
            </CardContent>
          </Card>
        )}
      </div>


    </div>
  );
};

export default ReportViewer; 