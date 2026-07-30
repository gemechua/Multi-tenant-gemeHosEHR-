# Security Specification for Hospital EHR

## 1. Data Invariants
- A Patient record must be accessible by authorized clinic staff.
- An Appointment record must be linked to a valid Patient ID.

## 2. The "Dirty Dozen" Payloads (Examples)
1. { "name": "Test", "dob": "2000-01-01" } (Missing ID)
2. { "id": "1", "name": "", "dob": "2000-01-01" } (Empty Name)
3. { "id": "1", "name": "Test", "dob": "invalid-date" } (Invalid DOB)
4. { "id": "1", "name": "Test", "dob": "2000-01-01", "ghostField": true } (Ghost Field)

...

## 3. The Test Runner (firestore.rules.test.ts)
...
