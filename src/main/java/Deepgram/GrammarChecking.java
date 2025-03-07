package Deepgram;

import Classes.GrammarCheckService;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

public class GrammarChecking extends HttpServlet {

    private final GrammarCheckService grammarCheckService = new GrammarCheckService();

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        System.out.println("Received grammar check request");

        String textToCheck = request.getParameter("text");
        System.out.println("Transcribed text: " + textToCheck);

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String result = grammarCheckService.checkGrammar(textToCheck);
        response.getWriter().write(result);
    }
}
