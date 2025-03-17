package Classes;

import DBAuthentication.DBConnection;
import EmailService.EmailUtility;

import javax.mail.MessagingException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.UUID;

public class ForgotPasswordService {

    public String generatePasswordResetToken(String email) throws SQLException {
        try (Connection conn = DBConnection.getConnection()) {

            PreparedStatement stmt = conn.prepareStatement("SELECT id FROM users WHERE email = ?");
            stmt.setString(1, email);
            ResultSet rs = stmt.executeQuery();

            if (rs.next()) {
                long userId = rs.getLong("id");
                String token = UUID.randomUUID().toString();

                // insert or update token in password-reset table
                String upsertQuery = "INSERT INTO password_reset (user_id, email, reset_token, token_expiry) " +
                        "VALUES (?, ?, ?, NOW() + INTERVAL 30 MINUTE) " +
                        "ON DUPLICATE KEY UPDATE reset_token = VALUES(reset_token), token_expiry = VALUES(token_expiry)";
                PreparedStatement upsertStmt = conn.prepareStatement(upsertQuery);
                upsertStmt.setLong(1, userId);
                upsertStmt.setString(2, email);
                upsertStmt.setString(3, token);
                upsertStmt.executeUpdate();

                return token;
            }
        }
        return null;
    }

    public boolean sendPasswordResetEmail(String email, String token) {
        String resetLink = "http://localhost:8080/SpeakO/reset-password.html?token=" + token;
        String emailContent = "Click the link to reset your password: " + resetLink;

        try {
            EmailUtility.sendEmail(email, "Password Reset Request", emailContent);
            return true;
        } catch (MessagingException e) {
            e.printStackTrace();
            return false;
        }
    }
}
