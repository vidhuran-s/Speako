package UserAuth;

import Classes.LoginService;
import Classes.UserLoginResult;
import Classes.User;
import org.json.JSONObject;
import javax.servlet.ServletException;
import javax.servlet.http.*;
import java.io.BufferedReader;
import java.io.IOException;

public class LoginServlet extends HttpServlet {

    private final LoginService loginService = new LoginService();

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        JSONObject jsonResponse = new JSONObject();

        try {
            JSONObject jsonRequest = readRequestBody(request);
            String email = jsonRequest.getString("email");
            String password = jsonRequest.getString("password");

            System.out.println("Received login request for email: " + email);

            // Authenticate user and get user details
            UserLoginResult loginResult = loginService.authenticateUser(email, password);
            String token = loginResult.getToken();
            User user = loginResult.getUser();


            // Set JWT Token in HttpOnly Cookie
            Cookie authCookie = new Cookie("auth_token", token);
//            authCookie.setHttpOnly(true);
//            authCookie.setSecure(true); // Ensure secure transmission (HTTPS required)
            authCookie.setPath("/");
            authCookie.setMaxAge(3 * 24 * 60 * 60); // 7 days expiration
            response.addCookie(authCookie);

            // Store user session
            HttpSession session = request.getSession();
            session.setAttribute("email", user.getEmail());
            session.setAttribute("userId", user.getUserId());
            session.setAttribute("name", user.getName());

            jsonResponse.put("success", true);
            jsonResponse.put("message", "Login successful");
            jsonResponse.put("user", new JSONObject()
                    .put("email", user.getEmail())
                    .put("userId", user.getUserId())
                    .put("name", user.getName())
            );
            response.setStatus(HttpServletResponse.SC_OK);

        } catch (Exception e) {
            e.printStackTrace();
            jsonResponse.put("success", false);
            jsonResponse.put("message", e.getMessage());
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        }

        response.getWriter().write(jsonResponse.toString());
    }

    private JSONObject readRequestBody(HttpServletRequest request) throws IOException {
        StringBuilder sb = new StringBuilder();
        String line;
        BufferedReader reader = request.getReader();
        while ((line = reader.readLine()) != null) {
            sb.append(line);
        }
        return new JSONObject(sb.toString());
    }
}
