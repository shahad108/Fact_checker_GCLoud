// Feedback Categories System
// These correspond to the backend feedback labels stored in the database

export const FEEDBACK_LABELS = {
  0: "Other",
  1: "Lack of credible sources",
  2: "Score contradicts my understanding", 
  3: "Explanation is too vague",
  4: "Analysis is biased",
  5: "Missing important context",
  6: "Sources are outdated",
  7: "Technical errors in analysis",
  8: "Language/translation issues",
  9: "Inappropriate content",
  10: "Spam or irrelevant",
  11: "Incomplete analysis",
  12: "Conflicting source information",
  13: "Poor source quality",
  14: "Analysis too complex",
  15: "Analysis too simple",
  16: "Factual errors",
  17: "Misleading conclusions",
  18: "Excellent analysis"
} as const;

export type FeedbackLabelId = keyof typeof FEEDBACK_LABELS;

// Categorize feedback labels for better UX
export const FEEDBACK_CATEGORIES = {
  QUALITY: {
    title: "Analysis Quality",
    description: "Issues with the quality of the analysis",
    labels: [3, 11, 14, 15, 16, 17] // vague, incomplete, too complex/simple, factual errors, misleading
  },
  SOURCES: {
    title: "Source Issues",
    description: "Problems with sources and references",
    labels: [1, 6, 12, 13] // lack of sources, outdated, conflicting, poor quality
  },
  ACCURACY: {
    title: "Accuracy & Bias",
    description: "Concerns about accuracy and potential bias",
    labels: [2, 4, 5] // contradicts understanding, biased, missing context
  },
  TECHNICAL: {
    title: "Technical Issues",
    description: "Technical problems or language issues",
    labels: [7, 8] // technical errors, language issues
  },
  CONTENT: {
    title: "Content Issues",
    description: "Inappropriate or irrelevant content",
    labels: [9, 10] // inappropriate, spam
  },
  POSITIVE: {
    title: "Positive Feedback",
    description: "Good analysis worth highlighting",
    labels: [18] // excellent analysis
  },
  OTHER: {
    title: "Other",
    description: "Other feedback not covered above",
    labels: [0] // other
  }
} as const;

// Helper function to get category for a label
export function getCategoryForLabel(labelId: FeedbackLabelId): keyof typeof FEEDBACK_CATEGORIES | null {
  for (const [categoryKey, category] of Object.entries(FEEDBACK_CATEGORIES)) {
    if (category.labels.includes(labelId)) {
      return categoryKey as keyof typeof FEEDBACK_CATEGORIES;
    }
  }
  return null;
}

// Helper function to get all labels in a category
export function getLabelsInCategory(categoryKey: keyof typeof FEEDBACK_CATEGORIES): Array<{
  id: FeedbackLabelId;
  label: string;
}> {
  const category = FEEDBACK_CATEGORIES[categoryKey];
  return category.labels.map(labelId => ({
    id: labelId as FeedbackLabelId,
    label: FEEDBACK_LABELS[labelId as FeedbackLabelId]
  }));
}

// Feedback rating scale definitions
export const FEEDBACK_RATING_SCALE = {
  1: {
    label: "Poor",
    description: "Completely wrong or unhelpful",
    color: "text-red-600"
  },
  2: {
    label: "Fair", 
    description: "Mostly wrong with some issues",
    color: "text-orange-600"
  },
  3: {
    label: "Good",
    description: "Partially correct with room for improvement",
    color: "text-yellow-600"
  },
  4: {
    label: "Very Good",
    description: "Mostly correct and helpful",
    color: "text-blue-600"
  },
  5: {
    label: "Excellent",
    description: "Completely accurate and very helpful",
    color: "text-green-600"
  }
} as const;

export type FeedbackRating = keyof typeof FEEDBACK_RATING_SCALE;

// Validation functions
export function isValidFeedbackRating(rating: number): rating is FeedbackRating {
  return rating >= 1 && rating <= 5 && Number.isInteger(rating);
}

export function isValidFeedbackLabel(labelId: number): labelId is FeedbackLabelId {
  return labelId in FEEDBACK_LABELS;
}

// Default feedback form state
export interface FeedbackFormData {
  rating: FeedbackRating;
  selectedLabels: FeedbackLabelId[];
  comment: string;
  otherText?: string; // For "Other" category
}

export const DEFAULT_FEEDBACK_FORM: FeedbackFormData = {
  rating: 3,
  selectedLabels: [],
  comment: "",
  otherText: ""
};

// Feedback submission payload for API
export interface FeedbackSubmissionData {
  analysisId: string;
  rating: number; // 1-5
  comment: string;
  labels: number[]; // Array of label IDs
  analysisContext: {
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
    timestamp: string;
  };
}