# Campus Notifications Microservice

## Stage 1: REST API Design, Contract, and Structure

This document outlines the API design contract and data models for the Campus Notification System. The platform delivers real-time updates regarding Placements, Events, and Results to authenticated students.

---

### 1. Data Contract Schema (JSON)

#### A. Notification Object Schema
```json
{
  "id": "string (UUIDv4)",
  "type": "string (Placement | Event | Result)",
  "title": "string",
  "message": "string",
  "targetAudience": {
    "branches": ["string (e.g., CSE, ECE)"],
    "batchYear": "number (e.g., 2026)"
  },
  "isRead": "boolean",
  "createdAt": "string (ISO 8601 Timestamp)"
}
## Stage 2: Persistent Storage and Relational Schema Design

### 1. Persistent Storage Selection
We choose a **Relational Database Management System (RDBMS)**, specifically **PostgreSQL**, to back this microservice. 

* **Justification:** The campus environment demands strong ACID compliance for matching placement eligibility matrices. Complex structural relations—such as tracking unique read receipts individually for thousands of students across shared global broadcast channels—require relational joins and indexes to ensure reliable indexing and prevent duplicate updates.

### 2. Database Physical Schema Layout

#### A. `students` Table
| Column Name | Data Type | Constraints |
| :--- | :--- | :--- |
| `student_id` | `VARCHAR(50)` | `PRIMARY KEY` |
| `name` | `VARCHAR(100)` | `NOT NULL` |
| `email` | `VARCHAR(100)` | `UNIQUE, NOT NULL` |
| `branch` | `VARCHAR(10)` | `NOT NULL` |
| `batch_year` | `INT` | `NOT NULL` |

#### B. `notifications` Table
| Column Name | Data Type | Constraints |
| :--- | :--- | :--- |
| `notification_id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` |
| `type` | `VARCHAR(20)` | `NOT NULL (Check: Placement, Event, Result)` |
| `title` | `VARCHAR(250)` | `NOT NULL` |
| `message` | `TEXT` | `NOT NULL` |
| `target_branch` | `VARCHAR(10)` | `NULL` |
| `target_year` | `INT` | `NULL` |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` |

#### C. `notification_receipts` Table
| Column Name | Data Type | Constraints |
| :--- | :--- | :--- |
| `receipt_id` | `BIGSERIAL` | `PRIMARY KEY` |
| `student_id` | `VARCHAR(50)` | `FOREIGN KEY REFERENCES students(student_id)` |
| `notification_id` | `UUID` | `FOREIGN KEY REFERENCES notifications(notification_id) ON DELETE CASCADE` |
| `is_read` | `BOOLEAN` | `DEFAULT FALSE` |
| `read_at` | `TIMESTAMP` | `NULL` |

---

### 3. DDL Initialization Scripts

```sql
CREATE TABLE students (
    student_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    branch VARCHAR(10) NOT NULL,
    batch_year INT NOT NULL
);

CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('Placement', 'Event', 'Result')),
    title VARCHAR(250) NOT NULL,
    message TEXT NOT NULL,
    target_branch VARCHAR(10),
    target_year INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notification_receipts (
    receipt_id BIGSERIAL PRIMARY KEY,
    student_id VARCHAR(50) REFERENCES students(student_id),
    notification_id UUID REFERENCES notifications(notification_id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    CONSTRAINT unique_student_notification UNIQUE (student_id, notification_id)
);