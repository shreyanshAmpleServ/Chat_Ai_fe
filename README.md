# DCC Enterprise Aiva AI Assistant

## Hero (Header)

**Title:** DCC Enterprise AI Assistant  
**Subtitle:** Ask in plain English. Get instant insights from SAP Business One.  
**Tagline:** Ask. Analyze. Act.

**Supporting line:** Turn natural-language questions into accurate answers, charts, and SQL—without digging through reports.

**Primary CTA:** Start a conversation  
**Secondary CTA:** See sample questions

---

## Empty State (First-run / No messages)

**Headline:** Enterprise intelligence at your fingertips  
**Body:** Ask about sales, invoices, customers, items, or trends—your assistant will analyze live data and respond with clear answers, tables, and visuals.

**Quick categories**

- Sales Analytics — Revenue, trends, top customers
- Invoices & Receivables — Overdues, aging, average invoice value
- Orders & Fulfillment — Open orders, pending deliveries, cancellations
- Items & Inventory — Top items, item-wise sales, customer item history
- Comparisons & Trends — Month-over-month, quarter-over-quarter

**Suggested prompt chips (click-to-send)**

- Show me all sales orders created this month.
- List all sales invoices for customer ABC Traders.
- Get the total sales amount for today.
- Show all open sales quotations.
- Which invoices are overdue as of today?
- Show top 5 customers by sales value in the last quarter.
- List all sales orders pending delivery.
- Show sales invoices between 1st and 15th September.
- Get all canceled sales orders.
- Show total sales per sales employee for the current year.
- Show total quantity sold of item `P1001` last month.
- Which items had the highest sales in October?
- List all items sold to customer 'ABC Traders' in the last quarter.
- What are the top 10 most sold items this year?
- Show item-wise total sales amount this week.
- What is the total revenue generated this year?
- Compare total sales between Q1 and Q2.
- What’s the average invoice value for October?
- How many invoices were issued last week?
- Show sales growth percentage month by month.
- Show all customers with no sales in the last 3 months.
- Get the total outstanding invoices per customer.
- Which customers purchased item `A2002`?
- Show sales trend by month for customer 'Acme Corporation'.
- Get total sales by customer group.

---

## Composer Placeholder (input hints)

- "Ask about your business data… e.g., 'Show me all sales orders created this month'"
- "Try: 'Top 5 customers by sales value in the last quarter'"
- "You can be specific: 'Invoices between 01-09-2025 and 15-09-2025'"

---

## Assistant “Thinking” / Loading Text

- Analyzing your query…
- Fetching sales data…
- Generating SQL and validating results…
- Formatting your answer…

---

## Result Framing (shown above the answer, optional)

- **Summary:** Here’s what I found based on your filters.
- **Data scope:** Source: SAP Business One | Company: DCC | Period: Current Month
- **Next actions:** Export, Filter, Visualize, Save as Report

---

## Follow-up Suggestions (dynamic buttons under each answer)

- Change date range
- Add customer filter
- Show as chart
- Show item-wise breakdown
- Export to Excel
- Save as dashboard tile

---

## Sidebar / Help Panel

**Title:** Ask better questions, get sharper answers

**Tips**

- Include date ranges: “this month”, “last quarter”, or “between 01-09-2025 and 15-09-2025”
- Specify entities: customer (“ABC Traders”), item code (`P1001`), sales employee
- Ask for formats: “table”, “chart”, “summary only”
- Combine filters: “Top 5 customers by value in Q2 for customer group Retail”
- Compare periods: “Compare total sales Q1 vs Q2”

**Examples you can copy-paste**

- Which invoices are overdue as of today?
- Show item-wise total sales amount this week.
- Show sales growth percentage month by month.
- Get the total outstanding invoices per customer.

---

## Microcopy for Controls

- Button: Ask
- Button: Visualize
- Button: Export CSV
- Button: Copy SQL
- Button: Save Report
- Dropdown: Date range
- Toggle: Include tax
- Empty table state: No records match your filters. Try widening the date range or removing a filter.

---

## Notifications & Toasts

- Saved: Report saved to My Reports.
- Export ready: Your CSV is ready to download.
- Copied: SQL copied to clipboard.
- Refreshed: Data refreshed successfully.

---

## Error States

- No data found: We couldn’t find matching records for that query. Try a broader date range or remove filters.
- Data access: You don’t have permission to view this dataset. Contact an administrator.
- Timeout: The query took too long. Try narrowing the date range or adding a customer/item filter.
- Parse issue: I couldn’t understand part of that question. Try: “Show sales invoices between 01-09-2025 and 15-09-2025.”

---

## Footer / Compliance

- **Data freshness:** Results reflect the latest synchronized data from SAP Business One.
- **Accuracy note:** Totals may differ from printed forms due to rounding or filter choices.
- **Privacy:** Only authorized users can access company data. Actions are logged for audit.

---

## Short Descriptions for Stores / About Screen

**One-liner:**  
DCC Enterprise AI Assistant lets your team ask natural-language questions and instantly explore SAP Business One data—no report building required.

**Feature bullets**

- Natural-language Q&A for sales, invoices, orders, customers, and items
- Smart filters: date ranges, customers, items, sales employees, groups
- Tables, summaries, and charts with one click
- Auto-generated SQL you can review and export
- Save, share, and schedule reports

---

## Suggested Prompt Library (menu categories)

### Sales & Revenue

- Get the total sales amount for today.
- What is the total revenue generated this year?
- Show sales growth percentage month by month.
- Compare total sales between Q1 and Q2.

### Invoices & AR

- List all sales invoices for customer ABC Traders.
- Which invoices are overdue as of today?
- Show sales invoices between 1st and 15th September.
- What’s the average invoice value for October?
- How many invoices were issued last week?
- Get the total outstanding invoices per customer.

### Orders & Quotations

- Show me all sales orders created this month.
- Show all open sales quotations.
- List all sales orders pending delivery.
- Get all canceled sales orders.

### Customers & Segments

- Show top 5 customers by sales value in the last quarter.
- Show all customers with no sales in the last 3 months.
- Show sales trend by month for customer 'Acme Corporation'.
- Get total sales by customer group.

### Items & Product Mix

- Show total quantity sold of item `P1001` last month.
- Which items had the highest sales in October?
- List all items sold to customer 'ABC Traders' in the last quarter.
- What are the top 10 most sold items this year?
- Show item-wise total sales amount this week.
- Which customers purchased item `A2002`?

---

## Optional “Answer Templates” (tone and format)

**Metric answer (short)**  
Total sales today: ₹1,248,560 across 43 invoices. Want a breakdown by customer or item?

**Table answer (brief intro + table)**  
I found 12 invoices for ABC Traders in this period. Here’s a summary—want PDF links or to export CSV?

**Trend answer (context + suggestion)**  
Sales grew 8.4% MoM in October. Biggest gain: Retail segment (+13%). Compare by customer group?

**Exception answer (overdues)**  
15 invoices overdue as of today (₹972,300). 3 customers account for 72% of the value. Want a reminder or a dunning list?

---

## Notes on corrections and improvements

- Fixed typos and inconsistent punctuation (e.g., "Currect" → "Correct", standardized date formats to `DD-MM-YYYY`).
- Reorganized content into clear headings and short lists for readability.
- Standardized microcopy and control names for consistency across the UI.
- Converted smart examples and prompt chips to code-style for item codes where appropriate (e.g., `P1001`).
- Clarified phrasing in error messages and tips to be actionable and user-friendly.
