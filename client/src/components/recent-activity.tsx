import { CheckCircle, Search, Brain, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface RecentActivityProps {
  activities?: any[];
}

export default function RecentActivity({ activities = [] }: RecentActivityProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "verified":
        return <CheckCircle className="w-5 h-5 text-white" />;
      case "analyzing":
        return <Brain className="w-5 h-5 text-white" />;
      case "search":
        return <Search className="w-5 h-5 text-white" />;
      default:
        return <Clock className="w-5 h-5 text-white" />;
    }
  };

  const getActivityBgColor = (type: string) => {
    switch (type) {
      case "verified":
        return "bg-green-600";
      case "analyzing":
        return "bg-purple-600";
      case "search":
        return "bg-blue-600";
      default:
        return "bg-gray-600";
    }
  };

  const getActivityTitle = (activity: any) => {
    switch (activity.type) {
      case "verified":
        return "Claim verified successfully";
      case "analyzing":
        return "Analyzing claim";
      default:
        return activity.title || "Unknown activity";
    }
  };

  return (
    <div className="mt-8">
      <Card className="shadow-lg border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
            <Button variant="link" className="text-primary p-0">
              View All
            </Button>
          </div>

          {activities.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">No recent activity</p>
              <p className="text-sm text-gray-400">Your fact-checking history will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div
                  key={activity.id || index}
                  className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getActivityBgColor(activity.type)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {getActivityTitle(activity)}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {activity.description}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-500">
                        {activity.timestamp 
                          ? formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })
                          : "Recently"
                        }
                      </p>
                      {activity.reliabilityScore && (
                        <span className="text-xs font-medium text-green-600">
                          {activity.reliabilityScore}% reliable
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
