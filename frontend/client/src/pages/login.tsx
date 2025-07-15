import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { LogIn, Shield, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { 
    isAuthenticated, 
    isLoading, 
    user,
    loginWithRedirect,
    error
  } = useAuth0();
  
  const [, setLocation] = useLocation();

  // Redirect authenticated users to main app
  useEffect(() => {
    if (isAuthenticated && user) {
      setLocation('/');
    }
  }, [isAuthenticated, user, setLocation]);

  const handleLogin = () => {
    loginWithRedirect();
  };

  const handleGoogleLogin = () => {
    loginWithRedirect({
      authorizationParams: {
        connection: 'google-oauth2'
      }
    });
  };

  if (isLoading || (isAuthenticated && user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-96">
          <CardContent className="pt-8">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm text-gray-600">
                {isAuthenticated ? 'Redirecting to app...' : 'Loading...'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">
              Welcome to Wahrify
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-gray-600">
              Sign in to start fact-checking
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 sm:space-y-6">
          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">{error.message}</p>
            </div>
          )}

          {/* Google Login Button */}
          <Button 
            onClick={handleGoogleLogin} 
            disabled={isLoading}
            variant="outline" 
            className="w-full h-10 sm:h-12 text-sm sm:text-base text-gray-700 border-gray-300 hover:bg-gray-50"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or</span>
            </div>
          </div>

          {/* Auth0 Login Button */}
          <Button 
            onClick={handleLogin} 
            disabled={isLoading}
            className="w-full h-10 sm:h-12 text-sm sm:text-base bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <LogIn className="h-4 w-4 mr-2" />
            )}
            Sign In with Email
          </Button>

          <div className="text-center text-xs text-gray-500">
            <p>Secure authentication powered by Auth0</p>
            <p className="mt-1">Support for email, password reset, and more</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}