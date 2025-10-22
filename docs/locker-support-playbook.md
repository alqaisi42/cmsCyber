# Locker Support Command Center

<a id="locker-support-playbook"></a>

The **Support & Incident Response** tab inside the locker management dashboard centralises every workflow described in the CMS locker subscription integration guide.

## Navigation & Access
- Use the new **Locker Support** item in the navigation drawer to open the dashboard directly in the Support tab.
- The dashboard can also be reached from `/dashboard/lockers` by switching to the "Support & Issues" tab.
- All actions surface non-blocking toast notifications for success, warning, or error outcomes so agents receive immediate feedback.

## Live Incident Queue
- Filter tickets by **status** or **priority** to focus on the right subset of work.
- Update ticket status or assignment without leaving the list—changes are optimistically applied and synced once the API responds.
- Timeline excerpts help agents reference acknowledgements, escalations, and resolution notes directly next to the ticket context.

## Task Runway
- View all operational tasks in one board with quick filters for *Due today*, *Overdue*, or *Completed*.
- Change task status, snooze due dates, or log brand new follow-up items. Every mutation raises a toast to confirm the outcome.
- Link a task back to a ticket so engineering, operations, and support stay aligned on the same escalation.

## Location Issue Digest
- Scan a digest of locker locations with active issues, escalations, and trend direction.
- Use this digest to align preventive maintenance with the availability, usage, and subscription data documented in the API implementation guide.

## Next-Action Radar
- Highlight the next ticket breaching its SLA with a single-click "Acknowledge" shortcut.
- This emphasises the flows in the API guide around escalation, invitation management, and conflict resolution.

## Toast Feedback Matrix
| Scenario | Toast Type | Example Message |
| --- | --- | --- |
| Ticket status change succeeds | Success | "Ticket updated" |
| Assignment stored offline | Warning | "Assignment pending sync" |
| API unreachable | Error | "Unable to load locker support" |
| Availability fallback data | Warning | "Support insights limited" |
| Task created | Success | "Task created" |

## Operational Checklist
1. Refresh the Support tab at the start of each shift (button in the header).
2. Filter down to **High** or **Critical** incidents first and assign an owner.
3. Acknowledge tickets with upcoming `nextActionDueAt` timestamps.
4. Use the task runway to ensure every escalated ticket has a follow-up task and owner.
5. Review the location digest to proactively inform subscription owners or maintenance crews.

Keeping these steps aligned with the comprehensive API flow ensures the CMS delivers a reliable locker experience for admins, owners, and shared users alike.
