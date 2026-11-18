# ROAR EXTREME — Client & Operator Delivery Guide

**System:** ROAR EXTREME Rooftop Fitness Studio Platform  
**Release Version:** v1.0.0 (Production Candidate)  
**Date:** 18 November 2026  
**Audience:** Gym Owners, Receptionists, IT Administrators, Operations Staff  

---

## 1. Executive Summary

ROAR EXTREME is a modern, high-performance web platform built specifically for rooftop fitness studios. It integrates a public visitor experience, automated lead reservation, member management, administrative operations, an AI fitness coach, personalized diet and workout generation, and secure physical turnstile access control.

This delivery package contains the complete technical deliverables, operational runbooks, architectural specifications, security audits, and testing evidence required to operate and maintain the system.

---

## 2. Quick Start for Gym Operators

### 2.1 Front Desk & Receptionist Operations
- **Accessing the Portal**: Open `https://<your-domain>/login` in Chrome, Edge, or Safari.
- **Handling Free Trial Leads**:
  1. Click **Admin Dashboard** in the navigation menu.
  2. Select the **Leads** tab.
  3. Every website visitor who submits the trial form appears immediately with their reference ID (e.g., `ROAR-TRIAL-89412`), goal, slot, and phone number.
  4. Call or WhatsApp the member to confirm their trial session.
  5. Click **Convert to Member** when they decide to join.
- **Manual Member Check-In**:
  1. In the **Members** tab, search for the member by name or phone.
  2. Click **Record Attendance** to grant manual entry if a member forgets their device.

### 2.2 Gym Owner Operations
- **Reviewing Studio Analytics**:
  - The dashboard displays real-time active members, daily visits, lead conversion rates, and revenue metrics.
- **Member Management**:
  - Add, edit, renew, or pause memberships.
  - Review attendance logs and peak hour utilization to optimize staffing on the rooftop.
- **Emergency Turnstile Override**:
  - If the turnstile gate fails to open, use the **Physical Break-Glass Release** located directly beside the gate. No software command is needed in an emergency.

---

## 3. System Navigation & Documentation Index

All technical and operational documentation is linked below using relative project paths:

| Document | Purpose |
| :--- | :--- |
| [System Architecture](./ARCHITECTURE.md) | High-level system design, data flows, and comprehensive API route table. |
| [Environment Reference](./ENV_REFERENCE.md) | Exhaustive breakdown of all `.env` configuration flags, security keys, and defaults. |
| [Production Readiness Matrix](./READINESS_MATRIX.md) | Honest assessment of all 14 project subsystems using `PROVEN`, `PARTIAL`, and `BLOCKED` labels. |
| [Security & Capacity Plan](./SECURITY_AND_CAPACITY_PLAN.md) | Security audit findings, server capacity limits, INR cost models, and cost-reduction plans. |
| [UAT Acceptance Script](./UAT_ACCEPTANCE_SCRIPT.md) | Step-by-step verification script for client acceptance, account handoff, and support boundaries. |
| [Evidence Index](./EVIDENCE_INDEX.md) | Index of raw test logs, benchmark outputs, and verification reports. |
| [Final Production Verdict](./FINAL_VERDICT.md) | Authoritative verdict for staging handoff vs. public live launch. |

---

## 4. Operational Runbooks & Safety

For detailed procedures on deploying updates, rolling back, rotating cryptographic keys, or handling incidents, refer to:
- [Operations & Incident Runbooks](../OPERATIONS_RUNBOOKS.md)
- [Hardware Commissioning & DPDP Legal Pack](../HARDWARE_AND_LEGAL_PACK.md)
- [Security Proof & Hardening Report](../SECURITY_PROOF.md)
