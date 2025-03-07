package RetrieveData;

import Classes.UserDAO;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;

public class DeleteTranscriptionServlet extends HttpServlet {
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String fileIdStr = request.getParameter("fileId");
        response.setContentType("application/json");
        PrintWriter out = response.getWriter();

        try {
            long fileId = Long.parseLong(fileIdStr);
            UserDAO userDAO = new UserDAO();
            boolean success = userDAO.deleteTranscription(fileId);

            if (success) {
                response.setStatus(HttpServletResponse.SC_OK);
                out.print("{\"message\":\"Transcription deleted successfully\"}");
            } else {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                out.print("{\"error\":\"Transcription not found\"}");
            }
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"error\":\"" + e.getMessage() + "\"}");
        }
        out.flush();
    }
}
