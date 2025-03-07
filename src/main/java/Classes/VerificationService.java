package Classes;

import DBAuthentication.DBConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class VerificationService {

    public String verifyEmail(String token) {
        String sql = "UPDATE email_verification SET is_verified = true WHERE token = ? AND is_verified = false";
        String emailSql = "SELECT email FROM email_verification WHERE token = ?";

        try (Connection conn = DBConnection.getConnection()) {
            // First get the email
            String email = null;
            try (PreparedStatement stmt = conn.prepareStatement(emailSql)) {
                stmt.setString(1, token);
                ResultSet rs = stmt.executeQuery();
                if (rs.next()) {
                    email = rs.getString("email");
                }
            }

            // Then verify the email
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setString(1, token);
                int updated = stmt.executeUpdate();
                if (updated > 0 && email != null) {
                    return email;
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }
}
