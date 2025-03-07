package UserAuth;

import java.io.IOException;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;


public class RedirectServlet extends HttpServlet {
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        String clientId = "1000.I7YZUW54IDVJSU578WTKCBS2IWCL6U";
        String redirectURI = "https://rndov-139-167-67-125.a.free.pinggy.link/SpeekO/auth-servlet";
        String scope = "email,ZohoCliq.Users.READ";

        String authUrl = "https://accounts.zoho.com/oauth/v2/auth?client_id=" + clientId
                + "&redirect_uri=" + redirectURI
                + "&scope=" + scope
                + "&response_type=code";

        // Set the required headers before redirecting
        response.setHeader("X-Pinggy-No-Screen", "true");

        // Redirect the user
        response.sendRedirect(authUrl);
    }
}


//https://accounts.zoho.com/oauth/v2/auth?client_id=1000.I7YZUW54IDVJSU578WTKCBS2IWCL6U&redirect_uri=https://rndov-139-167-67-125.a.free.pinggy.link/SpeekO/auth-servlet&scope=email,ZohoCliq.Users.READ&response_type=code
