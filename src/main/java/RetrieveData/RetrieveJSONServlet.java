package RetrieveData;

import Classes.UserDAO;
import org.json.JSONArray;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.IOException;
import java.io.PrintWriter;

public class RetrieveJSONServlet extends HttpServlet {
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        HttpSession session = request.getSession(false); // Get session if exists
        if (session == null || session.getAttribute("userId") == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"error\": \"User not logged in\"}");
            return;
        }

        String userIdStr = (String) session.getAttribute("userId"); // Get userId from session
        long userId = Long.parseLong(userIdStr); // Convert to long
        UserDAO jsonRetrieval = new UserDAO();
        JSONArray jsonArray = jsonRetrieval.getJsonDataByUserId(userId);

        try (PrintWriter out = response.getWriter()) {
            out.print(jsonArray.toString()); // Send JSON response
            out.flush();
        }
    }
}

