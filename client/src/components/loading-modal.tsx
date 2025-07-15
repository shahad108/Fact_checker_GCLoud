import { Brain } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface LoadingModalProps {
  isOpen: boolean;
}

export default function LoadingModal({ isOpen }: LoadingModalProps) {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md">
        <div className="text-center p-4">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Analyzing Claim</h3>
          <p className="text-sm text-gray-600 mb-4">
            Our AI is processing your claim and cross-referencing multiple sources...
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: "70%" }} />
          </div>
          <p className="text-xs text-gray-500 mt-2">Estimated time: 15-30 seconds</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
