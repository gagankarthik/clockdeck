🧾 What This Website Is About

This website is a Payroll & Timesheet Management System designed for small to mid-size businesses (restaurants, retail, property management, service companies, etc.) to:

Track employee clock-in / clock-out

Calculate work hours accurately

Handle overtime automatically

Review, approve, and lock payroll

Generate weekly payroll summaries in real time

It replaces spreadsheets, manual calculations, and error-prone payroll prep with a clean, automated, role-based web app.

🎯 Core Problem It Solves

Businesses struggle with:

Incorrect time calculations

Overtime mistakes

Manual payroll aggregation

Lack of visibility into who is working now

Approval chaos before payroll submission

This website fixes all of that.

🚀 Key Features (What the App Can Do)
1️⃣ Time Tracking (Clock In / Clock Out)

Employees clock in and out per property/location

Supports multiple shifts per day

Handles missing clock-outs safely

2️⃣ Accurate Hours Calculation (Core Strength)

Daily overtime logic

Up to 8 hours/day → Regular

Anything above → Overtime

Handles:

Multiple punches per day

Partial shifts

Overnight safety

Calculates:

Regular hours

Overtime hours

Total (gross) hours

⚙️ All calculations are done server-safe & UI-safe, not fragile spreadsheet math.

3️⃣ Weekly Payroll Dashboard (Default View)

Automatically loads current week (Mon–Sun)

Shows:

Employee name

Property name

Hourly rate

Regular hours

Overtime hours

Total hours

Gross pay (OT × 1.5)

Approval status

4️⃣ Per-Day Hours Breakdown

Expand an employee row to see:

Daily regular hours

Daily overtime hours

Daily gross hours

Makes audits and payroll review transparent

5️⃣ Payroll Approval Workflow

Each time entry has a status:

pending

approved

Payroll shows:

Who is still pending

How many employees are unapproved

Supports:

Inline approval

Bulk approvals

Locked payroll periods

6️⃣ Payroll Locking (Audit Safety)

Once payroll is finalized:

Payroll period can be locked

Editing & approvals are disabled

Admin override available (if enabled)

This prevents:

Accidental changes

Post-submission payroll errors

7️⃣ Multi-Property Support

One business owner can manage:

Multiple properties/locations

Shared employees across properties

Payroll automatically groups and filters by:

Property ownership

Logged-in user

8️⃣ Secure, User-Scoped Data

Uses Supabase authentication + RLS

Each user sees:

Only their employees

Only their properties

Only their payroll data

No cross-account data leaks

9️⃣ Search & Filtering

Search payroll by:

Employee name

Property name

Instantly updates KPIs and totals

🔟 Real-Time Friendly Architecture

Designed to support:

Live clock-ins

Realtime payroll updates

Future websocket / Supabase Realtime extensions

📊 KPIs & Insights

The dashboard provides:

💰 Total payroll cost (current week)

⏱ Total hours worked

⚠ Pending approvals

👥 Active employees

🧠 Who This App Is For

Restaurant owners

Property managers

Retail chains

Staffing agencies

Small HR / payroll teams

Startups that want in-house payroll prep without enterprise software

🧩 Tech Stack (Implicit From Build)

Next.js (App Router)

TypeScript

Supabase (Auth, DB, RLS)

ShadCN UI

Tailwind CSS

Postgres

🏁 In One Sentence (Pitch)

A modern payroll & timesheet web app that automatically calculates regular and overtime hours, provides transparent per-day breakdowns, and lets business owners confidently review, approve, and lock weekly payroll — without spreadsheets or errors