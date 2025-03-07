package Classes;

import DBAuthentication.DBConnection;
import org.mindrot.jbcrypt.BCrypt;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class PasswordResetService {

    public boolean resetPassword(String token, String newPassword) throws SQLException {
        String hashedPassword = BCrypt.hashpw(newPassword, BCrypt.gensalt());

        try (Connection conn = DBConnection.getConnection()) {

            // Verify token
            PreparedStatement stmt = conn.prepareStatement(
                    "SELECT user_id, token_expiry FROM password_reset WHERE reset_token = ? AND token_expiry > NOW()");
            stmt.setString(1, token);
            ResultSet rs = stmt.executeQuery();

            if (rs.next()) {
                long userId = rs.getLong("user_id");

                // Update password in users table
                PreparedStatement updateStmt = conn.prepareStatement(
                        "UPDATE users SET password = ? WHERE id = ?");
                updateStmt.setString(1, hashedPassword);
                updateStmt.setLong(2, userId);
                int rowsAffected = updateStmt.executeUpdate();

                if (rowsAffected > 0) {
                    // Delete token after successful reset
                    PreparedStatement deleteStmt = conn.prepareStatement("DELETE FROM password_reset WHERE user_id = ?");
                    deleteStmt.setLong(1, userId);
                    deleteStmt.executeUpdate();

                    return true;  // Success
                } else {
                    return false; // Failed to update password
                }
            } else {
                return false; // Invalid or expired token
            }
        }
    }
}
