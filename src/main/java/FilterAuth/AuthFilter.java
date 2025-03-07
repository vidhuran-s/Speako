package FilterAuth;

import Classes.JWToken;

import javax.servlet.*;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

//@WebFilter("/protected/*") // Apply filter to secured routes
public class AuthFilter implements Filter {
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        String token = null;
        Cookie[] cookies = req.getCookies();

        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("auth_token".equals(cookie.getName())) {
                    token = cookie.getValue();
                    break;
                }
            }
        }

        if (token != null) {
            try {
                String newToken = JWToken.getInstance().validateAndExtendToken(token, req);

                // If token was renewed, update the cookie
                if (!token.equals(newToken)) {
                    Cookie authCookie = new Cookie("auth_token", newToken);
                    authCookie.setHttpOnly(true);
                    authCookie.setSecure(true);
                    authCookie.setPath("/");
                    authCookie.setMaxAge(7 * 24 * 60 * 60);
                    res.addCookie(authCookie);
                }

                chain.doFilter(request, response);
                return;
            } catch (RuntimeException e) {
                res.getWriter().write("Unauthorized: " + e.getMessage());
                return;
            }
        }

        res.getWriter().write("Unauthorized: No valid token found.");
    }

    public void init(FilterConfig fConfig) throws ServletException {}
    public void destroy() {}
}
