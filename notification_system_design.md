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