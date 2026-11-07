# Register and Login Test Cases (S1-TST-02)

This file contains detailed test cases with steps and expected results covering both positive (good) and negative (bad) inputs.

---

## 1. User Registration (Register)

### Test Case REG-01: Successful Registration (Good Input)
* **Description:** Verify that a user can successfully create an account with valid information.
* **Steps:**
  1. Navigate to the Registration page.
  2. Enter a unique, valid email address (e.g., `student@example.com`).
  3. Enter a valid password and re-enter the exact same password in the confirmation field.
  4. Click the "Submit" or "Register" button.
* **Expected Result:** The account is created successfully. The user is either redirected to the login/dashboard screen or shown a clear success message.

---

### Test Case REG-02: Duplicate Email (Bad Input)
* **Description:** Verify that the system blocks registration if the email address is already in use.
* **Steps:**
  1. Navigate to the Registration page.
  2. Enter an email address that has already been registered in the system.
  3. Fill out the password fields.
  4. Click the "Submit" or "Register" button.
* **Expected Result:** Registration is blocked. An error message appears stating that the email is already registered.

---

### Test Case REG-03: Empty Required Fields (Bad Input)
* **Description:** Verify that the system prevents submission when required information is missing.
* **Steps:**
  1. Navigate to the Registration page.
  2. Leave one or all required fields (Email, Password) blank.
  3. Click the "Submit" or "Register" button.
* **Expected Result:** Registration is blocked. Form validation tags or error messages appear next to the empty fields indicating they are required.

---

## 2. User Authentication (Login)

### Test Case LOG-01: Successful Login (Good Input)
* **Description:** Verify that a registered user can log into their account with valid credentials.
* **Steps:**
  1. Navigate to the Login page.
  2. Enter the valid registered email and the correct password.
  3. Click the "Login" button.
* **Expected Result:** Access is granted. The user is redirected to the main application dashboard or home page, and a secure session is initiated.

---

### Test Case LOG-02: Invalid Password (Bad Input)
* **Description:** Verify that the system denies access if an incorrect password is provided.
* **Steps:**
  1. Navigate to the Login page.
  2. Enter a valid registered email.
  3. Enter an incorrect password.
  4. Click the "Login" button.
* **Expected Result:** Access is denied. The user remains on the login page and receives an error message (e.g., *"Invalid email or password"*).

---

### Test Case LOG-03: Empty Login Fields (Bad Input)
* **Description:** Verify that the system handles empty login credentials gracefully without breaking.
* **Steps:**
  1. Navigate to the Login page.
  2. Leave the email, password, or both fields blank.
  3. Click the "Login" button.
* **Expected Result:** The application prevents the submission or rejects it safely, showing inline validation messages indicating fields cannot be empty.

---

### Test Case LOG-04: Successful Logout
* **Description:** Verify that a signed-in user can end their session.
* **Steps:**
  1. Sign in with a registered account.
  2. Click "Sign out" on the landing page.
* **Expected Result:** The Supabase Auth session is cleared and the user is returned to the login page.

---

### Test Case LOG-05: Password Is Not Stored as Plain Text
* **Description:** Verify that the application does not store a user's password.
* **Steps:**
  1. Sign in with a registered account.
  2. Inspect application storage and the browser page after submission.
* **Expected Result:** The password is sent to Supabase Auth over the configured connection and is not stored in application storage or displayed as plain text.

---

## 3. Password Reset

### Test Case RST-00: Request Reset Email
* **Description:** Verify that a user can request a password reset link using their email.
* **Steps:**
  1. Navigate to the Login page and choose "Forgot password?"
  2. Enter an email address and submit the form.
* **Expected Result:** A confirmation message is displayed without revealing whether the email is registered. If the account exists, Supabase sends a reset link that returns to `/reset-password`.

---

### Test Case RST-01: Valid Reset Link (Good Input)
* **Description:** Verify that a user can successfully update their password using a valid, active reset link.
* **Steps:**
  1. Click on a valid, unexpired password reset link from the verification email.
  2. Enter a new valid password in the password field.
  3. Re-enter the exact same password in the confirmation field.
  4. Click the "Reset Password" button.
* **Expected Result:** The password is successfully updated. The system shows a confirmation message and redirects the user to the login screen.

---

### Test Case RST-02: Expired Reset Link (Bad Input)
* **Description:** Verify that the system blocks password updates if the link has exceeded its expiration window.
* **Steps:**
  1. Click on a password reset link that has passed its expiration time limit.
  2. Observe the page state before entering details.
* **Expected Result:** The system blocks input or refuses submission. A clear error message is displayed stating that the reset link has expired, prompting the user to request a new one.

---

### Test Case RST-03: Already-Used Reset Link (Bad Input)
* **Description:** Verify that a password reset link becomes invalid immediately after it has been used once.
* **Steps:**
  1. Click on a password reset link that was already successfully used to change a password.
  2. Observe the page state.
* **Expected Result:** The link is rejected. An error message appears stating that the link is no longer valid or has already been used.

---

## 4. Main Landing Page

### Test Case LND-01: Landing Page - Logged Out (Public View)
* **Description:** Verify the content and navigation options available to anonymous visitors.
* **Steps:**
  1. Ensure no user session is active (logged out).
  2. Navigate to the main application root URL / landing page.
  3. Verify visible layout components and navigation bars.
* **Expected Result:** The public landing page loads properly. Marketing content, "Login", and "Register" buttons are clearly visible. Dashboard or account-specific routes are not displayed.

---

### Test Case LND-02: Landing Page - Logged In (Authenticated View)
* **Description:** Verify how the landing page behaves or adapts when a user accesses it with an active session.
* **Steps:**
  1. Log into the application successfully to establish a valid session.
  2. Navigate back to the main root URL / landing page.
  3. Check navigation bars and core visibility headers.
* **Expected Result:** The page reflects an authenticated state. The "Login" and "Register" buttons are hidden or replaced by a profile dropdown, "Go to Dashboard" button, or a "Log Out" option.
