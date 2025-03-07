package Classes;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

public class GrammarCheckService {

    private static final String GRAMMAR_API_URL = "https://api.languagetool.org/v2/check";

    public String checkGrammar(String textToCheck) throws IOException {
        if (textToCheck == null || textToCheck.isEmpty()) {
            return "{\"error\": \"No text provided for grammar check\"}";
        }

        URL url = new URL(GRAMMAR_API_URL);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setRequestMethod("POST");
        connection.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
        connection.setDoOutput(true);
        connection.setConnectTimeout(5000);
        connection.setReadTimeout(5000);

        String requestBody = "text=" + URLEncoder.encode(textToCheck, StandardCharsets.UTF_8) + "&language=en";

        try (OutputStream os = connection.getOutputStream()) {
            os.write(requestBody.getBytes(StandardCharsets.UTF_8));
        }

        int responseCode = connection.getResponseCode();
        InputStream responseStream = (responseCode == HttpURLConnection.HTTP_OK) ? connection.getInputStream() : connection.getErrorStream();

        StringBuilder responseData = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(responseStream))) {
            String line;
            while ((line = reader.readLine()) != null) {
                responseData.append(line);
            }
        }

        if (responseCode != HttpURLConnection.HTTP_OK) {
            System.err.println("Grammar API Error: " + responseData);
        }

        return responseData.toString();
    }
}
