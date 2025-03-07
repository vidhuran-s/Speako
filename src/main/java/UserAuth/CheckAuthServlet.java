package UserAuth;

import Classes.CheckAuthService;
import org.json.JSONObject;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

public class CheckAuthServlet extends HttpServlet {

    private final CheckAuthService authService = new CheckAuthService();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        CheckAuthService.AuthResult authResult = authService.checkAuthentication(request);

        JSONObject jsonResponse = new JSONObject();
        jsonResponse.put("loggedIn", authResult.isLoggedIn());

        if (authResult.isLoggedIn()) {
            jsonResponse.put("email", authResult.getEmail());
            jsonResponse.put("userId", authResult.getUserId());
            jsonResponse.put("name", authResult.getName());
        }

        response.getWriter().write(jsonResponse.toString());
    }
}
