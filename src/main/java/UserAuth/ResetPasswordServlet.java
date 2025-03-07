package UserAuth;

import Classes.PasswordResetService;
import org.json.JSONObject;
import javax.servlet.ServletException;
import javax.servlet.http.*;
import java.io.IOException;

public class ResetPasswordServlet extends HttpServlet {

    private PasswordResetService passwordResetService = new PasswordResetService();

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        String token = request.getParameter("token");
        String newPassword = request.getParameter("password");

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        JSONObject jsonResponse = new JSONObject();

        try {
            // Call service layer for business logic
            boolean isResetSuccessful = passwordResetService.resetPassword(token, newPassword);

            if (isResetSuccessful) {
                jsonResponse.put("success", true);
                jsonResponse.put("message", "Password reset successful.");
                response.setStatus(HttpServletResponse.SC_OK);
            } else {
                jsonResponse.put("success", false);
                jsonResponse.put("message", "Invalid or expired token.");
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            }

        } catch (Exception e) {
            e.printStackTrace();
            jsonResponse.put("success", false);
            jsonResponse.put("message", "Internal server error.");
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }

        response.getWriter().write(jsonResponse.toString());
    }
}
