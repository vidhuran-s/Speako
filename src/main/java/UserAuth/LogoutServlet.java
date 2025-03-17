package UserAuth;

import Classes.UserDAO;

import javax.servlet.ServletException;
import javax.servlet.http.*;
import java.io.IOException;

public class LogoutServlet extends HttpServlet {
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        // Invalidate the session
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }


        System.out.println("\n\ndeleting cookies\n\n");
        for (Cookie cookie : request.getCookies()){

            System.out.println("cookie to be deleted = > "+cookie.getName());

            if(cookie.getName().equals("auth_token")){
                System.out.println("equals auth_token");
                // Remove auth_token cookie
                Cookie authCookie = new Cookie("auth_token", "");
                authCookie.setPath("/");
                authCookie.setMaxAge(0); // Expire immediately
                response.addCookie(authCookie);
                response.setStatus(HttpServletResponse.SC_OK);
            }

            else if(cookie.getName().equals("SESSION_ID")){
                System.out.println("equals session_id");
                // Remove SESSION_ID cookie
                UserDAO userHandler = new UserDAO();
                boolean isDeleted = userHandler.deleteSessionfromSessions(cookie.getValue());

                if(isDeleted){
                    System.out.println("Deleted from sessions table");
                }else{
                    System.out.println("Deletion from sessions table failed");
                }

                Cookie sessionCookie = new Cookie("SESSION_ID", "");
                sessionCookie.setPath("/SpeekO");
                sessionCookie.setHttpOnly(true);
                sessionCookie.setSecure(true);
                sessionCookie.setMaxAge(0); // Expire immediately
                response.addCookie(sessionCookie);
                response.setStatus(HttpServletResponse.SC_OK);
                response.getWriter().write("session_id cookie deleted successfully");
                response.getWriter().flush();
                response.getWriter().close();

            }
        }
    }
}
