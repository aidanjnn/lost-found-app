# Use Cases: UW Campus Lost-and-Found Platform

## Use Case 1: View Public Lost Items List

**Primary Actor:** Student

**Stakeholders & Interests:**

* **Student:** Wants a single, public list of lost items to avoid checking multiple locations.
* **Staff:** Wants items to be visible so they can be claimed.

**Preconditions:**

* Lost items exist in the system.

**Postconditions:**

* Student sees the centralized list.

**Trigger:**

* Student visits the lost-and-found platform.

**Main Success Scenario:**

1. Student opens the platform.
2. System displays the complete list of lost items.
3. Student browses or scrolls through the list.

**Extensions:**

* 2a. No items exist → System shows an empty-state message.

**Special Requirements:**

* The list must include items from all campus locations.

---

## Use Case 2: Search Lost Items by Description

**Primary Actor:** Student

**Stakeholders & Interests:**

* **Student:** Wants text descriptions to filter/search efficiently.

**Preconditions:**

* Items include searchable text descriptions.

**Postconditions:**

* Student gets a filtered subset of matching items.

**Trigger:**

* Student enters search terms.

**Main Success Scenario:**

1. Student opens the search bar or filter UI.
2. Student enters text describing the lost item.
3. System returns matching items.
4. Student inspects results.

**Extensions:**

* 3a. No results match → System shows “no results found.”

**Special Requirements:**

* Search must be fast enough for real-time use.

---

## Use Case 3: Secure Claim Handling

**Primary Actor:** Student

**Stakeholders & Interests:**

* **Student:** Wants their items protected so random people can’t falsely claim them.
* **Staff:** Must verify claims.

**Preconditions:**

* Students must authenticate.

**Postconditions:**

* Claim request logged and routed to staff for verification.

**Trigger:**

* Student attempts to claim an item.

**Main Success Scenario:**

1. System requires student identity authentication.
2. Student views item claim location on the platform.
3. Student visits item claim location and leaves their WatIAM identity in case of a dispute.
4. Staff records the claimer's identity and associates it with the item.

---

## Use Case 4: Post a New Lost Item

**Primary Actor:** Lost-and-found staff member

**Stakeholders & Interests:**

* **Staff:** Wants posting to be fast and simple.
* **Students:** Want timely visibility of new items.

**Preconditions:**

* Staff is authenticated.

**Postconditions:**

* New item is stored and appears in the public list.

**Trigger:**

* Staff submits a posting form.

**Main Success Scenario:**

1. Staff accesses the item submission page.
2. Staff enters item details (text description, location, timestamp, optional photos).
3. Staff submits the form.
4. System saves the item and updates the public list.

**Extensions:**

* 2a. Missing required fields → System requests completion.
* 3a. Network/database error → System shows failure and retries.

**Special Requirements:**

* Posting workflow must minimize steps and data entry time.

