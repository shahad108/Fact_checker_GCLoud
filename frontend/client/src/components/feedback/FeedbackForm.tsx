import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { AlertCircle, CheckCircle, Loader2, MessageSquare, Star, Tags } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { FeedbackRating } from './FeedbackRating';
import { FeedbackCategorySelector } from './FeedbackCategorySelector';
import { 
  FeedbackFormData, 
  FeedbackSubmissionData, 
  DEFAULT_FEEDBACK_FORM,
  FeedbackLabelId,
  FeedbackRating as FeedbackRatingType,
  isValidFeedbackRating
} from './FeedbackCategories';

interface AnalysisContextData {
  analysisId: string;
  claimText: string;
  analysisText: string;
  veracityScore: number;
  confidenceScore: number;
  sources: Array<{
    id: string;
    url: string;
    title: string;
    credibilityScore: number;
  }>;
  searchQueries?: string[];
}

interface FeedbackFormProps {
  analysisContext: AnalysisContextData;
  onSubmitSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

type SubmissionState = 'idle' | 'submitting' | 'success' | 'error';

export function FeedbackForm({
  analysisContext,
  onSubmitSuccess,
  onCancel,
  className
}: FeedbackFormProps) {
  const { user, getAccessTokenSilently } = useAuth0();
  const [formData, setFormData] = useState<FeedbackFormData>(DEFAULT_FEEDBACK_FORM);
  const [submissionState, setSubmissionState] = useState<SubmissionState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Form validation
  const isFormValid = () => {
    return (
      isValidFeedbackRating(formData.rating) &&
      (formData.selectedLabels.length > 0 || formData.comment.trim().length > 0) &&
      (!formData.selectedLabels.includes(0) || formData.otherText?.trim().length! > 0)
    );
  };

  const updateFormData = (updates: Partial<FeedbackFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setErrorMessage(''); // Clear errors when user makes changes
  };

  const handleRatingChange = (rating: FeedbackRatingType) => {
    updateFormData({ rating });
  };

  const handleLabelsChange = (selectedLabels: FeedbackLabelId[]) => {
    updateFormData({ selectedLabels });
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateFormData({ comment: e.target.value });
  };

  const handleOtherTextChange = (otherText: string) => {
    updateFormData({ otherText });
  };

  const submitFeedback = async (): Promise<void> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!isFormValid()) {
      throw new Error('Please provide a rating and select at least one category or add a comment');
    }

    // Import feedback service dynamically to avoid dependency issues
    const { feedbackService } = await import('@/services/feedbackService');

    // Prepare submission data
    const submissionData: FeedbackSubmissionData = {
      analysisId: analysisContext.analysisId,
      rating: formData.rating,
      comment: formData.comment.trim(),
      labels: formData.selectedLabels,
      analysisContext: {
        claimText: analysisContext.claimText,
        analysisText: analysisContext.analysisText,
        veracityScore: analysisContext.veracityScore,
        confidenceScore: analysisContext.confidenceScore,
        sources: analysisContext.sources,
        searchQueries: analysisContext.searchQueries || [],
        timestamp: new Date().toISOString()
      }
    };

    // Submit to backend using the feedback service
    return feedbackService.submitFeedback(submissionData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      setErrorMessage('Please provide a rating and select at least one category or add a comment');
      return;
    }

    setSubmissionState('submitting');
    setErrorMessage('');

    try {
      await submitFeedback();
      setSubmissionState('success');
      
      // Call success callback after a brief delay to show success state
      setTimeout(() => {
        onSubmitSuccess?.();
      }, 1500);
      
    } catch (error: any) {
      console.error('Feedback submission error:', error);
      setSubmissionState('error');
      setErrorMessage(error.message || 'Failed to submit feedback. Please try again.');
    }
  };

  const handleReset = () => {
    setFormData(DEFAULT_FEEDBACK_FORM);
    setSubmissionState('idle');
    setErrorMessage('');
  };

  // Show success state
  if (submissionState === 'success') {
    return (
      <Card className={cn('w-full max-w-2xl mx-auto', className)}>
        <CardContent className="pt-6 sm:pt-8">
          <div className="flex flex-col items-center space-y-3 sm:space-y-4 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-green-900 mb-2">
                Thank you for your feedback!
              </h3>
              <p className="text-xs sm:text-sm text-green-700">
                Your feedback helps us improve the accuracy and quality of our fact-checking analysis.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full max-w-2xl mx-auto', className)}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5 text-blue-600" />
          <span>Share Your Feedback</span>
        </CardTitle>
        <CardDescription>
          Help us improve by rating this analysis and sharing your thoughts. Your feedback is valuable for enhancing our fact-checking accuracy.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error message */}
          {errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* Rating Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-blue-600" />
              <Label className="text-sm font-medium">
                Overall Rating *
              </Label>
            </div>
            <FeedbackRating
              rating={formData.rating}
              onRatingChange={handleRatingChange}
              disabled={submissionState === 'submitting'}
              size="md"
              showLabel={true}
              showDescription={true}
            />
          </div>

          <Separator />

          {/* Category Selection */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Tags className="h-4 w-4 text-blue-600" />
              <Label className="text-sm font-medium">
                Feedback Categories
              </Label>
            </div>
            <p className="text-xs text-gray-600">
              Select relevant categories that describe your feedback (optional if you provide a comment)
            </p>
            <FeedbackCategorySelector
              selectedLabels={formData.selectedLabels}
              onLabelsChange={handleLabelsChange}
              otherText={formData.otherText}
              onOtherTextChange={handleOtherTextChange}
              disabled={submissionState === 'submitting'}
              maxSelections={5}
            />
          </div>

          <Separator />

          {/* Comment Section */}
          <div className="space-y-3">
            <Label htmlFor="feedback-comment" className="text-sm font-medium">
              Additional Comments
            </Label>
            <p className="text-xs text-gray-600">
              Share specific details about your feedback (optional if you selected categories)
            </p>
            <Textarea
              id="feedback-comment"
              placeholder="Share your thoughts on the analysis quality, sources, accuracy, or any other feedback..."
              value={formData.comment}
              onChange={handleCommentChange}
              disabled={submissionState === 'submitting'}
              maxLength={1000}
              rows={4}
              className="resize-none"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{formData.comment.length}/1000 characters</span>
              <span>
                {formData.selectedLabels.length === 0 && formData.comment.trim().length === 0 
                  ? 'Please provide either categories or comments' 
                  : 'Optional'
                }
              </span>
            </div>
          </div>

          {/* Analysis Context Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Analysis Being Reviewed:</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>Claim:</strong> {analysisContext.claimText.substring(0, 100)}...</p>
              <p><strong>Veracity Score:</strong> {Math.round(analysisContext.veracityScore * 100)}%</p>
              <p><strong>Sources:</strong> {analysisContext.sources.length} sources analyzed</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={submissionState === 'submitting'}
              >
                Reset
              </Button>
              {onCancel && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onCancel}
                  disabled={submissionState === 'submitting'}
                >
                  Cancel
                </Button>
              )}
            </div>

            <Button
              type="submit"
              disabled={!isFormValid() || submissionState === 'submitting'}
              className="min-w-[120px]"
            >
              {submissionState === 'submitting' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                'Submit Feedback'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}