package EmailService;

import Classes.LoginService;
import Classes.User;
import Classes.UserLoginResult;
import Classes.VerificationService;
import javax.servlet.ServletException;
import javax.servlet.http.*;
import java.io.IOException;
import java.io.PrintWriter;

public class VerifyEmailServlet extends HttpServlet {
    private final VerificationService verificationService = new VerificationService();
    private final LoginService loginService = new LoginService();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String token = request.getParameter("token");
        response.setContentType("text/html");
        response.setCharacterEncoding("UTF-8");

        String verifiedEmail = verificationService.verifyEmail(token);

        if (verifiedEmail != null) {
            try {
                // Get user details and create auth token
                UserLoginResult loginResult = loginService.authenticateUserAfterVerification(verifiedEmail);
                String authToken = loginResult.getToken();
                User user = loginResult.getUser();

                // Set JWT Token in HttpOnly Cookie
                Cookie authCookie = new Cookie("auth_token", authToken);
                authCookie.setPath("/");
                authCookie.setMaxAge(7 * 24 * 60 * 60); // 7 days
                response.addCookie(authCookie);

                // Create session
                HttpSession session = request.getSession();
                session.setAttribute("email", user.getEmail());
                session.setAttribute("userId", user.getUserId());
                session.setAttribute("name", user.getName());

                // Send HTML response with auto-redirect
                try (PrintWriter out = response.getWriter()) {
                    out.println("<!DOCTYPE html>");
                    out.println("<html><head>");
                    out.println("<script>");
                    out.println("sessionStorage.setItem('userEmail', '" + user.getEmail() + "');");
                    out.println("sessionStorage.setItem('userId', '" + user.getUserId() + "');");
                    out.println("sessionStorage.setItem('userName', '" + user.getName() + "');");
                    out.println("setTimeout(function() { window.location.href = 'dashboard.html'; }, 1000);");
                    out.println("</script>");
                    out.println("</head><body>");
                    out.println("<h3>Email verified successfully! Redirecting to dashboard...</h3>");
                    out.println("</body></html>");
                }
            } catch (Exception e) {
                response.sendRedirect("index.html?error=verification-failed");
            }
        } else {
            response.getWriter().write("<h3>Invalid or expired token.</h3>");
        }
    }
}