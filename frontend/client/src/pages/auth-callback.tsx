import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function AuthCallback() {
  const { isLoading, isAuthenticated, error, user } = useAuth0();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user) {
        // Successful authentication - redirect to main app
        setLocation('/');
      } else if (error) {
        // Authentication failed - redirect back to login
        setTimeout(() => setLocation('/login'), 3000);
      }
    }
  }, [isLoading, isAuthenticated, error, user, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-96">
          <CardContent className="pt-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-1">Completing sign in</h3>
                <p className="text-sm text-gray-600">Please wait while we finalize your authentication...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
        <Card className="w-96">
          <CardContent className="pt-8">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-red-900 mb-2">Authentication Failed</h3>
                <p className="text-sm text-red-700 mb-4">{error.message}</p>
                <p className="text-xs text-red-600">Redirecting to login page in a few seconds...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <Card className="w-96">
          <CardContent className="pt-8">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900 mb-1">Welcome back!</h3>
                <p className="text-sm text-green-700 mb-2">
                  Successfully signed in as {user.name || user.email}
                </p>
                <p className="text-xs text-green-600">Redirecting to app...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fallback - redirect to login
  setLocation('/login');
  return null;
}