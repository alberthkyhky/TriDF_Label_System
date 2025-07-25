# Debug App Reload Issue

## Changes Made:

1. **Removed React.StrictMode** - This was causing components to double-mount in development
2. **Added initialization guard** - Prevents AuthContext from re-initializing multiple times
3. **Added comprehensive logging** - Track when auth events occur
4. **Optimized context value** - Memoized to prevent unnecessary re-renders
5. **Fixed useCallback dependencies** - Prevents context value from changing unnecessarily

## Testing Steps:

1. Open browser developer console (F12)
2. Start the app: `npm start`
3. Login to your account
4. Watch console for initialization messages
5. Switch to another window/tab and back
6. Check if you see duplicate "AuthContext: Initializing authentication..." messages

## Expected Behavior After Fix:

- You should only see "AuthContext: Initializing authentication..." ONCE per session
- Switching windows should NOT trigger re-initialization
- The app state should remain stable

## If Still Having Issues:

Look for these console messages to help debug:
- `AuthContext: Initializing authentication...` (should appear only once)
- `AuthContext: Auth state changed` (only on actual auth changes)
- `AuthContext: Switching view mode to:` (only when you manually switch)

## Troubleshooting:

If the issue persists, it might be related to:
1. Browser tab focus/blur events
2. React development server hot reload
3. Supabase session management
4. Network connectivity issues causing re-authentication

## Further Investigation:

Check browser Network tab for unexpected API calls when switching windows.