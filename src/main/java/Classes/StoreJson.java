package Classes;

import DBAuthentication.DBConnection;
import org.json.JSONObject;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;

public class StoreJson {

    public static boolean saveJsonToDatabase(long fileId, long userId, JSONObject jsonData) {
        String sql = "INSERT INTO json_storage (file_id, user_id, data) VALUES (?, ?, ?)";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setLong(1, fileId);
            pstmt.setLong(2, userId);
            pstmt.setString(3, jsonData.toString()); // Store JSON as a string

            int rowsInserted = pstmt.executeUpdate();
            return rowsInserted > 0;

        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public static boolean saveJsonToDatabase(long fileId, long userId, String fileName, JSONObject jsonData) {
        String sql = "INSERT INTO json_storage (file_id, user_id, file_name, data) VALUES (?, ?, ?, ?)";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setLong(1, fileId);
            pstmt.setLong(2, userId);
            pstmt.setString(3, fileName);
            pstmt.setString(4, jsonData.toString());

            int rowsInserted = pstmt.executeUpdate();
            return rowsInserted > 0;

        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }
}
