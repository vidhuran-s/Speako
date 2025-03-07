package Classes;

import org.apache.commons.fileupload.FileItem;
import org.apache.commons.fileupload.disk.DiskFileItemFactory;
import org.apache.commons.fileupload.servlet.ServletFileUpload;
import org.json.JSONObject;

import javax.servlet.http.HttpServletRequest;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.List;

public class TranscriptionService {
    private static final String DEEPGRAM_API_KEY = "c5e60167622841793ef1d1b7975bb60c28f4b144";

    public InputStream extractAudioInputStream(HttpServletRequest request) throws Exception {
        // the request is multipart/form-data
        if (!ServletFileUpload.isMultipartContent(request)) {
            throw new Exception("Invalid request type. Expected multipart/form-data.");
        }

        DiskFileItemFactory factory = new DiskFileItemFactory();
        ServletFileUpload upload = new ServletFileUpload(factory);
        List<FileItem> formItems = upload.parseRequest(request);

        for (FileItem item : formItems) {
            if (!item.isFormField() && "audio".equals(item.getFieldName())) {
                return item.getInputStream(); // Return the audio input stream
            }
        }
        return null;
    }

    public JSONObject sendAudioToDeepgram(InputStream audioInputStream) throws IOException {
        URL url = new URL("https://api.deepgram.com/v1/listen?model=nova-2&punctuate=true&sentiment=true&utterances=true&smart_format=true&filler_words=true");
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setRequestMethod("POST");
        connection.setRequestProperty("Authorization", "Token " + DEEPGRAM_API_KEY);
        connection.setRequestProperty("Content-Type", "audio/wav");
        connection.setDoOutput(true);

        // Send audio data
        try (OutputStream os = connection.getOutputStream()) {
            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = audioInputStream.read(buffer)) != -1) {
                os.write(buffer, 0, bytesRead);
            }
        }

        // response from Deepgram API
        int responseCode = connection.getResponseCode();
        InputStream responseStream = (responseCode == HttpURLConnection.HTTP_OK)
                ? connection.getInputStream()
                : connection.getErrorStream();

        String jsonResponse = new BufferedReader(new InputStreamReader(responseStream))
                .lines()
                .reduce("", (acc, curr) -> acc + curr);

        return new JSONObject(jsonResponse);
    }

    public boolean saveTranscription(JSONObject jsonObject) {
        long fileId = System.nanoTime();
        long userId = System.nanoTime(); // Replace with actual user ID

        jsonObject.put("file_id", fileId);
        jsonObject.put("user_id", userId);

        return StoreJson.saveJsonToDatabase(fileId, userId, jsonObject);
    }

    public boolean saveTranscription(JSONObject jsonObject, String userId) {
        long fileId = System.nanoTime();
        long userID = Long.parseLong(userId); // Replace with actual user ID

        jsonObject.put("file_id", fileId);
        jsonObject.put("user_id", userID);

        return StoreJson.saveJsonToDatabase(fileId, userID, jsonObject);
    }

    public boolean saveTranscription(JSONObject jsonObject, String userId, String fileName) {
        long fileId = System.nanoTime();
        long userID = Long.parseLong(userId); // Replace with actual user ID
        System.out.println("File Name: " + fileName);

        jsonObject.put("file_id", fileId);
        jsonObject.put("user_id", userID);
        jsonObject.put("file_name", fileName);
        return StoreJson.saveJsonToDatabase(fileId, userID, fileName, jsonObject);
    }

    public boolean saveTranscription(JSONObject jsonObject, long userId, long fileId, String fileName) {
//        System.out.println("File Name: " + fileName);
//        System.out.println("File ID: " + fileId);
//        System.out.println("User ID: " + userId);
//        System.out.println("JSON Object: " + jsonObject.toString());

        jsonObject.put("file_id", fileId);
        jsonObject.put("user_id", userId);
        jsonObject.put("file_name", fileName);
        return StoreJson.saveJsonToDatabase(fileId, userId, fileName, jsonObject);
    }
}
