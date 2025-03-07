package Classes;

import Classes.UserDAO;
import EmailService.EmailUtil;
import org.mindrot.jbcrypt.BCrypt;

import java.util.UUID;

public class SignupService {

    private UserDAO userDAO = new UserDAO();

    public boolean registerUser(String name, String email, String password) throws Exception {
        // Validate input
        if (name == null || email == null || password == null || name.isEmpty() || email.isEmpty() || password.isEmpty()) {
            throw new IllegalArgumentException("All fields are required.");
        }

        // Check if email already exists in DB
        if (userDAO.isEmailExists(email)) {
            throw new IllegalArgumentException("Email already registered.");
        }

        // unique user ID
        String userId = String.valueOf(System.nanoTime());

        // Hash the password using BCrypt
        String hashedPassword = BCrypt.hashpw(password, BCrypt.gensalt(12));

        // Save user to DB
        boolean isInserted = userDAO.insertUser(userId, name, email, hashedPassword);

        if (isInserted) {
            // Generate email verification token
            String token = UUID.randomUUID().toString();
            userDAO.insertEmailVerification(userId, email, token);

            // Send verification email
            String verificationLink = "http://localhost:8080/SpeakO/VerifyEmailServlet?token=" + token;
            String subject = "Email Verification";
            String body = "Click the link to verify your email: " + verificationLink;
            EmailUtil.sendEmail(email, subject, body);

            return true;
        } else {
            return false;  // Signup failed
        }
    }
}
