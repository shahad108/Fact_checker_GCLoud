import { FeedbackSubmissionData } from '@/components/feedback/FeedbackCategories';
import { apiRequest } from '@/lib/queryClient';

// Types for API responses
export interface FeedbackResponse {
  id: string;
  analysis_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  labels: number[] | null;
  created_at: string;
  updated_at: string;
}

export interface FeedbackListResponse {
  items: FeedbackResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiError {
  detail: string;
  status?: number;
}

/**
 * Feedback Service for handling all feedback-related API operations
 */
export class FeedbackService {
  /**
   * Make authenticated API request using the centralized apiRequest method
   */
  private async makeRequest<T>(
    method: string,
    endpoint: string, 
    data?: unknown
  ): Promise<T> {
    try {
      const response = await apiRequest(method, endpoint, data);
      return response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Submit new feedback for an analysis
   */
  async submitFeedback(feedbackData: FeedbackSubmissionData): Promise<FeedbackResponse> {
    // Prepare the payload according to backend schema
    const payload = {
      analysis_id: feedbackData.analysisId,
      rating: feedbackData.rating,
      comment: feedbackData.comment || null,
      labels: feedbackData.labels.length > 0 ? feedbackData.labels : null,
    };

    console.log('📤 Submitting feedback:', {
      analysisId: payload.analysis_id,
      rating: payload.rating,
      commentLength: payload.comment?.length || 0,
      labelsCount: payload.labels?.length || 0
    });

    const response = await this.makeRequest<FeedbackResponse>('POST', '/v1/feedback/', payload);

    console.log('✅ Feedback submitted successfully:', response.id);
    return response;
  }

  /**
   * Get feedback for a specific analysis
   */
  async getAnalysisFeedback(
    analysisId: string, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<FeedbackListResponse> {
    const endpoint = `/v1/feedback/analysis/${analysisId}?limit=${limit}&offset=${offset}`;
    
    console.log('📥 Fetching analysis feedback:', { analysisId, limit, offset });
    
    const response = await this.makeRequest<FeedbackListResponse>('GET', endpoint);
    
    console.log('✅ Analysis feedback fetched:', {
      analysisId,
      total: response.total,
      returned: response.items.length
    });
    
    return response;
  }

  /**
   * Get feedback history for the current user
   */
  async getUserFeedback(
    limit: number = 50, 
    offset: number = 0
  ): Promise<FeedbackListResponse> {
    const endpoint = `/v1/feedback/user?limit=${limit}&offset=${offset}`;
    
    console.log('📥 Fetching user feedback history:', { limit, offset });
    
    const response = await this.makeRequest<FeedbackListResponse>('GET', endpoint);
    
    console.log('✅ User feedback fetched:', {
      total: response.total,
      returned: response.items.length
    });
    
    return response;
  }

  /**
   * Check if user has already submitted feedback for an analysis
   */
  async hasUserSubmittedFeedback(analysisId: string): Promise<boolean> {
    try {
      const userFeedback = await this.getUserFeedback(100, 0); // Get recent feedback
      return userFeedback.items.some(feedback => feedback.analysis_id === analysisId);
    } catch (error) {
      console.warn('Could not check existing feedback:', error);
      return false; // Allow submission if check fails
    }
  }

  /**
   * Get aggregated feedback statistics for an analysis
   */
  async getAnalysisFeedbackStats(analysisId: string): Promise<{
    averageRating: number;
    totalFeedback: number;
    ratingDistribution: Record<number, number>;
    commonLabels: Array<{ labelId: number; count: number }>;
  }> {
    try {
      const feedback = await this.getAnalysisFeedback(analysisId, 1000, 0);
      
      if (feedback.items.length === 0) {
        return {
          averageRating: 0,
          totalFeedback: 0,
          ratingDistribution: {},
          commonLabels: []
        };
      }

      // Calculate average rating
      const totalRating = feedback.items.reduce((sum, item) => sum + item.rating, 0);
      const averageRating = totalRating / feedback.items.length;

      // Calculate rating distribution
      const ratingDistribution: Record<number, number> = {};
      feedback.items.forEach(item => {
        ratingDistribution[item.rating] = (ratingDistribution[item.rating] || 0) + 1;
      });

      // Calculate common labels
      const labelCounts: Record<number, number> = {};
      feedback.items.forEach(item => {
        if (item.labels) {
          item.labels.forEach(labelId => {
            labelCounts[labelId] = (labelCounts[labelId] || 0) + 1;
          });
        }
      });

      const commonLabels = Object.entries(labelCounts)
        .map(([labelId, count]) => ({ labelId: parseInt(labelId), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Top 5 most common labels

      return {
        averageRating: Math.round(averageRating * 10) / 10,
        totalFeedback: feedback.total,
        ratingDistribution,
        commonLabels
      };
    } catch (error) {
      console.error('Failed to get feedback stats:', error);
      return {
        averageRating: 0,
        totalFeedback: 0,
        ratingDistribution: {},
        commonLabels: []
      };
    }
  }
}

// Singleton instance
export const feedbackService = new FeedbackService();

// React Query key factories for caching
export const feedbackKeys = {
  all: ['feedback'] as const,
  analysis: (analysisId: string) => [...feedbackKeys.all, 'analysis', analysisId] as const,
  user: () => [...feedbackKeys.all, 'user'] as const,
  stats: (analysisId: string) => [...feedbackKeys.all, 'stats', analysisId] as const,
};

// Helper function for React Query mutations
export const createFeedbackMutation = () => ({
  mutationFn: feedbackService.submitFeedback.bind(feedbackService),
  onSuccess: (data: FeedbackResponse, variables: FeedbackSubmissionData) => {
    console.log('🎉 Feedback submitted successfully:', {
      feedbackId: data.id,
      analysisId: variables.analysisId,
      rating: data.rating
    });
  },
  onError: (error: Error, variables: FeedbackSubmissionData) => {
    console.error('❌ Feedback submission failed:', {
      error: error.message,
      analysisId: variables.analysisId
    });
  }
});

// Helper function for React Query hooks
export const useFeedbackQuery = (analysisId: string) => ({
  queryKey: feedbackKeys.analysis(analysisId),
  queryFn: () => feedbackService.getAnalysisFeedback(analysisId),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});

export const useUserFeedbackQuery = () => ({
  queryKey: feedbackKeys.user(),
  queryFn: () => feedbackService.getUserFeedback(),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});