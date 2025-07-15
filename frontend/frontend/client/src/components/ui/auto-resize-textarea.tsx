import { forwardRef, useEffect, useRef, useImperativeHandle } from 'react';
import { cn } from "@/lib/utils";

interface AutoResizeTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  minLines?: number;
  maxLines?: number;
  onHeightChange?: (height: number) => void;
}

const AutoResizeTextarea = forwardRef<HTMLTextAreaElement, AutoResizeTextareaProps>(
  ({ className, minLines = 1, maxLines = 8, onHeightChange, ...props }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    
    // Expose the textarea ref to parent components
    useImperativeHandle(ref, () => textareaRef.current!, []);

    const adjustHeight = () => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      // Use requestAnimationFrame for proper timing
      requestAnimationFrame(() => {
        // Reset height to auto to get accurate scrollHeight
        textarea.style.height = 'auto';
        
        // Get computed styles
        const computedStyle = window.getComputedStyle(textarea);
        const fontSize = parseFloat(computedStyle.fontSize) || 16;
        const lineHeight = fontSize * 1.5; // 1.5 line height ratio
        
        // Calculate padding and borders
        const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
        const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
        const borderTop = parseFloat(computedStyle.borderTopWidth) || 0;
        const borderBottom = parseFloat(computedStyle.borderBottomWidth) || 0;
        const extraHeight = paddingTop + paddingBottom + borderTop + borderBottom;
        
        // Calculate min and max heights
        const minHeight = (minLines * lineHeight) + extraHeight;
        const maxHeight = (maxLines * lineHeight) + extraHeight;
        
        // Get content height
        const scrollHeight = textarea.scrollHeight;
        
        let newHeight: number;
        
        if (scrollHeight <= maxHeight) {
          // Content fits within max lines - auto resize
          newHeight = Math.max(minHeight, scrollHeight);
          textarea.style.overflowY = 'hidden';
        } else {
          // Content exceeds max lines - enable scroll
          newHeight = maxHeight;
          textarea.style.overflowY = 'auto';
        }
        
        // Apply the new height
        textarea.style.height = newHeight + 'px';
        
        // Notify parent of height change
        if (onHeightChange) {
          onHeightChange(newHeight);
        }
      });
    };

    // Auto-resize when value changes
    useEffect(() => {
      adjustHeight();
    }, [props.value, minLines, maxLines]);

    // Initial setup
    useEffect(() => {
      adjustHeight();
    }, []);

    return (
      <textarea
        ref={textareaRef}
        className={cn(
          // Base styles - no conflicting heights or padding
          "w-full border border-gray-300 bg-gray-100 text-base",
          // Typography and behavior
          "font-sans leading-relaxed",
          // Interactive states
          "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Remove default resize handle
          "resize-none",
          // Custom padding and spacing
          "py-3 px-4",
          className
        )}
        style={{
          // Word wrapping properties
          wordWrap: 'break-word',
          whiteSpace: 'pre-wrap',
          overflowWrap: 'break-word',
          // Typography
          lineHeight: '1.5',
          // Smooth transitions
          transition: 'height 0.1s ease-out',
          // No conflicting heights
          minHeight: 'auto',
          maxHeight: 'auto',
        }}
        {...props}
      />
    );
  }
);

AutoResizeTextarea.displayName = "AutoResizeTextarea";

export { AutoResizeTextarea };