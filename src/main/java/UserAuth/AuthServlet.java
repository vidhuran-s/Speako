package UserAuth;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.UUID;

import javax.servlet.RequestDispatcher;
import javax.servlet.ServletException;
import javax.servlet.http.*;

import Classes.User;
import Classes.UserDAO;
import org.json.JSONObject;



public class AuthServlet extends HttpServlet {



    private static String client_id = "1000.I7YZUW54IDVJSU578WTKCBS2IWCL6U";
    private static String client_secret = "7376d3f57d77c832d6018ba7a1e9852befecc1589d";
    private static String redirect_URI = "http://localhost:8080//SpeakO/auth-servlet";
    private static String token_URL = "https://accounts.zoho.com/oauth/v2/token";


    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        System.out.println("inside doget of AuthServlet");
        UserDAO userHandler = new UserDAO();

        resp.getWriter().write("{\"debug\":\"Servlet has been hit.\"}");
        System.out.println("\n\n\nServlet is running...");

        String authCode = req.getParameter("code");
        if (authCode == null) {
            resp.sendRedirect("index.html");
            return;
        }

        System.out.println("\n\n\nAuth code Received: " + authCode);
        req.setAttribute("authCode", authCode);
        doPost(req, resp);
    }


    private JSONObject getPayloadFromTokenId(String tokenId){
        try {
            // Split JWT token (Header.Payload.Signature)
            String[] parts = tokenId.split("\\.");
            if (parts.length < 2) {
                throw new IllegalArgumentException("Invalid ID Token format");
            }

            // Decode Payload (Base64)
            String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]));

            // Parse JSON
            JSONObject payload = new JSONObject(payloadJson);

            return payload;

        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }










    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        UserDAO userHandler = new UserDAO();
        System.out.println("inside doPost of AuthServlet");
        String authCode = req.getAttribute("authCode").toString();

        System.out.println(authCode + "  =====>   authcode from doget");
        if (authCode == null) {
            resp.sendRedirect("index.html");
            return;
        }


        // Prepare request parameters
        String postData = "code=" + URLEncoder.encode(authCode, StandardCharsets.UTF_8) +
                "&client_id=" +client_id +
                "&client_secret=" + client_secret+
                "&redirect_uri=" + URLEncoder.encode(redirect_URI, StandardCharsets.UTF_8) +
                "&grant_type=authorization_code";


        // Send HTTP POST request to Zoho API
        URL url = new URL(token_URL);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
        conn.setDoOutput(true);


        try (OutputStream os = conn.getOutputStream()) {
            os.write(postData.getBytes());
            os.flush();
        }

        // Read API response
        BufferedReader in = new BufferedReader(new InputStreamReader(conn.getInputStream()));
        StringBuilder response = new StringBuilder();
        String inputLine;
        while ((inputLine = in.readLine()) != null) {
            response.append(inputLine);
        }
        in.close();


