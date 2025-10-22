# Locker Support Command Center

<a id="locker-support-playbook"></a>

The **Support & Incident Response** tab now presents a kanban-style workspace that sits directly on top of the production admin locker APIs. Every drag, drop, or detail update is routed through the same endpoints documented for the CMS, with toast notifications giving instant confirmation or warnings whenever a request fails.

## Navigation & Access
- Open **Support & Issues** from the left navigation or visit `/dashboard/locker-support` to jump straight into the workspace.
- The board automatically loads lockers that are flagged `OUT_OF_SERVICE`; use the dropdown to switch to any impacted locker.
- All mutations call the live admin locker APIs and raise success, warning, or error toasts so the operator always knows the server outcome.

## Workspace Overview
- **Kanban board** – Incidents are grouped into **Open**, **In progress**, **Resolved**, and **Closed** columns. Drag cards between columns to update their status through `PATCH /api/v1/admin/lockers/issues/{issueId}`.
- **Issue detail panel** – Selecting a card surfaces assignment, ETA, and notes controls. Saving posts the new values back to the issue update endpoint.
- **Resolve action** – Use the “Resolve & reopen locker” button to call `POST /api/v1/admin/lockers/issues/{issueId}/resolve` with your resolution notes. Successful responses trigger a toast and refresh the column data.
- **Maintenance context** – The right-hand rail shows `GET /api/v1/admin/lockers/{lockerId}/maintenance/history` results so technicians can review the last intervention before scheduling new work.
- **API reference** – The panel lists every endpoint used by the workspace (including `GET /api/v1/admin/lockers?status=OUT_OF_SERVICE` and `GET /api/v1/admin/lockers/{lockerId}/issues`) so administrators know exactly which backend flows are in play.

## Reset & Error Handling
- Use **Reset & reload API data** whenever you need to discard local drag-and-drop ordering and fetch a fresh snapshot from the server.
- If an API returns an error, the board automatically reverts the affected card and surfaces an error toast with the server message.
- When the API is unreachable, the workspace stops issuing optimistic updates, keeping the UI in sync with confirmed server state.

## Daily Operational Checklist
1. Refresh the locker list to confirm today’s out-of-service scope.
2. Drag urgent incidents (HIGH or CRITICAL) into **In progress** and assign a technician with an ETA.
3. Review the maintenance history to coordinate any dependencies or spare parts.
4. Once work is verified on-site, resolve the issue so the locker becomes available again.
5. Keep an eye on toasts—warnings indicate a retry is required, while successes confirm the backend accepted the change.

Staying aligned with these API-driven workflows ensures the CMS delivers a reliable experience for admins, owners, and field teams.
