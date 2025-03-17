package Classes;

import DBAuthentication.DBConnection;
import org.json.JSONArray;
import org.mindrot.jbcrypt.BCrypt;

import java.sql.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class UserDAO {

    // Check a user exists (unique ID)
    public boolean userExists(long userId) {
        String sql = "SELECT id FROM users WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, userId);
            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next();
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    // Get email of user by their unique ID
    public String getEmailById(long userId) {
        String sql = "SELECT email FROM users WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, userId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getString("email");
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    // Validate user login (check email and password)
    public boolean validateUser(String email, String password) {
        boolean isValidUser = false;

        try (Connection conn = DBConnection.getConnection()) {
            String sql = "SELECT password FROM users WHERE email = ?";
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setString(1, email);

                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        String storedHashedPassword = rs.getString("password");

                        //Correct password validation using BCrypt
                        if (BCrypt.checkpw(password, storedHashedPassword)) {
                            isValidUser = true;
                        }
                    }
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }

        return isValidUser;
    }

    // Get user ID if email and password match
    public String getUserIdByEmailAndPassword(String email, String password) {
        String userId = null;
        System.out.println("Getting into method with email: " + email);
        
        try (Connection conn = DBConnection.getConnection()) {
            if (conn == null) {
                System.out.println("DB Connection is NULL!");
                return null;
            }
            System.out.println("Getting into connection");

            String sql = "SELECT id, password FROM users WHERE email = ?";
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setString(1, email);
                System.out.println("Getting into preparedStmt");

                try (ResultSet rs = ps.executeQuery()) {
                    System.out.println("Getting into Rset");

                    if (!rs.isBeforeFirst()) {
                        System.out.println("No user found with this email: " + email);
                        return null;
                    }

                    if (rs.next()) {
                        System.out.println("User found, checking password...");
                        
                        String storedHashedPassword = rs.getString("password");
                        System.out.println("Stored Hashed Password: " + storedHashedPassword);

                        if (storedHashedPassword == null || storedHashedPassword.isEmpty()) {
                            System.out.println("Password in DB is NULL or EMPTY!");
                            return null;
                        }

                        //Verify password before returning the user ID
                        if (BCrypt.checkpw(password, storedHashedPassword)) {
                            userId = rs.getString("id");
                            System.out.println("Password matches, returning user ID: " + userId);
                        } else {
                            System.out.println("Password does not match!");
                        }
                    }
                }
            }
        } catch (SQLException e) {
            System.out.println("SQL Exception occurred!");
            e.printStackTrace();
        }

        return userId; // Returns null if credentials are invalid
    }


    //Check if email already exists
    public boolean isEmailExists(String email) {
        boolean exists = false;

        try (Connection conn = DBConnection.getConnection()) {
            String sql = "SELECT COUNT(*) FROM users WHERE email = ?";
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setString(1, email);

                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next() && rs.getInt(1) > 0) {
                        exists = true;
                    }
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }

        return exists;
    }

    // Insert new user into the database
    public boolean insertUser(String userId, String name, String email, String hashedPassword) {
        boolean isInserted = false;

        try (Connection conn = DBConnection.getConnection()) {
            String sql = "INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)";
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setString(1, userId);
                ps.setString(2, name);
                ps.setString(3, email);
                ps.setString(4, hashedPassword);

                int rowsAffected = ps.executeUpdate();
                isInserted = rowsAffected > 0;
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }

        return isInserted;
    }

    public boolean insertEmailVerification(String userId, String email, String token) {
        String query = "INSERT INTO email_verification (user_id, email, token, created_at) VALUES (?, ?, ?, ?)";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(query)) {

            // Set expiry time (30 minutes from now)
            Timestamp expiryTime = Timestamp.from(Instant.now().plusSeconds(1800));

            stmt.setString(1, userId);
            stmt.setString(2, email);
            stmt.setString(3, token);
            stmt.setTimestamp(4, expiryTime);

            int rowsInserted = stmt.executeUpdate();
            return rowsInserted > 0;

        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public boolean isEmailVerified(String email) {
        String sql = "SELECT is_verified FROM email_verification WHERE email = ? AND is_verified = true";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, email);
            ResultSet rs = stmt.executeQuery();
            return rs.next();
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public String[] getUserCredentialsByEmail(String email) {
        String query = "SELECT id, password FROM users WHERE email = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(query)) {

            stmt.setString(1, email);
            ResultSet rs = stmt.executeQuery();

            if (rs.next()) {
                return new String[]{rs.getString("id"), rs.getString("password")};
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    public User getUserByEmail(String email) {
        String query = "SELECT id, name, email, password FROM users WHERE email = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(query)) {

            stmt.setString(1, email);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    User user = new User();
                    user.setUserId(rs.getString("id"));
                    user.setName(rs.getString("name"));
                    user.setEmail(rs.getString("email"));
                    user.setPassword(rs.getString("password"));
                    return user;
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    public JSONArray getJsonDataByUserId(long userId) {
        JSONArray jsonArray = new JSONArray();
        String sql = "SELECT data FROM json_storage WHERE user_id = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, userId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    jsonArray.put(rs.getString("data"));
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return jsonArray;
    }

    public static void saveAudioFile(String userId, String fileName, String audioLink) {
        String query = "INSERT INTO audio_storage (user_id, file_id, file_name, audio_link) VALUES (?, ?, ?, ?)";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement statement = conn.prepareStatement(query)) {

            // Set the fileName and audioLink parameters
            statement.setLong(1, Long.parseLong(userId));
            statement.setLong(2, System.nanoTime());
            statement.setString(3, fileName);
            statement.setString(4, audioLink);

            int rowsAffected = statement.executeUpdate();
            if (rowsAffected > 0) {
                System.out.println("Audio file data saved successfully!");
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    public static JSONArray getLatestFileDetailsByUserId(long userId) {
        JSONArray jsonArray = new JSONArray();
        String sql = "SELECT file_id, file_name FROM audio_storage WHERE user_id = ? ORDER BY currentDate DESC LIMIT 1";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, userId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    // Create a JSON object with file_id and file_name
                    JSONArray fileDetails = new JSONArray();
                    fileDetails.put(rs.getLong("file_id"));
                    fileDetails.put(rs.getString("file_name"));

                    jsonArray.put(fileDetails);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return jsonArray;
    }

    public static String getAudioUrlByFileId(String fileId) {
        String audioUrl = null;
        String sql = "SELECT audio_link FROM audio_storage WHERE file_id = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, fileId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    audioUrl = rs.getString("audio_link");
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return audioUrl;
    }

    public boolean deleteTranscription(long fileId) {
        Connection conn = null;
        try {
            conn = DBConnection.getConnection();
            conn.setAutoCommit(false);  // Start transaction

            // Delete from json_storage first (due to potential foreign key constraints)
            String jsonSql = "DELETE FROM json_storage WHERE file_id = ?";
            try (PreparedStatement jsonStmt = conn.prepareStatement(jsonSql)) {
                jsonStmt.setLong(1, fileId);
                jsonStmt.executeUpdate();
            }

            // Delete from audio_storage
            String audioSql = "DELETE FROM audio_storage WHERE file_id = ?";
            try (PreparedStatement audioStmt = conn.prepareStatement(audioSql)) {
                audioStmt.setLong(1, fileId);
                int rowsAffected = audioStmt.executeUpdate();

                conn.commit();  // Commit transaction
                return rowsAffected > 0;
            }
        } catch (SQLException e) {
            if (conn != null) {
                try {
                    conn.rollback();  // Rollback on error
                } catch (SQLException ex) {
                    ex.printStackTrace();
                }
            }
            e.printStackTrace();
            return false;
        } finally {
            if (conn != null) {
                try {
                    conn.setAutoCommit(true);  // Reset auto-commit
                    conn.close();
                } catch (SQLException e) {
                    e.printStackTrace();
                }
            }
        }
    }

    public boolean subExists(String sub) {

        System.out.println("Inside subexists");
        try (Connection conn = DBConnection.getConnection()){
            PreparedStatement stmt = conn.prepareStatement("SELECT * FROM users WHERE sub = ?");

            stmt.setString(1, sub);
            ResultSet rs = stmt.executeQuery();
            if (rs.next()) {
                System.out.println("User exists with provided sub");
                return true;
            }

            System.out.println("User doesn't exist with provided sub");
            return false;

            // Returns true if user exists
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }



    public boolean emailExists(String email) {

        System.out.println("inside mailExists");

        try (Connection conn = DBConnection.getConnection()){
            PreparedStatement stmt = conn.prepareStatement("SELECT * FROM users WHERE email = ?");

            stmt.setString(1, email);
            ResultSet rs = stmt.executeQuery();

            if (rs.next()) {
                System.out.println("User exists with provided mail");
                return true;
            }

            System.out.println("User doesn't exist with provided mail");
            return false;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }


    public boolean createUser(long userId, String name, String email, String sub, String password) {
        String sql;

        if (password.isEmpty()) {
            sql = "INSERT INTO users(id,email,sub) VALUES (?, ?,?)";
        } else {

            sql = "insert into users(id,name,email,password) values (?,?,?,?)";
        }

        try (Connection conn = DBConnection.getConnection();){
            PreparedStatement stmt = conn.prepareStatement(sql);

            stmt.setLong(1, userId);

            if (password.isEmpty()) {
                stmt.setString(2, email);
                stmt.setString(3, sub);
            } else {
                stmt.setString(2, name);
                stmt.setString(3, email);
                String hashedPassword = BCrypt.hashpw(password, BCrypt.gensalt(12));
                stmt.setString(4, hashedPassword);
            }

            int rows = stmt.executeUpdate();

            if (rows > 0) {
                System.out.println("User created successfully: " + email);
                return true;
            }

            System.out.println("User creation failed");

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return false;
    }


    public boolean isValidSession(String sessionId) {
        String sql = "SELECT expiry_time FROM sessions WHERE session_id = ?";
        try (Connection conn = DBConnection.getConnection();){
            PreparedStatement stmt = conn.prepareStatement(sql);

            stmt.setString(1, sessionId);
            ResultSet rs = stmt.executeQuery();

            if (rs.next()) {
                long expiryTime = rs.getLong("expiry_time");
                long currentTime = System.currentTimeMillis();

                if (currentTime < expiryTime) {
                    System.out.println("Session is valid.");
                    return true;
                } else {
                    System.out.println("Session expired.");
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }

        return false;
    }


    public boolean storeSession(String email, String sessionId, long expiryTime) {
        String sql = "select id from users where email = ?";


        try (Connection conn = DBConnection.getConnection()){
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setString(1, email);
            ResultSet rs = stmt.executeQuery();

            long userId = 0;
            if (rs.next()) {
                System.out.println("USER ID OF : " + email + "RETRIEVED");
                userId = rs.getLong("id");
            }

            PreparedStatement stmt2 = conn.prepareStatement("insert into sessions (session_id,expiry_time,user_id) VALUES (?,?,?)");
            stmt2.setString(1, sessionId);
            stmt2.setLong(2, expiryTime);
            stmt2.setLong(3, userId);

            int rows = stmt2.executeUpdate();
            if(rows>0) return true;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
        return false;
    }


    public void storeDetails(String email,String zId){
        System.out.println("inside storedetails");

        System.out.println("email: "+email);
        System.out.println("zId: "+zId);

        long parsedZId = Long.parseLong(zId);

        try(Connection conn = DBConnection.getConnection()){
            PreparedStatement stmt = conn.prepareStatement("select id from users where email = ?");
            stmt.setString(1,email);
            ResultSet rs = stmt.executeQuery();

            if(rs.next()){

                System.out.println("user id retrieved");

                long uId = rs.getLong(1);
                System.out.println("user id: "+uId);

                PreparedStatement stmt2 = conn.prepareStatement("insert into z_user_json_storage (user_id,z_id) values (?,?)");
                stmt2.setLong(1,uId);
                stmt2.setLong(2,parsedZId);
                int rows = stmt2.executeUpdate();

                if(rows>0){
                    System.out.println("insertion into z_user_json_storage successful");
                }else{
                    System.out.println("insertion into z_user_json_storage unsuccessful");
                }
            }
        }catch(SQLException e){
            throw new RuntimeException(e);
        }
    }



    public boolean deleteSessionfromSessions(String session_id){
        try(Connection conn = DBConnection.getConnection()){
            PreparedStatement stmt = conn.prepareStatement("delete from sessions where session_id = ?");
            stmt.setString(1,session_id);
            int rows = stmt.executeUpdate();
            if(rows>0){
                return true;
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
        return false;
    }

    public void updateName(String email,String name){
        System.out.println("inside updateName method");
        try (Connection conn = DBConnection.getConnection()){
            PreparedStatement stmt1 = conn.prepareStatement("update users set name = ? where email = ?");
            stmt1.setString(1,name);
            stmt1.setString(2,email);
            int rows = stmt1.executeUpdate();

            if(rows>0){
                System.out.println("Name updated successfully");
            }else{
                System.out.println("Name update failed");
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

}
