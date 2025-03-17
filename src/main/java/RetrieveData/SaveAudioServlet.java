package RetrieveData;

import Classes.UserDAO;

import javax.servlet.*;
import javax.servlet.http.*;
import java.io.IOException;
import java.io.PrintWriter;
import javax.servlet.http.HttpSession;

public class SaveAudioServlet extends HttpServlet {
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        // Get the fileName and audioLink from the request
        String fileName = request.getParameter("fileName");
        String audioLink = request.getParameter("audioLink");
        HttpSession session = request.getSession(false);
        String userId = session.getAttribute("userId").toString();
        System.out.println("User ID from SaveAudioServlet: " + userId);
        System.out.println("File name from SaveAudioServlet: " + fileName);
        System.out.println("Audio link from SaveAudioServlet: " + audioLink);
        UserDAO.saveAudioFile(userId, fileName, audioLink);

        response.setContentType("application/json");
        PrintWriter out = response.getWriter();
        out.print("{\"message\": \"Audio saved successfully\"}");
        out.flush();
    }
}
