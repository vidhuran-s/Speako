package RetrieveData;

import Classes.UserDAO;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;

//@WebServlet("/getAudioUrl")
public class GetAudioUrlServlet extends HttpServlet {
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String fileId = request.getParameter("fileId");
        response.setContentType("application/json");
        PrintWriter out = response.getWriter();

        try {
            // Get audio URL from database
            String audioUrl = UserDAO.getAudioUrlByFileId(fileId);

            if (audioUrl != null) {
                out.print("{\"audioUrl\":\"" + audioUrl + "\"}");
            } else {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                out.print("{\"error\":\"Audio URL not found\"}");
            }
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"error\":\"" + e.getMessage() + "\"}");
        }
        out.flush();
    }
}