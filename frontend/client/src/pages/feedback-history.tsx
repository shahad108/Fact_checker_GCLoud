import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth0 } from '@auth0/auth0-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Calendar, MessageSquare, Star, Tag, Clock, ExternalLink } from 'lucide-react';
import { useLocation } from 'wouter';
import { feedbackService, FeedbackResponse } from '@/services/feedbackService';
import { RatingDisplay } from '@/components/feedback/FeedbackRating';
import { FEEDBACK_LABELS } from '@/components/feedback/FeedbackCategories';

interface FeedbackHistoryPageProps {}

export default function FeedbackHistoryPage({}: FeedbackHistoryPageProps) {
  const { user, isAuthenticated } = useAuth0();
  const [, setLocation] = useLocation();
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackResponse | null>(null);

  // Fetch user's feedback history
  const {
    data: feedbackHistory,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['user-feedback-history'],
    queryFn: () => feedbackService.getUserFeedback(50, 0),
    enabled: !!isAuthenticated && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });

  const handleBackToApp = () => {
    setLocation('/');
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

  const renderFeedbackCard = (feedback: FeedbackResponse) => {
    const labels = feedback.labels || [];
    
    return (
      <Card 
        key={feedback.id} 
        className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500"
        onClick={() => setSelectedFeedback(selectedFeedback?.id === feedback.id ? null : feedback)}
      >
        <CardHeader className="pb-2 sm:pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
              <CardTitle className="text-xs sm:text-sm font-medium">
                Analysis Feedback
              </CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <RatingDisplay rating={feedback.rating} size="sm" />
              <Badge variant="outline" className="text-xs">
                {formatDate(feedback.created_at)}
              </Badge>
            </div>
          </div>
          <CardDescription className="text-xs text-gray-600">
            Feedback ID: {feedback.id.substring(0, 8)}...
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Labels */}
          {labels.length > 0 && (
            <div className="mb-2 sm:mb-3">
              <div className="flex items-center space-x-1 mb-1 sm:mb-2">
                <Tag className="h-3 w-3 text-gray-500" />
                <span className="text-xs font-medium text-gray-700">Categories:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {labels.slice(0, 2).map((labelId) => (
                  <Badge 
                    key={labelId} 
                    variant="secondary" 
                    className="text-xs bg-blue-100 text-blue-800"
                  >
                    {FEEDBACK_LABELS[labelId as keyof typeof FEEDBACK_LABELS]}
                  </Badge>
                ))}
                {labels.length > 2 && (
                  <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                    +{labels.length - 2} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Comment Preview */}
          {feedback.comment && (
            <div className="mb-3">
              <p className="text-sm text-gray-700 line-clamp-2">
                {feedback.comment}
              </p>
            </div>
          )}

          {/* Expanded Details */}
          {selectedFeedback?.id === feedback.id && (
            <>
              <Separator className="my-3" />
              <div className="space-y-3">
                {/* Full Comment */}
                {feedback.comment && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Your Comment:</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                      {feedback.comment}
                    </p>
                  </div>
                )}

                {/* All Labels */}
                {labels.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">All Categories:</h4>
                    <div className="flex flex-wrap gap-2">
                      {labels.map((labelId) => (
                        <Badge 
                          key={labelId} 
                          variant="outline" 
                          className="text-xs"
                        >
                          {FEEDBACK_LABELS[labelId as keyof typeof FEEDBACK_LABELS]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Feedback Metadata */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                    <Clock className="h-3 w-3" />
                    <span>Created: {formatDate(feedback.created_at)}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                    <ExternalLink className="h-3 w-3" />
                    <span>Analysis: {feedback.analysis_id.substring(0, 8)}...</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96">
          <CardContent className="pt-8">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Sign In Required</h3>
              <p className="text-sm text-gray-600 mb-4">
                You need to be signed in to view your feedback history.
              </p>
              <Button onClick={() => setLocation('/login')}>
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToApp}
                className="hover:bg-gray-100 self-start"
              >
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="text-sm">Back to App</span>
              </Button>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Feedback History</h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  Your feedback submissions for {(user?.displayName || user?.email || '').length > 20 
                    ? (user?.displayName || user?.email || '').substring(0, 20) + '...' 
                    : (user?.displayName || user?.email)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load your feedback history. Please try again.
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetch()}
                className="ml-2"
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Empty State */}
        {feedbackHistory && feedbackHistory.items.length === 0 && (
          <Card>
            <CardContent className="pt-8">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Feedback Yet
                </h3>
                <p className="text-gray-600 mb-4">
                  You haven't submitted any feedback on fact-checking analyses yet.
                  Start using the app to provide valuable feedback!
                </p>
                <Button onClick={handleBackToApp}>
                  Start Fact-Checking
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Feedback List */}
        {feedbackHistory && feedbackHistory.items.length > 0 && (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <Card>
                <CardContent className="pt-4 sm:pt-6">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-blue-600">
                      {feedbackHistory.total}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600">Total Feedback</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 sm:pt-6">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-green-600">
                      {Math.round(
                        feedbackHistory.items.reduce((sum, item) => sum + item.rating, 0) / 
                        feedbackHistory.items.length * 10
                      ) / 10}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600">Avg. Rating</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 sm:pt-6">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-purple-600">
                      {feedbackHistory.items.filter(item => item.comment).length}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600">With Comments</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Feedback Cards */}
            <div className="space-y-4">
              {feedbackHistory.items.map(renderFeedbackCard)}
            </div>

            {/* Load More Button */}
            {feedbackHistory.total > feedbackHistory.items.length && (
              <div className="text-center pt-4">
                <Button variant="outline">
                  Load More Feedback
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}