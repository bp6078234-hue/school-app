/**
 * Google Apps Script for GHSS Ahamdpur, Khaigaon Admission Form Sync
 * 
 * Instructions for School Admin:
 * 1. Open Google Sheets (https://sheets.google.com) and create a new spreadsheet.
 * 2. Rename sheet tab to "Admissions 2026-27".
 * 3. Click Extensions > Apps Script.
 * 4. Paste this complete code and click Save (Floppy icon).
 * 5. Click Deploy > New Deployment.
 * 6. Select Type: "Web App".
 * 7. Set "Execute as: Me" and "Who has access: Anyone".
 * 8. Click Deploy and copy the Web App URL.
 * 9. Set the URL as GOOGLE_SHEETS_WEBAPP_URL in your server environment settings.
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // If sheet is empty, create header row
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp",
        "Application ID",
        "Session",
        "Class",
        "Stream",
        "Student Name (Hindi)",
        "Student Name (English)",
        "Father's Name",
        "Mother's Name",
        "Gender",
        "Category",
        "Mobile Number",
        "Village",
        "District",
        "Status"
      ]);
      // Format header row bold with background
      sheet.getRange(1, 1, 1, 15).setFontWeight("bold").setBackground("#e0f2fe");
    }

    // Append minimal administrative data (Zero sensitive PII/Bank details)
    sheet.appendRow([
      new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      data.applicationId || "N/A",
      data.session || "2026 - 2027",
      data.class || "",
      data.stream || "General",
      data.studentNameHindi || "",
      data.studentNameEnglish || "",
      data.fatherNameEnglish || "",
      data.motherNameEnglish || "",
      data.gender || "",
      data.category || "",
      data.mobile || "",
      data.village || "",
      data.district || "Khandwa",
      data.status || "Submitted"
    ]);

    return ContentService.createTextOutput(
      JSON.stringify({ result: "success", applicationId: data.applicationId })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ result: "error", error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
