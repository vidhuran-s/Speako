package Classes;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;

public class CheckAuthService {

    public AuthResult checkAuthentication(HttpServletRequest request) {
//        Cookie[] cookies = request.getCookies();
//        if (cookies == null) {
//            return new AuthResult(false, null, null, null);
//        }
//
//        String token = null;
//        for (Cookie cookie : cookies) {
//            if ("auth_token".equals(cookie.getName()) || "SESSION_ID".equals(cookie.getName())) {
//                token = cookie.getValue();
//                break;
//            }
//        }
//
//        if (token == null) {
//            return new AuthResult(false, null, null, null);
//        }
//
//        try {
//            // Validate token and get new token if needed
//            String newToken = JWToken.getInstance().validateAndExtendToken(token, request);
//
//            // If validation successful, get user info from session
//            HttpSession session = request.getSession(false);
//            if (session != null) {
//                String email = (String) session.getAttribute("email");
//                String userId = (String) session.getAttribute("userId");
//                String name = (String) session.getAttribute("name");
//
//                if (email != null && userId != null) {
//                    return new AuthResult(true, email, userId, name);
//                }
//            }
//        } catch (RuntimeException e) {
//            return new AuthResult(false, null, null, null);
//        }
//
//        return new AuthResult(false, null, null, null);

        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return new AuthResult(false, null, null, null);
        }

        for (Cookie cookie : cookies) {
            if ("auth_token".equals(cookie.getName()) || "SESSION_ID".equals(cookie.getName())) {
                HttpSession session = request.getSession(false);
                if (session != null) {
                    String email = (String) session.getAttribute("email");
                    String userId = (String) session.getAttribute("userId");
                    String name = (String) session.getAttribute("name");

                    if (email != null && userId != null) {
                        return new AuthResult(true, email, userId, name);
                    }
                }
            }
        }
        return new AuthResult(false, null, null, null);
    }

    // Class to hold authentication result
    public static class AuthResult {
        private final boolean loggedIn;
        private final String email;
        private final String userId;
        private final String name;

        public AuthResult(boolean loggedIn, String email, String userId, String name) {
            this.loggedIn = loggedIn;
            this.email = email;
            this.userId = userId;
            this.name = name;
        }

        public boolean isLoggedIn() {
            return loggedIn;
        }

        public String getEmail() {
            return email;
        }

        public String getUserId() {
            return userId;
        }

        public String getName() {
            return name;
        }
    }
}
