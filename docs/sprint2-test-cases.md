# Test Cases: Customer Module (S2-TST-01)

**Plan ID:** S2-TST-01  
**Module:** Customer Module  
**Scope:** Functional deployment verification (List, Search, Filter, Add, Edit, Validation Errors, Duplicate Code)  

---

## 1. Customer List & Navigation
| Test Case ID | Scenario / Description | Pre-conditions | Test Steps | Expected Result | Pass/Fail |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-CUS-01** | Verify customer list loads successfully on deployment | User is logged in with valid credentials | 1. Navigate to the main dashboard.<br>2. Click on the "Customers" menu item. | Customer list page loads successfully, displaying existing customer records in a table/grid. | [ ] Pass / [ ] Fail |

## 2. Search & Filtering
| Test Case ID | Scenario / Description | Pre-conditions | Test Steps | Expected Result | Pass/Fail |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-CUS-02** | Search for an existing customer by name/code | Customer records exist in the system | 1. Navigate to the Customer module.<br>2. Enter a valid customer name or code in the search bar.<br>3. Press Enter or click Search. | The list updates to display only records matching the search query. | [ ] Pass / [ ] Fail |
| **TC-CUS-03** | Filter customer list by status or category | Customer records with varied statuses exist | 1. Navigate to the Customer module.<br>2. Select a specific filter option (e.g., Active/Inactive).<br>3. Apply the filter. | The list displays only the records matching the selected filter criteria. | [ ] Pass / [ ] Fail |

## 3. Add Customer
| Test Case ID | Scenario / Description | Pre-conditions | Test Steps | Expected Result | Pass/Fail |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-CUS-04** | Successfully add a new customer with valid data | User is on the Customer module page | 1. Click the "Add Customer" button.<br>2. Fill in all required fields (e.g., Customer Code, Name, Email, Contact) with valid, unique data.<br>3. Click "Save" or "Submit". | Customer is successfully created, a success message appears, and the new customer is visible in the list. | [ ] Pass / [ ] Fail |
| **TC-CUS-05** | Trigger validation errors on missing required fields | User is on the "Add Customer" form | 1. Leave mandatory fields (Name, Customer Code) blank.<br>2. Click "Save" or "Submit". | Form submission is blocked, and clear inline validation error messages are displayed for the required fields. | [ ] Pass / [ ] Fail |
| **TC-CUS-06** | Handle duplicate customer code error | A customer with Code "CUST-001" already exists | 1. Click "Add Customer".<br>2. Enter "CUST-001" into the Customer Code field along with other valid details.<br>3. Click "Save". | System blocks creation and displays a duplicate code error message indicating the code already exists. | [ ] Pass / [ ] Fail |

## 4. Edit Customer
| Test Case ID | Scenario / Description | Pre-conditions | Test Steps | Expected Result | Pass/Fail |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-CUS-07** | Successfully update existing customer details | At least one customer record exists | 1. Select a customer from the list and click "Edit".<br>2. Modify editable fields (e.g., Phone Number, Address).<br>3. Click "Save Changes". | Customer details are updated successfully, changes are reflected in the view, and a success message appears. | [ ] Pass / [ ] Fail |
| **TC-CUS-08** | Edit validation error handling | User is editing an existing customer | 1. Clear out a mandatory field (e.g., Customer Name).<br>2. Click "Save Changes". | Update is prevented, and validation errors are shown prompting for required data. | [ ] Pass / [ ] Fail |
