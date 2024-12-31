class DebugMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        print("\n=== Request Debug ===")
        print("Path:", request.path)
        print("Method:", request.method)
        print("Session ID:", getattr(request, 'session', {}).get('session_key', 'No session'))
        print("User:", getattr(request, 'user', 'No user'))
        print("Authenticated:", getattr(request, 'user', None) and request.user.is_authenticated)
        print("Cookies:", request.COOKIES)
        print("===================\n")
        
        response = self.get_response(request)
        return response 