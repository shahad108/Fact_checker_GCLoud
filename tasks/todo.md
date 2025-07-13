# 401 Unauthorized Error Analysis - Todo List

## Problem Analysis
The backend is returning 401 Unauthorized errors because most endpoints require Auth0 authentication via the `get_current_user` dependency, but requests from Cloud Run or testing environments may not have proper Auth0 tokens.

## Key Findings

### Authentication Architecture
1. **Auth0 Integration**: Backend uses Auth0 for authentication via `Auth0Middleware` class
2. **Dependency Injection**: Most endpoints use `current_user: User = Depends(get_current_user)` 
3. **Token Verification**: Auth0Middleware validates JWT tokens against Auth0's JWKS endpoint
4. **Mixed Authentication**: Some endpoints require auth, others don't

### Endpoints Requiring Authentication
- Most `/claims/*` endpoints (except `/claims/analyze-test`, `/claims/wordcloud/generate`, `/claims/clustering/generate`, `/claims/length/total`, `/claims/batch/results`)
- `/users/*` endpoints  
- `/conversations/*` endpoints
- `/messages/*` endpoints (except `/messages/stream`)
- `/feedback/*` endpoints
- `/analysis/*` endpoints (except some)
- `/search/*` endpoints

### Endpoints NOT Requiring Authentication
- `/health` and `/health/ml`
- `/claims/analyze-test` (explicitly marked as no auth for testing)
- `/claims/wordcloud/generate`
- `/claims/clustering/generate` 
- `/claims/length/total`
- `/claims/batch/results`
- `/domains/*` endpoints
- Some analysis and message endpoints

### Configuration Issues
- Auth0 settings in config.py: domain, audience, client credentials
- CORS middleware allows specific origins but may not handle Cloud Run requests properly

## Todo Items

- [ ] **Task 1**: Review Auth0 configuration and determine if Cloud Run requests should be authenticated
- [ ] **Task 2**: Identify which endpoints need authentication vs public access for your use case
- [ ] **Task 3**: Create conditional authentication middleware for Cloud Run environment  
- [ ] **Task 4**: Add environment-based authentication bypass for testing/Cloud Run
- [ ] **Task 5**: Test authentication flow with actual Auth0 tokens
- [ ] **Task 6**: Document authentication requirements for different deployment environments

## Next Steps
Need to understand:
1. Should Cloud Run requests bypass authentication entirely?
2. Are you using Auth0 tokens in your client requests?
3. Do you want to disable auth for specific endpoints or environments?
4. What's the intended authentication flow for your deployment?

Please review this analysis and let me know how you'd like to proceed with the authentication configuration.