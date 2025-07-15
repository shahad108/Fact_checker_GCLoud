import React, { useState } from 'react';
import { Check, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  FEEDBACK_CATEGORIES, 
  FEEDBACK_LABELS, 
  FeedbackLabelId, 
  getLabelsInCategory 
} from './FeedbackCategories';

interface FeedbackCategorySelectorProps {
  selectedLabels: FeedbackLabelId[];
  onLabelsChange: (labels: FeedbackLabelId[]) => void;
  otherText?: string;
  onOtherTextChange?: (text: string) => void;
  disabled?: boolean;
  maxSelections?: number;
  className?: string;
}

export function FeedbackCategorySelector({
  selectedLabels,
  onLabelsChange,
  otherText = '',
  onOtherTextChange,
  disabled = false,
  maxSelections = 5,
  className
}: FeedbackCategorySelectorProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['QUALITY']));
  const [showOtherInput, setShowOtherInput] = useState(selectedLabels.includes(0));

  const toggleCategory = (categoryKey: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryKey)) {
      newExpanded.delete(categoryKey);
    } else {
      newExpanded.add(categoryKey);
    }
    setExpandedCategories(newExpanded);
  };

  const handleLabelToggle = (labelId: FeedbackLabelId) => {
    if (disabled) return;

    const isSelected = selectedLabels.includes(labelId);
    let newLabels: FeedbackLabelId[];

    if (isSelected) {
      // Remove the label
      newLabels = selectedLabels.filter(id => id !== labelId);
      
      // If removing "Other", hide the text input
      if (labelId === 0) {
        setShowOtherInput(false);
        onOtherTextChange?.('');
      }
    } else {
      // Add the label (if under max limit)
      if (selectedLabels.length >= maxSelections) {
        return; // Don't add if at max limit
      }
      
      newLabels = [...selectedLabels, labelId];
      
      // If adding "Other", show the text input
      if (labelId === 0) {
        setShowOtherInput(true);
      }
    }

    onLabelsChange(newLabels);
  };

  const getSelectionCount = () => selectedLabels.length;
  const isAtMaxSelections = () => getSelectionCount() >= maxSelections;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with selection count */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-gray-900">
          Select relevant categories ({getSelectionCount()}/{maxSelections})
        </Label>
        {getSelectionCount() > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onLabelsChange([]);
              setShowOtherInput(false);
              onOtherTextChange?.('');
            }}
            disabled={disabled}
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Max selections warning */}
      {isAtMaxSelections() && (
        <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-2">
          Maximum number of categories selected. Unselect some to choose different ones.
        </div>
      )}

      {/* Category sections */}
      <div className="space-y-3">
        {Object.entries(FEEDBACK_CATEGORIES).map(([categoryKey, category]) => {
          const isExpanded = expandedCategories.has(categoryKey);
          const labelsInCategory = getLabelsInCategory(categoryKey as keyof typeof FEEDBACK_CATEGORIES);
          const selectedInCategory = labelsInCategory.filter(label => selectedLabels.includes(label.id));
          
          return (
            <Collapsible
              key={categoryKey}
              open={isExpanded}
              onOpenChange={() => toggleCategory(categoryKey)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full justify-between p-3 h-auto border rounded-lg',
                    {
                      'bg-blue-50 border-blue-200': selectedInCategory.length > 0,
                      'border-gray-200 hover:bg-gray-50': selectedInCategory.length === 0
                    }
                  )}
                  disabled={disabled}
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-left">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">{category.title}</span>
                        {selectedInCategory.length > 0 && (
                          <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                            {selectedInCategory.length}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{category.description}</p>
                    </div>
                  </div>
                  
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent className="mt-2">
                <div className="pl-4 space-y-2">
                  {labelsInCategory.map(({ id, label }) => {
                    const isSelected = selectedLabels.includes(id);
                    const canSelect = !isAtMaxSelections() || isSelected;

                    return (
                      <div key={id} className="flex items-start space-x-3">
                        <Checkbox
                          id={`label-${id}`}
                          checked={isSelected}
                          onCheckedChange={() => handleLabelToggle(id)}
                          disabled={disabled || !canSelect}
                          className="mt-0.5"
                        />
                        <Label
                          htmlFor={`label-${id}`}
                          className={cn(
                            'text-sm leading-5 cursor-pointer flex-1',
                            {
                              'text-gray-900': canSelect,
                              'text-gray-400': !canSelect,
                              'font-medium text-blue-700': isSelected
                            }
                          )}
                        >
                          {label}
                        </Label>
                        {isSelected && (
                          <Check className="h-4 w-4 text-blue-600 mt-0.5" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>

      {/* Other text input */}
      {showOtherInput && (
        <div className="space-y-2">
          <Label htmlFor="other-feedback" className="text-sm font-medium">
            Please specify your other feedback:
          </Label>
          <Input
            id="other-feedback"
            type="text"
            placeholder="Describe your specific feedback..."
            value={otherText}
            onChange={(e) => onOtherTextChange?.(e.target.value)}
            disabled={disabled}
            maxLength={100}
            className="w-full"
          />
          <p className="text-xs text-gray-500">
            {otherText.length}/100 characters
          </p>
        </div>
      )}

      {/* Selected labels summary */}
      {getSelectionCount() > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Selected categories:</h4>
          <div className="flex flex-wrap gap-1">
            {selectedLabels.map(labelId => (
              <span
                key={labelId}
                className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-md"
              >
                {FEEDBACK_LABELS[labelId]}
                <button
                  type="button"
                  onClick={() => handleLabelToggle(labelId)}
                  disabled={disabled}
                  className="ml-1 hover:text-blue-600"
                  aria-label={`Remove ${FEEDBACK_LABELS[labelId]}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Simplified category selector for compact use
interface CompactCategorySelectorProps {
  selectedLabels: FeedbackLabelId[];
  onLabelsChange: (labels: FeedbackLabelId[]) => void;
  maxSelections?: number;
  disabled?: boolean;
}

export function CompactCategorySelector({
  selectedLabels,
  onLabelsChange,
  maxSelections = 3,
  disabled = false
}: CompactCategorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const commonLabels: FeedbackLabelId[] = [1, 2, 3, 4, 5, 11, 18]; // Most commonly used

  const handleLabelToggle = (labelId: FeedbackLabelId) => {
    if (disabled) return;

    const isSelected = selectedLabels.includes(labelId);
    let newLabels: FeedbackLabelId[];

    if (isSelected) {
      newLabels = selectedLabels.filter(id => id !== labelId);
    } else {
      if (selectedLabels.length >= maxSelections) return;
      newLabels = [...selectedLabels, labelId];
    }

    onLabelsChange(newLabels);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {commonLabels.map(labelId => {
          const isSelected = selectedLabels.includes(labelId);
          const canSelect = selectedLabels.length < maxSelections || isSelected;

          return (
            <button
              key={labelId}
              type="button"
              onClick={() => handleLabelToggle(labelId)}
              disabled={disabled || !canSelect}
              className={cn(
                'px-3 py-1 text-xs rounded-full border transition-colors',
                {
                  'bg-blue-100 border-blue-300 text-blue-800': isSelected,
                  'bg-white border-gray-300 text-gray-700 hover:bg-gray-50': !isSelected && canSelect,
                  'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed': !canSelect
                }
              )}
            >
              {FEEDBACK_LABELS[labelId]}
            </button>
          );
        })}
      </div>

      {selectedLabels.length > 0 && (
        <p className="text-xs text-gray-600">
          {selectedLabels.length}/{maxSelections} categories selected
        </p>
      )}
    </div>
  );
}