//        resp.getWriter().write(response.toString());


        // Parse the JSON response properly
        JSONObject jsonResponse = new JSONObject(response.toString());
        boolean hasIdToken = jsonResponse.has("id_token");
        String accessToken = jsonResponse.getString("access_token");

        // Extract id_token
        if (hasIdToken) {

            String JWT = jsonResponse.getString("id_token");
            JSONObject payload = getPayloadFromTokenId(JWT);
            System.out.println("jwt: "+JWT);

            if(payload == null){
                System.out.println("Error: Failed to extract payload from ID token.");
                resp.getWriter().write("{\"error\":\"Invalid ID token\"}");
                resp.sendRedirect("index.html");
                return;
            }
            String sub = payload.getString("sub");
            String email = payload.getString("email");

            System.out.println("email = "+email);

            long expTime = payload.getLong("exp") * 1000; // Convert to milliseconds
            System.out.println("expiry time in milliseconds = "+expTime);
            long currentTime = System.currentTimeMillis();
            if (currentTime > expTime) {
                System.out.println("Token expired.");
            }

            boolean subExists = userHandler.subExists(sub);

            System.out.println("subexists? ==>"+subExists);

            if(subExists){
                System.out.println("user exists");
            } else {
                boolean mailExists = userHandler.emailExists(email);
                System.out.println("mailexists? ==>"+mailExists);
                if(mailExists){
                    System.out.println("user mail exists");
                }else{
                    long userId = System.nanoTime();
                    userHandler.createUser(userId,"",email, sub,"");
                    System.out.println("user created");
                }
            }

            // After user authentication
            String sessionId = UUID.randomUUID().toString(); // Generate a unique session ID

            // Store session in the database
            boolean isSessionStored = userHandler.storeSession(email,sessionId,expTime); // Implement this method in UserManager
            if(isSessionStored){
                System.out.println("session created and stored");
            }else{
                System.out.println("session not stored");
            }

            // Validate session before setting cookies
            if (!userHandler.isValidSession(sessionId)) {
                System.out.println("invalid session");
                resp.sendRedirect("index.html");
                return;
            }

            // Set the session ID as a cookie
            Cookie sessionCookie = new Cookie("SESSION_ID", sessionId);
            sessionCookie.setHttpOnly(true);
            sessionCookie.setSecure(true);  // Set to true in production (HTTPS)
            sessionCookie.setMaxAge(7*24*3600);  // Expires in 7 days
            sessionCookie.setPath("/");
            resp.addCookie(sessionCookie);



            URL url1 = new URL("https://cliq.zoho.com/api/v2/users/"  + email + "?fields=all");
            HttpURLConnection conn1 = (HttpURLConnection) url1.openConnection();
            conn1.setRequestMethod("GET");
            conn1.setRequestProperty("Authorization", "Zoho-oauthtoken "+ accessToken);
            conn1.setRequestProperty("Content-Type", "application/json");

            int respCode = conn1.getResponseCode();
            System.out.println("response code (user details) : "+respCode);

            if (conn1.getResponseCode() != 200) {
                throw new IOException("Failed to get user details from Zoho cliq: " + conn1.getResponseCode());
            }

            InputStreamReader inputStreamReader = new InputStreamReader(conn1.getInputStream());
            BufferedReader bufferedReader = new BufferedReader(inputStreamReader);
            StringBuilder response1= new StringBuilder();
            String line;
            while ((line = bufferedReader.readLine()) != null) {
                response1.append(line);
            }
            bufferedReader.close();

            JSONObject respJson = new JSONObject(response1.toString());
            JSONObject dataObject = respJson.getJSONObject("data");
            String zId = dataObject.getString("id");
            String name =dataObject.getString("first_name");


            userHandler.storeDetails(email,zId);
            userHandler.updateName(email,name);

            System.out.println("getting user by email");
            User user = userHandler.getUserByEmail(email);
            System.out.println("User ========> "+user.getUserId()+" "+user.getName()+" "+email);
            //create a session

            System.out.println("Checking session...");
            HttpSession session = req.getSession(false); // Don't create a new session if it doesn't exist

            if (session == null) {
                System.out.println("No existing session found. Creating new session...");
                session = req.getSession(true);
            } else {
                System.out.println("Existing session found: " + session.getId());
            }


            try{
                System.out.println("Setting session attributes");
                System.out.println("setting email");
                session.setAttribute("email", email);
                System.out.println("email set");

                System.out.println("getting userId");
                System.out.println("userId => "+user.getUserId());
                session.setAttribute("userId", user.getUserId());
                System.out.println("userId set");

                session.setAttribute("name", name);
                System.out.println("Session attributes set");
            } catch (Exception e) {
                e.printStackTrace();
            }


            String imageUrl = "https://contacts.zoho.com/file?t=user&ID=" + URLEncoder.encode(zId, StandardCharsets.UTF_8) + "&fs=thumb";

            try {
                // Create URL connection
                URL url2 = new URL(imageUrl);
                HttpURLConnection conn2 = (HttpURLConnection) url2.openConnection();
                conn2.setRequestMethod("GET");
                conn2.setRequestProperty("User-Agent", "Mozilla/5.0");
                conn2.setRequestProperty("Accept", "image/png,image/jpeg,image/*");
                conn2.setInstanceFollowRedirects(true); // Follow redirects if any

                int respCode1 = conn2.getResponseCode();
                System.out.println("Response Code: " + respCode1);
                System.out.println("Content Type: " + conn2.getContentType());

                if (respCode1 == HttpURLConnection.HTTP_OK && conn2.getContentType().startsWith("image")) {
                    // Read input stream into byte array
                    InputStream inputStream = conn2.getInputStream();
                    ByteArrayOutputStream out = new ByteArrayOutputStream();
                    byte[] buffer = new byte[1024];
                    int bytesRead;
                    while ((bytesRead = inputStream.read(buffer)) != -1) {
                        out.write(buffer, 0, bytesRead);
                    }
                    inputStream.close();
                    byte[] imageBytes = out.toByteArray();

                    // Convert to Base64
                    String base64Image = Base64.getEncoder().encodeToString(imageBytes);

                    System.out.println("Base64 Encoded Image: " + base64Image);
                } else {
                    System.out.println("Failed to retrieve image. Check authentication or permissions.");
                }
            } catch (Exception e) {
                e.printStackTrace();
            }

            System.out.println("creating user json obj");
            JSONObject json = new JSONObject();
            json.put("userName",name);
            json.put("userEmail",email);
            json.put("userId",user.getUserId());
            System.out.println("user json created: "+json.toString());

            System.out.println("creating url connection with getsessionuser");
            URL url4 = new URL("http://localhost:8080/SpeakO/get-session-user");
            HttpURLConnection conn4 = (HttpURLConnection) url4.openConnection();
            conn4.setRequestMethod("POST");
            conn4.setDoOutput(true);
            conn4.setRequestProperty("Content-Type", "application/json");
            try (OutputStream os = conn4.getOutputStream()) {
                os.write(json.toString().getBytes(StandardCharsets.UTF_8));
            }

            System.out.println("req sent");

            System.out.println("Request sent. Waiting for response...");

            int responseCode = conn4.getResponseCode();
            System.out.println("Response Code: " + responseCode);
            if (responseCode >= 400) {
                System.out.println("Error from server: " + new String(conn4.getErrorStream().readAllBytes(), StandardCharsets.UTF_8));
            } else {
                System.out.println("Success from server: " + new String(conn4.getInputStream().readAllBytes(), StandardCharsets.UTF_8));
            }
            System.out.println(session.getAttribute("userId"));


            resp.sendRedirect("dashboard.html");

        } else {
            System.out.println("Error: id_token not found in response.");
            resp.sendRedirect("index.html");
        }
    }
}
