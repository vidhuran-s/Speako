package Deepgram;

import Classes.TranscriptionService;
import Classes.UserDAO;
import org.json.JSONArray;
import org.json.JSONObject;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.InputStream;
import java.util.Enumeration;
import javax.servlet.http.HttpSession;


public class Transcription extends HttpServlet {
	private final TranscriptionService transcriptionService = new TranscriptionService();

	@Override
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		InputStream audioInputStream = null;
		try {
			HttpSession session = request.getSession(false);  // Get existing session
			String loggedInUser = (String) session.getAttribute("userId");
//			String fileName = (String) session.getAttribute("audioName");
			long fileId = 0;
			String fileName = "";

			JSONArray audioStorage = UserDAO.getLatestFileDetailsByUserId(Long.parseLong(loggedInUser));
			if (audioStorage.length() > 0) {
				JSONArray fileDetails = audioStorage.getJSONArray(0);
				fileId = fileDetails.getLong(0);
				fileName = fileDetails.getString(1);
			}


			System.out.println("UserId from session: " + loggedInUser);
//			System.out.println("Audio file name from session: " + fileName);


			audioInputStream = transcriptionService.extractAudioInputStream(request);

			if (audioInputStream == null) {
				response.sendError(HttpServletResponse.SC_BAD_REQUEST, "No audio file received.");
				return;
			}

			// Send audio to Deepgram and get response
			JSONObject jsonResponse = transcriptionService.sendAudioToDeepgram(audioInputStream);

			// Save transcription data
			boolean success = transcriptionService.saveTranscription(jsonResponse, Long.parseLong(loggedInUser), fileId, fileName);

			response.setContentType("application/json");
			response.getWriter().write(jsonResponse.toString());

		} catch (Exception e) {
			response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Error processing request: " + e.getMessage());
		}
	}
}
