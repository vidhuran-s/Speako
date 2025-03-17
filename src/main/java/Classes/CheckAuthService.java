package Classes;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;

public class CheckAuthService {

    public AuthResult checkAuthentication(HttpServletRequest request) {
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
        public record AuthResult(boolean loggedIn, String email, String userId, String name) {
    }
}
