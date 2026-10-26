# Register and Login Test Cases (S1-TST-02)

This file contains detailed test cases with steps and expected results covering both positive (good) and negative (bad) inputs.

---

## 1. User Registration (Register)

### Test Case REG-01: Successful Registration (Good Input)
*   **Description:** Verify that a user can successfully create an account with valid information.
*   **Steps:**
    1. Navigate to the Registration page.
    2. Enter a unique, valid email address (e.g., `student@example.com`).
    3. Enter a unique username (e.g., `testuser123`).
    4. Enter a valid password and re-enter the exact same password in the confirmation field.
    5. Click the "Submit" or "Register" button.
*   **Expected Result:** The account is created successfully. The user is either redirected to the login/dashboard screen or shown a clear success message.

### Test Case REG-02: Duplicate Email (Bad Input)
*   **Description:** Verify that the system blocks registration if the email address is already in use.
*   **Steps:**
    1. Navigate to the Registration page.
    2. Enter an email address that has already been registered in the system.
    3. Fill out the username and matching valid passwords.
    4. Click the "Submit" or "Register" button.
*   **Expected Result:** Registration is blocked. An error message appears stating that the email is already registered.

### Test Case REG-03: Empty Required Fields (Bad Input)
*   **Description:** Verify that the system prevents submission when required information is missing.
*   **Steps:**
    1. Navigate to the Registration page.
    2. Leave one or all required fields (Email, Username, Password) blank.
    3. Click the "Submit" or "Register" button.
*   **Expected Result:** Registration is blocked. Form validation tags or error messages appear next to the empty fields indicating they are required.

---

## 2. User Authentication (Login)

### Test Case LOG-01: Successful Login (Good Input)
*   **Description:** Verify that a registered user can log into their account with valid credentials.
*   **Steps:**
    1. Navigate to the Login page.
    2. Enter the valid registered email (or username) and the correct password.
    3. Click the "Login" button.
*   **Expected Result:** Access is granted. The user is redirected to the main application dashboard or home page, and a secure session is initiated.

### Test Case LOG-02: Invalid Password (Bad Input)
*   **Description:** Verify that the system denies access if an incorrect password is provided.
*   **Steps:**
    1. Navigate to the Login page.
    2. Enter a valid registered email or username.
    3. Enter an incorrect password.
    4. Click the "Login" button.
*   **Expected Result:** Access is denied. The user remains on the login page and receives an error message (e.g., *"Invalid email or password"*).

### Test Case LOG-03: Empty Login Fields (Bad Input)
*   **Description:** Verify that the system handles empty login credentials gracefully without breaking.
*   **Steps:**
    1. Navigate to the Login page.
    2. Leave the email, password, or both fields blank.
    3. Click the "Login" button.
*   **Expected Result:** The application prevents the submission or rejects it safely, showing inline validation messages indicating fields cannot be empty.
