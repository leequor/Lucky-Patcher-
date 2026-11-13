# Sprint 2 Test Plan: Per-Right Permission Tests (S2-TST-04)

This document defines the test cases and pass/fail criteria for verifying Role-Based Access Control (RBAC) and per-action permissions across **Customer** and **Product** modules (Add, Edit, Delete, and Price Rights)[cite: 1].

---

## Test Prerequisites & Methodology
- **Test Accounts:** Prepare test accounts representing distinct permission levels (e.g., *Admin/Full Access*, *Standard Staff/Limited Rights*, and *Read-Only/No Rights*).
- **Two-Layer Verification:** Each permission must be tested at both the **UI layer** (menus, buttons, and input fields) and the **Server/API layer** (direct URL navigation or HTTP requests) to ensure unauthorized actions cannot be bypassed[cite: 1].

---

## 1. Permission Matrix (Reference)

Use this matrix to track execution results per right across roles[cite: 1]:

| Module | Permission Right | Full Access Role | Limited Role | Read-Only Role | Status (Pass/Fail) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Customer** | Add Customer | Allowed | Denied | Denied | [ ] |
| **Customer** | Edit Customer | Allowed | Allowed | Denied | [ ] |
| **Customer** | Delete Customer | Allowed | Denied | Denied | [ ] |
| **Product** | Add Product | Allowed | Denied | Denied | [ ] |
| **Product** | Edit Product (Details) | Allowed | Allowed | Denied | [ ] |
| **Product** | Edit Product Price | Allowed | Denied | Denied | [ ] |
| **Product** | Delete Product | Allowed | Denied | Denied | [ ] |

*(Note: Adjust the "Allowed/Denied" baseline above to match your specific project role definitions before running the tests.)*

---

## 2. Customer Module Permissions

### Test Case 2.1: Customer Add Permission (UI & Server)
- **Action:** 
  1. Log in as a user **with** the *Add Customer* right and attempt to create a new customer record.
  2. Log in as a user **without** the *Add Customer* right, inspect the Customer screen, and attempt to access the "Add Customer" URL or send a `POST` request directly.
- **Pass Criteria:** 
  * Authorized user sees the "Add Customer" button/menu and successfully saves a new record[cite: 1].
  * Unauthorized user does not see the "Add Customer" button in the UI[cite: 1].
  * Direct URL/API attempts by the unauthorized user are rejected (e.g., `403 Forbidden` or redirected with an "Access Denied" message) and no record is added to the database[cite: 1].
- **Fail Criteria:** Unauthorized user sees the add button, can open the creation form via direct URL, or successfully inserts a customer record into the database[cite: 1].

---

### Test Case 2.2: Customer Edit Permission (UI & Server)
- **Action:** 
  1. Log in as a user **with** the *Edit Customer* right and modify an existing customer's details.
  2. Log in as a user **without** the *Edit Customer* right, view an existing customer, and attempt to access the edit URL or submit a `PUT/PATCH` request directly.
- **Pass Criteria:** 
  * Authorized user can open the edit form and save changes.
  * Unauthorized user sees fields as read-only (or the "Edit" button is hidden)[cite: 1].
  * Direct URL/API edit attempts are blocked by the server without modifying database values[cite: 1].
- **Fail Criteria:** Unauthorized user can edit fields or bypass UI restrictions via direct URL/API calls[cite: 1].

---

### Test Case 2.3: Customer Delete Permission (UI & Server)
- **Action:** 
  1. Log in as a user **with** the *Delete Customer* right and delete a test customer record.
  2. Log in as a user **without** the *Delete Customer* right, inspect the customer list/details, and send a direct `DELETE` request or trigger the delete endpoint.
- **Pass Criteria:** 
  * Authorized user sees the "Delete" option and can remove the record.
  * Unauthorized user does not see any delete controls[cite: 1].
  * Server rejects unauthorized delete requests with an authorization error and preserves the record[cite: 1].
- **Fail Criteria:** Delete button is visible to unauthorized roles, or a direct API/URL call deletes the customer[cite: 1].

---

## 3. Product Module Permissions

### Test Case 3.1: Product Add, Edit, and Delete Permissions (UI & Server)
- **Action:** 
  1. Test **Add**, **Edit**, and **Delete** product actions using a role **with** the respective rights.
  2. Repeat the checks using a role **without** those rights, verifying both screen elements and direct URL/API endpoints[cite: 1].
- **Pass Criteria:** 
  * Menus and action buttons dynamically reflect the logged-in user's assigned rights[cite: 1].
  * All unauthorized direct URL visits or `POST`/`PUT`/`DELETE` API calls return an access error (`403 Forbidden` or redirect) and leave product data unchanged[cite: 1].
- **Fail Criteria:** UI controls appear for restricted users, or server endpoints process unauthorized product modifications[cite: 1].

---

### Test Case 3.2: Product Price Right Enforcement (Field-Level Control)
- **Action:** 
  1. Log in as a user who has *Edit Product* rights **but lacks** *Edit Price* rights, open a product edit screen, and inspect the Price field.
  2. Attempt to modify the price value via browser DevTools (enabling a disabled input) or by sending a direct `PUT/PATCH` payload containing a modified `price` field.
- **Pass Criteria:** 
  * In the UI, the Price input field is either hidden or disabled/read-only while other permitted product fields remain editable[cite: 1].
  * On the server, any modified `price` value submitted by a user without *Price Rights* is rejected or ignored, keeping the original price intact[cite: 1].
- **Fail Criteria:** User without *Price Rights* can edit the price field in the UI, or successfully updates the product price by tampering with the form/API request[cite: 1].
