import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Shield } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLoading, isAuthenticated, user } = useAuth0();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Redirect to login if not authenticated and not loading
    if (!isLoading && !isAuthenticated) {
      setLocation('/login');
    }
  }, [isLoading, isAuthenticated, setLocation]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96">
          <CardContent className="pt-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Shield className="h-12 w-12 text-blue-600" />
                <Loader2 className="h-6 w-6 animate-spin absolute -top-1 -right-1 text-blue-400" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-1">Verifying access</h3>
                <p className="text-sm text-gray-600">Please wait while we check your authentication...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Redirect to login if not authenticated (backup check)
  if (!isAuthenticated) {
    setLocation('/login');
    return null;
  }

  // Show children if authenticated
  return <>{children}</>;
}