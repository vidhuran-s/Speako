package UserAuth;

import Classes.ForgotPasswordService;
import com.fasterxml.jackson.databind.ObjectMapper;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.sql.SQLException;

public class ForgotPasswordServlet extends HttpServlet {

    private final ForgotPasswordService passwordResetService = new ForgotPasswordService();

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("text/plain");
        response.setCharacterEncoding("UTF-8");

        ObjectMapper objectMapper = new ObjectMapper();
        EmailRequest emailRequest = objectMapper.readValue(request.getInputStream(), EmailRequest.class);
        String email = emailRequest.getEmail();

        try {
            String token = passwordResetService.generatePasswordResetToken(email);
            if (token != null) {
                boolean emailSent = passwordResetService.sendPasswordResetEmail(email, token);
                if (emailSent) {
                    response.getWriter().println("Password reset email sent successfully.");
                } else {
                    response.getWriter().println("Error sending password reset email.");
                }
            } else {
                response.getWriter().println("Email not found.");
            }
        } catch (SQLException e) {
            e.printStackTrace();
            response.getWriter().println("Internal server error.");
        }
    }

    private static class EmailRequest {
        private String email;

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }
    }
}
