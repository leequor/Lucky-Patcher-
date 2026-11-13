# Customer Module Test Cases (S2-TST-01)

This file contains detailed test cases with steps, expected results, and proper testing methodologies (Equivalence Partitioning, Boundary Value Analysis, and Positive/Negative testing) covering the Customer module[cite: 3].

---

## Test Execution Summary (Pass/Fail Tracking)

| Test ID | Test Case Name | Methodology | Status (Pass/Fail) | Notes |
| :--- | :--- | :--- | :---: | :--- |
| **CST-01** | Successful Customer List Loading | Positive Testing | [ ] | |
| **CST-02** | Empty Customer List State | Boundary / Edge Case | [ ] | |
| **CST-03** | Valid Customer Search | Equivalence Partitioning (Valid) | [ ] | |
| **CST-04** | Non-Existent Customer Search | Equivalence Partitioning (Invalid) | [ ] | |
| **CST-05** | Filter Customer Records | State / Filter Testing | [ ] | |
| **CST-06** | Successful Customer Creation | Positive / Boundary Check | [ ] | |
| **CST-07** | Duplicate Customer Code / Email Check | Negative / Unique Constraint | [ ] | |
| **CST-08** | Validation Errors on Required & Invalid Fields | Negative / Boundary Value | [ ] | |
| **CST-09** | Successful Customer Update | Positive Testing | [ ] | |
| **CST-10** | Edit Validation & Duplicate Conflict | Negative / Unique Constraint | [ ] | |

---

## 1. Customer List & View

### Test Case CST-01: Successful Customer List Loading (Positive)
- **Description:** Verify that authenticated users can view the customer directory and list existing records.
- **Preconditions:** User is logged in with valid credentials; at least 3 customer records exist in the database.
- **Steps:**
  1. Navigate to the main application dashboard.
  2. Click on the "Customers" navigation menu link.
  3. Observe the customer table/grid rendering.
- **Expected Result:** The customer page loads successfully without console or server errors. The table displays all customer records with expected columns (e.g., Customer Code, Name, Email, Phone, Status).
- **Status:** `[ ] Pass` / `[ ] Fail`

---

### Test Case CST-02: Empty Customer List State (Boundary/Edge Case)
- **Description:** Verify the system handles a state where zero customer records exist gracefully.
- **Preconditions:** User is logged in; database has 0 customer records.
- **Steps:**
  1. Navigate to the "Customers" page.
  2. Inspect the content area where customer rows would normally appear.
- **Expected Result:** The application does not break or show an infinite loading spinner. Instead, it displays a user-friendly empty state message (e.g., *"No customers found. Click 'Add Customer' to create one."*).
- **Status:** `[ ] Pass` / `[ ] Fail`

---

## 2. Search & Filtering

### Test Case CST-03: Valid Customer Search (Equivalence Partitioning - Valid Input)
- **Description:** Verify that searching for an existing customer by code, name, or email returns accurate matching results.
- **Preconditions:** Customers exist in the database, including one with Customer Code `CUST-001` and Name `Acme Corp`.
- **Steps:**
  1. Navigate to the "Customers" page.
  2. Locate the search input field.
  3. Type `"Acme"` or `"CUST-001"` into the search bar and trigger the search.
- **Expected Result:** The customer table dynamically filters to show only records matching the query string (`Acme Corp`), hiding non-matching entries.
- **Status:** `[ ] Pass` / `[ ] Fail`

---

### Test Case CST-04: Non-Existent Customer Search (Equivalence Partitioning - Invalid Input)
- **Description:** Verify that searching for a term with no database matches handles the query safely.
- **Steps:**
  1. Navigate to the "Customers" page.
  2. Enter a random, non-matching string into the search bar (e.g., `XYZ987Unknown`).
- **Expected Result:** The table updates cleanly to show an empty result set or a helpful message (e.g., *"No matching customers found"*), without crashing the UI.
- **Status:** `[ ] Pass` / `[ ] Fail`

---

