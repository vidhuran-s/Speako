package RetrieveData;

import org.json.JSONObject;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.BufferedReader;
import java.io.IOException;

//to get the stored session (created when user logs in) and set the details as json to client-side (app.js)
public class GetSessionUser extends HttpServlet {

    private static JSONObject jsonObject;


    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        System.out.println("inside doGet of getSessionUser");
        if(jsonObject != null){
            System.out.println(jsonObject.toString());
            resp.setContentType("application/json");
            resp.setCharacterEncoding("UTF-8");
            resp.getWriter().write(jsonObject.toString());
        }
        else{
            resp.getWriter().write("");
        }
    }


    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        try {
            System.out.println("Inside doPost of GetSessionUser");

            // Read JSON object from request
            StringBuilder jsonBuffer = new StringBuilder();
            String line;
            try (BufferedReader reader = req.getReader()) {
                while ((line = reader.readLine()) != null) {
                    jsonBuffer.append(line);
                }
            }

            // Convert string to JSON
            jsonObject = new JSONObject(jsonBuffer.toString());

            // Print received JSON
            System.out.println("Received JSON: " + jsonObject);

            HttpSession session = req.getSession();
            session.setAttribute("userDetails", jsonObject.toString());

            // Send response
            resp.setContentType("application/json");
            resp.getWriter().write("{\"message\":\"User session stored successfully\"}");

        } catch (Exception e) {
            System.err.println("Error in doPost of GetSessionUser");
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }
}

