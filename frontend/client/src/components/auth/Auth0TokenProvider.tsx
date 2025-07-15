import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import { setAuth0TokenGetter } from '@/lib/queryClient';

interface Auth0TokenProviderProps {
  children: React.ReactNode;
}

export function Auth0TokenProvider({ children }: Auth0TokenProviderProps) {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

  useEffect(() => {
    // Set up the token getter function for the query client
    const tokenGetter = async (): Promise<string | undefined> => {
      if (!isAuthenticated) {
        console.log('🔐 Auth0TokenProvider: User not authenticated');
        return undefined;
      }
      
      try {
        const audience = import.meta.env.VITE_AUTH0_AUDIENCE;
        const scope = import.meta.env.VITE_AUTH0_SCOPE || "openid profile email";
        
        console.log('🔐 Auth0TokenProvider: Requesting token with:', {
          audience,
          scope,
          isAuthenticated
        });
        
        const token = await getAccessTokenSilently({
          authorizationParams: {
            audience,
            scope
          }
        });
        
        console.log('🔐 Auth0TokenProvider: Token retrieved successfully', {
          tokenLength: token?.length,
          tokenPreview: token?.substring(0, 20) + '...'
        });
        
        return token;
      } catch (error) {
        console.error('🔐 Auth0TokenProvider: Error getting Auth0 token:', error);
        return undefined;
      }
    };

    setAuth0TokenGetter(tokenGetter);
  }, [getAccessTokenSilently, isAuthenticated]);

  return <>{children}</>;
}