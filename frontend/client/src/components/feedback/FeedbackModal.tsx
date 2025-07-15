import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { X, MessageSquare, Lock, LogIn } from 'lucide-react';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FeedbackForm } from './FeedbackForm';

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

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisContext: AnalysisContextData;
  onSubmitSuccess?: () => void;
  className?: string;
}

export function FeedbackModal({
  isOpen,
  onClose,
  analysisContext,
  onSubmitSuccess,
  className
}: FeedbackModalProps) {
  const { isAuthenticated, user, isLoading } = useAuth0();
  const [, setLocation] = useLocation();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Check authentication when modal opens
  useEffect(() => {
    if (isOpen && !isLoading) {
      setShowLoginPrompt(!isAuthenticated);
    }
  }, [isOpen, isAuthenticated, isLoading]);

  const handleLogin = () => {
    setLocation('/login');
  };

  const handleSubmitSuccess = () => {
    onSubmitSuccess?.();
    onClose();
  };

  const handleClose = () => {
    setShowLoginPrompt(false);
    onClose();
  };

  // Loading state
  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="w-[95vw] sm:max-w-md mx-4">
          <div className="flex items-center justify-center p-6 sm:p-8">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Login prompt for unauthenticated users
  if (showLoginPrompt) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="w-[95vw] sm:max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-base sm:text-lg">
              <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              <span>Sign In Required</span>
            </DialogTitle>
            <DialogDescription className="text-sm">
              You need to be signed in to submit feedback. This helps us maintain quality and prevent spam.
            </DialogDescription>
          </DialogHeader>

          <Card className="border-0 shadow-none">
            <CardContent className="pt-0">
              <div className="space-y-3 sm:space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Why sign in?</h4>
                  <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
                    <li>• Help us improve fact-checking quality</li>
                    <li>• Track your feedback contributions</li>
                    <li>• Prevent spam and ensure authenticity</li>
                    <li>• Access your feedback history</li>
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button variant="outline" onClick={handleClose}>
                    Maybe Later
                  </Button>
                  <Button onClick={handleLogin} className="flex items-center space-x-2">
                    <LogIn className="h-4 w-4" />
                    <span>Sign In to Continue</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    );
  }

  // Main feedback modal for authenticated users
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={cn('w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto mx-4', className)}>
        <DialogHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 pb-4">
          <div className="space-y-1">
            <DialogTitle className="flex items-center space-x-2 text-base sm:text-lg">
              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              <span>Submit Feedback</span>
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Signed in as <strong>{user?.displayName || user?.email}</strong>
            </DialogDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>

        <div className="space-y-4">
          <FeedbackForm
            analysisContext={analysisContext}
            onSubmitSuccess={handleSubmitSuccess}
            onCancel={handleClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Trigger button component for opening feedback modal
interface FeedbackTriggerProps {
  analysisContext: AnalysisContextData;
  onFeedbackSubmitted?: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  showIcon?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function FeedbackTrigger({
  analysisContext,
  onFeedbackSubmitted,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  showIcon = true,
  className,
  children
}: FeedbackTriggerProps) {
  const { isAuthenticated } = useAuth0();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmitSuccess = () => {
    onFeedbackSubmitted?.();
    setIsModalOpen(false);
  };

  const buttonSizes = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4',
    lg: 'h-12 px-6 text-lg'
  };

  return (
    <>
      <Button
        onClick={handleOpenModal}
        variant={variant}
        className={cn(
          buttonSizes[size],
          {
            'w-full': fullWidth
          },
          className
        )}
      >
        {showIcon && <MessageSquare className="h-4 w-4 mr-2" />}
        {children || 'Submit Feedback'}
      </Button>

      <FeedbackModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        analysisContext={analysisContext}
        onSubmitSuccess={handleSubmitSuccess}
      />
    </>
  );
}

// Compact feedback trigger for smaller spaces
export function CompactFeedbackTrigger({
  analysisContext,
  onFeedbackSubmitted,
  className
}: Pick<FeedbackTriggerProps, 'analysisContext' | 'onFeedbackSubmitted' | 'className'>) {
  return (
    <FeedbackTrigger
      analysisContext={analysisContext}
      onFeedbackSubmitted={onFeedbackSubmitted}
      variant="outline"
      size="sm"
      showIcon={false}
      className={className}
    >
      Feedback
    </FeedbackTrigger>
  );
}

// Prominent feedback call-to-action (replaces user guidelines)
interface FeedbackCallToActionProps {
  analysisContext: AnalysisContextData;
  onFeedbackSubmitted?: () => void;
  className?: string;
}

export function FeedbackCallToAction({
  analysisContext,
  onFeedbackSubmitted,
  className
}: FeedbackCallToActionProps) {
  const { isAuthenticated } = useAuth0();

  return (
    <Card className={cn('border-dashed border-2 border-blue-200 bg-blue-50/50', className)}>
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-lg text-blue-900">
          Help Us Improve
        </CardTitle>
        <CardDescription className="text-blue-700">
          Your feedback helps us enhance the accuracy and quality of our fact-checking analysis.
          Share your thoughts on this analysis.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center space-x-4 text-sm text-blue-800">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span>Rate analysis quality</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span>Report issues</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span>Share insights</span>
            </div>
          </div>

          <FeedbackTrigger
            analysisContext={analysisContext}
            onFeedbackSubmitted={onFeedbackSubmitted}
            variant="default"
            size="lg"
            fullWidth={true}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
          >
            Submit Your Feedback
          </FeedbackTrigger>

          {!isAuthenticated && (
            <p className="text-xs text-blue-600 text-center">
              Sign in required • Quick Google or email login
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}