// src/services/email.service.js
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const PdfPrinter = require("@digicole/pdfmake-rtl");
const axios = require("axios");

// ============================
// FONT CONFIGURATION
// ============================
const fonts = {
  Roboto: {
    normal: path.join(__dirname, "../fonts/Roboto-Regular.ttf"),
    bold: path.join(__dirname, "../fonts/Roboto-Bold.ttf"),
    italics: path.join(__dirname, "../fonts/Roboto-Italic.ttf"),
    bolditalics: path.join(__dirname, "../fonts/Roboto-BoldItalic.ttf"),
  },
  Amiri: {  // ✅ Nillima کی جگہ Amiri استعمال کریں
    normal: path.join(__dirname, "../fonts/Amiri-Regular.ttf"),
  },
};

// Check fonts exist
Object.keys(fonts).forEach((fontFamily) => {
  Object.keys(fonts[fontFamily]).forEach((style) => {
    const filePath = fonts[fontFamily][style];
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ Font missing: ${filePath}`);
    }
  });
});

const printer = new PdfPrinter(fonts);

// ============================
// EMAIL TRANSPORTER
// ============================
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // true if port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// ============================
// HELPER: GET LOCATION TEXT
// ============================
function getLocationText(hospital, isOnline = false) {
  switch (hospital) {
    case "Doctor Hospital":
      return "Doctors Hospital & Medical Center, Lahore";
    case "Farooq Hospital":
      return "Farooq Hospital Westwood colony thokar niaz baig Lahore";
    case "Gujranwala Chaudhary Hospital":
      return "Chaudhary Hospital satellite town Khokar ke Gujranwala";
    default:
      if (!isOnline) {
        return "Doctors Hospital & Medical Center, Lahore";
      }
      return "";
  }
}

// ============================
// HELPER: FORMAT DATE TO URDU STYLE (SIMPLE)
// ============================
function formatDateToUrdu(dateStr) {
  const date = new Date(dateStr);
  const months = [
    "جنوری", "فروری", "مارچ", "اپریل", "مئی", "جون",
    "جولائی", "اگست", "ستمبر", "اکتوبر", "نومبر", "دسمبر"
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

// ============================
// HELPER: GET QR BASE64 (ASYNC)
// ============================
async function getImageBase64(url) {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data);
    return `data:${response.headers["content-type"]};base64,${buffer.toString("base64")}`;
  } catch (err) {
    console.error("❌ Error fetching image:", err.message);
    return null;
  }
}

// ============================
// HELPER: GENERATE URDU TEXT
// ============================
function generateUrduText(appointment) {
  const isOnline = appointment.appointmentType === 'Online';
  const fullName = appointment.fullName || '';
  const dateTime = appointment.datetime || '';
  const location = getLocationText(appointment.hospital, isOnline);
  const phone = appointment.mobile || '03098421122';
  const urduDate = formatDateToUrdu(dateTime);
  const formattedDateTime = new Date(dateTime).toLocaleString('en-GB', { timeZone: 'Asia/Karachi' });

  if (isOnline) {
    return `آپ کی ملاقات کی درخواست کی تصدیق ہو گئی ہے 👨‍⚕️
ڈاکٹر: پروفیسر ڈاکٹر نور العارفین
📅 تاریخ: ${dateTime}
📌 ملاقات کی قسم: آن لائن
🏥 مقام: پلمونولوجی چیسٹ کلینک
مشاورت کی فیس: 3500 روپے
آن لائن مشاورت کے لئے ہدایات:
1- مستحکم انٹرنیٹ کنکشن
2- موبائل نمبر وہی ہونا چاہئے جو آپ نے بکنگ کے وقت استعمال کیا تھا
3- یقینی بنائیں کہ آپ کے موبائل یا لیپ ٹاپ کا کیمرہ مریض پر مرکوز ہو۔
ہمارا نمائندہ آپ سے مقررہ وقت سے 15 منٹ قبل رابطہ کرے گا۔ ہم آپ سے درخواست کرتے ہیں کہ اپنی پچھلی طبی رپورٹس ${phone}پر بھیج دیں قبل اس کے کہ آن لائن مشاورت کا وقت ہو۔
ہم آپ سے آن لائن ملاقات کے منتظر ہیں۔
ٹیم پلمونولوجی چیسٹ کلینک`;
  } else {
    return `اسلام وعلیکم محترم
${fullName}
ہم آپ کی پروفیسر ڈاکٹر نور العارفین کے ساتھ ${formattedDateTime} کو ${location} پر شیڈول کردہ ملاقات کی تصدیق کرتے ہیں۔
برائے مہربانی ضروری کارروائی کے لیے اپنی مقررہ وقت سے 15 منٹ قبل تشریف لائیں۔
میٹنگ کو بہتر بنانے کے لیے، برائے مہربانی اپنا پرانا نسخہ اور متعلقہ طبی دستاویزات اپنے ساتھ لائیں۔ اگر آپ کی پہلی ملاقات ہے تو صرف متعلقہ طبی دستاویزات اپنے ہمراہ لائیں شکریہ
ہم آپ کو جلد دیکھنے کے منتظر ہیں۔ اگر آپ کے کوئی سوالات ہیں یا میٹنگ کی تاریخ تبدیل کرنا چاہتے ہیں تو ہم سے رابطہ کریں. شکریہ
ٹیم پلمونولوجی چیسٹ کلینک پروفیسر ڈاکٹر نور العارفین
 رابطہ:${'0309 8421122'}`;
  }
}

// ============================
// CREATE PDF
// ============================
async function createAppointmentPdfBuffer(appointment) {
  const locationText = getLocationText(appointment.hospital, appointment.appointmentType === 'Online');
  const isPhysical = appointment.appointmentType === 'Physical';
  const urduText = generateUrduText(appointment);
  const qrBase64 = await getImageBase64(
    "https://res.cloudinary.com/daxn3hm05/image/upload/v1762167180/qr-code_1_n6kbin.png"
  );

  if (!qrBase64) {
    console.error("❌ QR code fetch failed, skipping PDF generation");
    throw new Error("QR code image could not be fetched");
  }

  const docDefinition = {
    pageSize: "A4",
    pageOrientation: "portrait",
    pageMargins: [30, 50, 30, 30], // Reduced margins for more space
    content: [
      // Header Section - Compact, without logo
      {
        columns: [
          {
            width: "80%",
            stack: [
              {
                text: "Prof. Dr. Noor Ul Arfeen",
                style: "doctorHeader",
                alignment: "center",
              },
              {
                text: "Consultant Physician Pulmonologist & Intensivist",
                fontSize: 9, // Reduced
                color: "#9A3C78",
                alignment: "center",
                margin: [0, -5, 0, 0],
              },
              {
                text: "Pulmonology / Chest Clinic",
                fontSize: 9, // Reduced
                color: "#9A3C78",
                alignment: "center",
                margin: [0, -5, 0, 5], // Reduced bottom margin
              },
            ],
          },
          {
            width: "20%",
            image: qrBase64,
            fit: [50, 50], // Smaller QR
            alignment: "right",
            margin: [0, 0, 0, 5],
          },
        ],
        margin: [0, 0, 0, 15], // Reduced
      },
      // Confirmation
      {
        text: "○ Your appointment request has been confirmed",
        fontSize: 11, // Slightly reduced
        bold: true,
        color: "#9A3C78",
        margin: [0, 0, 0, 10],
      },
      // Patient Information Table - Compact
      {
        table: {
          widths: ["*"],
          body: [
            [
              {
                text: "Patient Information", 
                bold: true, 
                fillColor: "#F3F4F6", 
                padding: [8, 4] // Reduced padding
              },
            ],
            [
              {
                ul: [
                  [`Full Name: ${appointment.fullName}`],
                  [`Appointment Number: ${appointment.appointmentNumber}`],
                  [`Date: ${new Date(appointment.datetime).toLocaleDateString('en-GB')}`],
                  [`Phone: ${appointment.mobile || ''}`],
                  [`Email: ${appointment.email || ''}`],
                ],
                margin: [0, 3, 0, 8], // Reduced
              },
            ],
          ],
        },
        layout: "noBorders",
        margin: [0, 0, 0, 10],
      },
      // Doctor & Clinic Details Table - Compact
      {
        table: {
          widths: ["*", "35%"], // Slightly adjusted
          body: [
            [
              { text: "Doctor & Clinic Details", bold: true, fillColor: "#F3F4F6", colSpan: 2, padding: [8, 4] },
              {},
            ],
            [
              { text: "Prof. Dr. Noor Ul Arfeen", bold: true, fontSize: 10 },
              { text: "Department", bold: true, fontSize: 10 },
            ],
            [
              { text: "Pulmonology / Chest Clinic", fontSize: 10 },
              { text: "Appointment Type", bold: true, fontSize: 10 },
            ],
            [
              { text: locationText, margin: [0, 3, 0, 0], fontSize: 10 },
              { text: isPhysical ? "Physical" : "Online", fillColor: isPhysical ? "#D1FAE5" : "#EFF6FF", padding: [4, 2], fontSize: 10 },
            ],
          ],
        },
        layout: {
          fillColor: (rowIndex, node, columnIndex) => (rowIndex === 0 ? "#F3F4F6" : null),
        },
        margin: [0, 0, 0, 10],
      },
      // Fee Section - Compact
      {
        text: "Flu Vaccination fee (Optional): 4000 PKR",
        style: "feeText",
        margin: [0, 0, 0, 8],
      },
      // Instructions Box - Smaller font
      {
        text: [
          "Please arrive 15 minutes early to complete necessary forms. To ensure a smooth first visit, bring only necessary medical records. Thank you for trusting us with your medical records.",
        ],
        fontSize: 9, // Reduced
        color: "#374151",
        margin: [0, 0, 0, 10],
      },
      // Urdu Text Section - Smaller font and tighter line height
      {
        text: urduText,
        style: "urduTextFull",
        margin: [0, 0, 0, 15],
      },
      // QR and Signature Row - Smaller QR
      {
        columns: [
          {
            width: "50%",
            image: qrBase64,
            fit: [60, 60], // Smaller
            alignment: "left",
          },
          {
            width: "50%",
            text: "Authorized Signature",
            alignment: "right",
            bold: true,
            margin: [0, 30, 0, 0], // Adjusted
          },
        ],
        margin: [0, 0, 0, 15],
      },
      // Footer - Compact
      {
        text: "© 2025 Pulmonology Chest Clinic - Thank you for choosing us. Contact: 0309 8421122",
        style: "footer",
        alignment: "center",
        margin: [0, 10, 0, 0],
      },
    ],
    defaultStyle: {
      font: "Roboto",
      fontSize: 10, // Reduced default
      lineHeight: 1.15, // Tighter
    },
    styles: {
      doctorHeader: {
        fontSize: 16, // Reduced from 18
        bold: true,
        color: "#4B5563",
        margin: [0, 0, 0, 3],
      },
      feeText: {
        fontSize: 10, // Reduced
        color: "#9A3C78",
        bold: true,
        background: "#FEF3C7",
        padding: [8, 6], // Reduced
        border: [1, 1, 1, 1],
        borderColor: "#F59E0B",
        margin: [0, 0, 0, 5],
      },
      urduTextFull: {
        font: "Amiri",  // ✅ یہاں Amiri استعمال کریں
        fontSize: 9, // Reduced significantly
        alignment: "right",
        color: "#374151",
        background: "#F9FAFB",
        padding: [8, 8, 8, 8], // Slightly reduced
        border: [1, 1, 1, 1],
        borderColor: "#D1D5DB",
        lineHeight: 1.3, // Tighter
      },
      footer: {
        fontSize: 8, // Reduced
        color: "#6B7280",
        italics: true,
      },
    },
    // No footer to save space, or make it minimal
    footer: null, // Removed to save space on single page
  };

  const pdfDoc = printer.createPdfKitDocument(docDefinition);
  const chunks = [];

  return new Promise((resolve, reject) => {
    pdfDoc.on("data", (chunk) => chunks.push(chunk));
    pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));
    pdfDoc.on("error", reject);
    pdfDoc.end();
  });
}

// ============================
// SEND EMAIL WITH PDF
// ============================
async function sendAppointmentEmailWithPdf(appointment) {
  console.log('appointment', appointment);
  try {
    // ✅ Validate email first
    if (!appointment.email) {
      console.error("❌ No email defined for appointment!");
      return;
    }

    let pdfBuffer;
    try {
      pdfBuffer = await createAppointmentPdfBuffer(appointment);
    } catch (pdfError) {
      console.error("⚠️ PDF generation failed (non-fatal):", pdfError.message);
      pdfBuffer = null;  // Proceed without PDF
    }

    const mailOptions = {
      from: `"Pulmonology Clinic" <${process.env.SMTP_USER}>`,
      to: appointment.email,
      subject: `Appointment Confirmation - ${appointment.appointmentNumber}`,
      html: `
        <h3>Dear ${appointment.fullName},</h3>
        <p>Your appointment has been confirmed with Prof. Dr. Noor Ul Arfeen.</p>
        <p><strong>Date & Time:</strong> ${appointment.datetime}</p>
        <p><strong>Hospital:</strong> ${appointment.hospital}</p>
        <p><strong>Location:</strong> ${getLocationText(appointment.hospital, appointment.appointmentType === 'Online')}</p>
        <p>Consultation Fee: 3500 PKR</p>
        <p>Thank you for choosing Pulmonology Chest Clinic.</p>
        <p>Please find your confirmation PDF attached.${pdfBuffer ? '' : ' (PDF unavailable this time—contact us if needed.)'}</p>
      `,
      attachments: pdfBuffer ? [
        {
          filename: `Appointment-${appointment.appointmentNumber}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ] : [],
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${appointment.email}${pdfBuffer ? ' with PDF' : ' (no PDF)'}`);
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    console.error("Full error:", error.stack);
  }
}

// ============================
// EXPORTS
// ============================
module.exports = { sendAppointmentEmailWithPdf, createAppointmentPdfBuffer };