### Test Case CST-05: Filter Customer Records (Filter Testing)
- **Description:** Verify that applying status or category filters narrows down the customer list accurately[cite: 3].
- **Preconditions:** Customer records exist with varying statuses/categories (e.g., *Active* and *Inactive*).
- **Steps:**
  1. Navigate to the "Customers" page.
  2. Select a specific filter option from the filter dropdown (e.g., Status = `Active`).
  3. Clear/reset the filter afterward.
- **Expected Result:** Selecting a filter displays only customers matching that criterion. Resetting the filter restores the full customer list.
- **Status:** `[ ] Pass` / `[ ] Fail`

---

## 3. Customer Addition (Add)

### Test Case CST-06: Successful Customer Creation (Positive / Boundary Check)
- **Description:** Verify that a user can successfully add a new customer using valid data within acceptable field boundaries.
- **Steps:**
  1. Navigate to the "Customers" page and click the "Add Customer" button.
  2. Fill out all required fields with valid data:
     - **Customer Code:** `CUST-105` (Unique, within character limits)
     - **Name:** `John Doe` (Valid string, within character limits)
     - **Email:** `johndoe@example.com` (Valid email format)
     - **Phone:** `+63-917-555-0199` (Valid phone format)
  3. Click the "Save" or "Create Customer" button.
- **Expected Result:** The customer is successfully created in the database. The user is redirected back to the customer list, a success message appears, and the new customer is visible in the table.
- **Status:** `[ ] Pass` / `[ ] Fail`

---

### Test Case CST-07: Duplicate Customer Code / Email Check (Negative / Unique Constraint)
- **Description:** Verify that the system prevents the creation of a customer with a duplicate unique identifier (Customer Code or Email)[cite: 3].
- **Preconditions:** A customer with Customer Code `CUST-001` and email `existing@example.com` already exists.
- **Steps:**
  1. Click "Add Customer".
  2. Enter `CUST-001` in the Customer Code field (or `existing@example.com` in the Email field) along with valid details for other fields.
  3. Click "Save".
- **Expected Result:** Form submission is blocked by application/database unique constraints. A clear inline error message appears indicating that the Customer Code or Email is already in use, and no duplicate record is created.
- **Status:** `[ ] Pass` / `[ ] Fail`

---

### Test Case CST-08: Validation Errors on Required & Invalid Fields (Negative / Boundary Value)
- **Description:** Verify that form validation catches empty required fields, malformed emails, and boundary length violations[cite: 3].
- **Steps:**
  1. Click "Add Customer".
  2. Leave required fields (e.g., Customer Code, Name) blank, enter an invalid email format (e.g., `invalid-email`), and input a string exceeding the maximum character limit.
  3. Click "Save".
- **Expected Result:** Submission is prevented. Specific inline validation error messages appear next to each offending field (e.g., *"Customer Code is required"*, *"Invalid email format"*).
- **Status:** `[ ] Pass` / `[ ] Fail`

---

## 4. Customer Editing (Edit)

### Test Case CST-09: Successful Customer Update (Positive)
- **Description:** Verify that an authorized user can modify existing customer details and save changes successfully.
- **Steps:**
  1. Navigate to the customer list and click "Edit" on an existing customer record.
  2. Update the Phone Number or Name to new valid values.
  3. Click "Update" or "Save Changes".
- **Expected Result:** The changes are saved successfully. The UI reflects the updated details immediately, and the database record is updated accurately.
- **Status:** `[ ] Pass` / `[ ] Fail`

---

### Test Case CST-10: Edit Validation & Duplicate Conflict (Negative / Unique Constraint)
- **Description:** Verify that updating a customer with blank required fields or a Customer Code/Email already belonging to another record is blocked.
- **Steps:**
  1. Open an existing customer's edit form.
  2. Clear out a required field OR change the Customer Code to one already assigned to a *different* customer.
  3. Click "Save".
- **Expected Result:** The system blocks the update, preserves the original database record, and displays clear error feedback explaining the validation or duplicate conflict.
- **Status:** `[ ] Pass` / `[ ] Fail`
