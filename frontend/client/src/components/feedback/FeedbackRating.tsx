import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FEEDBACK_RATING_SCALE, FeedbackRating, isValidFeedbackRating } from './FeedbackCategories';

interface FeedbackRatingProps {
  rating: number;
  onRatingChange: (rating: FeedbackRating) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showDescription?: boolean;
  className?: string;
}

export function FeedbackRating({
  rating,
  onRatingChange,
  disabled = false,
  size = 'md',
  showLabel = true,
  showDescription = false,
  className
}: FeedbackRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const displayRating = hoverRating || rating;
  const ratingInfo = isValidFeedbackRating(displayRating) 
    ? FEEDBACK_RATING_SCALE[displayRating] 
    : null;

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  const handleStarClick = (starRating: number) => {
    if (disabled || !isValidFeedbackRating(starRating)) return;
    onRatingChange(starRating);
  };

  const handleStarHover = (starRating: number) => {
    if (disabled) return;
    setHoverRating(starRating);
  };

  const handleMouseLeave = () => {
    if (disabled) return;
    setHoverRating(null);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Star Rating */}
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((starRating) => {
          const isFilled = starRating <= displayRating;
          const isHovering = hoverRating !== null && starRating <= hoverRating;
          
          return (
            <button
              key={starRating}
              type="button"
              onClick={() => handleStarClick(starRating)}
              onMouseEnter={() => handleStarHover(starRating)}
              onMouseLeave={handleMouseLeave}
              disabled={disabled}
              className={cn(
                'transition-all duration-150 ease-in-out',
                {
                  'cursor-pointer hover:scale-110 transform': !disabled,
                  'cursor-not-allowed opacity-50': disabled,
                  'drop-shadow-sm': isHovering
                }
              )}
              aria-label={`Rate ${starRating} star${starRating > 1 ? 's' : ''}`}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  'transition-colors duration-150',
                  {
                    // Filled states
                    'fill-yellow-400 text-yellow-400': isFilled && !isHovering,
                    'fill-yellow-500 text-yellow-500': isFilled && isHovering,
                    
                    // Empty states
                    'fill-transparent text-gray-300': !isFilled && !isHovering,
                    'fill-transparent text-gray-400': !isFilled && isHovering,
                    
                    // Disabled state
                    'text-gray-200': disabled
                  }
                )}
              />
            </button>
          );
        })}
        
        {/* Rating number */}
        <span className={cn(
          'ml-2 text-sm font-medium',
          ratingInfo?.color || 'text-gray-600',
          { 'opacity-50': disabled }
        )}>
          {displayRating}/5
        </span>
      </div>

      {/* Rating label and description */}
      {(showLabel || showDescription) && ratingInfo && (
        <div className="space-y-1">
          {showLabel && (
            <div className={cn(
              'text-sm font-medium',
              ratingInfo.color,
              { 'opacity-50': disabled }
            )}>
              {ratingInfo.label}
            </div>
          )}
          
          {showDescription && (
            <div className={cn(
              'text-xs text-gray-600',
              { 'opacity-50': disabled }
            )}>
              {ratingInfo.description}
            </div>
          )}
        </div>
      )}

      {/* Accessibility helper text */}
      <div className="sr-only">
        {ratingInfo 
          ? `Current rating: ${displayRating} out of 5 stars - ${ratingInfo.label}: ${ratingInfo.description}`
          : `Current rating: ${displayRating} out of 5 stars`
        }
      </div>
    </div>
  );
}

// Compact version for use in lists or small spaces
interface CompactFeedbackRatingProps {
  rating: number;
  onRatingChange?: (rating: FeedbackRating) => void;
  readonly?: boolean;
  className?: string;
}

export function CompactFeedbackRating({
  rating,
  onRatingChange,
  readonly = false,
  className
}: CompactFeedbackRatingProps) {
  return (
    <div className={cn('flex items-center space-x-1', className)}>
      {[1, 2, 3, 4, 5].map((starRating) => {
        const isFilled = starRating <= rating;
        
        return (
          <button
            key={starRating}
            type="button"
            onClick={() => !readonly && onRatingChange?.(starRating as FeedbackRating)}
            disabled={readonly}
            className={cn(
              'transition-colors duration-150',
              {
                'cursor-pointer hover:scale-105 transform': !readonly,
                'cursor-default': readonly
              }
            )}
            aria-label={readonly ? undefined : `Rate ${starRating} stars`}
          >
            <Star
              className={cn(
                'h-4 w-4',
                {
                  'fill-yellow-400 text-yellow-400': isFilled,
                  'fill-transparent text-gray-300': !isFilled
                }
              )}
            />
          </button>
        );
      })}
      <span className="ml-1 text-xs text-gray-600">
        {rating}/5
      </span>
    </div>
  );
}

// Rating display component (read-only)
interface RatingDisplayProps {
  rating: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function RatingDisplay({
  rating,
  showLabel = false,
  size = 'sm',
  className
}: RatingDisplayProps) {
  const ratingInfo = isValidFeedbackRating(rating) 
    ? FEEDBACK_RATING_SCALE[rating] 
    : null;

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  return (
    <div className={cn('flex items-center space-x-1', className)}>
      {[1, 2, 3, 4, 5].map((starRating) => (
        <Star
          key={starRating}
          className={cn(
            sizeClasses[size],
            {
              'fill-yellow-400 text-yellow-400': starRating <= rating,
              'fill-transparent text-gray-300': starRating > rating
            }
          )}
        />
      ))}
      
      <span className="text-sm text-gray-600">
        {rating}/5
      </span>
      
      {showLabel && ratingInfo && (
        <span className={cn('text-sm font-medium', ratingInfo.color)}>
          {ratingInfo.label}
        </span>
      )}
    </div>
  );
}