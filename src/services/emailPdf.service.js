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
  Amiri: {
    // ✅ Nillima کی جگہ Amiri استعمال کریں
    normal: path.join(__dirname, "../fonts/Amiri-Regular.ttf"),
  },
  Nillima: {
    // 👈 add this alias
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
        return "E Chest Clinic, Online";
      }
      return "";
  }
}

// ============================
// HELPER: GET QR BASE64 (ASYNC)
// ============================
async function getImageBase64(url) {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data);
    return `data:${response.headers["content-type"]};base64,${buffer.toString(
      "base64"
    )}`;
  } catch (err) {
    console.error("❌ Error fetching image:", err.message);
    return null;
  }
}

// ============================
// HELPER: GENERATE URDU TEXT
// ============================
function generateUrduText(appointment) {
  const isOnline = appointment.appointmentType === "Online";
  const fullName = appointment.fullName || "";
  const dateTime = appointment.datetime || "";
  const location = getLocationText(appointment.hospital, isOnline);

  // const phone = appointment.mobile || "03098421122";
  const phone =
    appointment.hospital === "Gujranwala Chaudhary Hospital"
      ? "03454221122"
      : "03098421122";
  const phoneUrdu = `\u202A${phone}\u202C`;
  const H_message = `رابطہ: ${phoneUrdu}`;
  const H_showMessage = H_message;

  const formattedDateTime = new Date(appointment.datetime).toLocaleString(
    "en-US",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }
  );
  const date = new Date(dateTime).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  if (isOnline) {
    return `آپ کی ملاقات کی درخواست کی تصدیق ہو گئی ہے 👨‍⚕️
ڈاکٹر: پروفیسر ڈاکٹر نور العارفین
📅 تاریخ: ${date}
📌 ملاقات کی قسم: آن لائن
🏥 مقام: پلمونولوجی چیسٹ کلینک
آن لائن مشاورت کے لئے ہدایات:
1- مستحکم انٹرنیٹ کنکشن
2- موبائل نمبر وہی ہونا چاہئے جو آپ نے بکنگ کے وقت استعمال کیا تھا
3- یقینی بنائیں کہ آپ کے موبائل یا لیپ ٹاپ کا کیمرہ مریض پر مرکوز ہو۔
ہمارا نمائندہ آپ سے مقررہ وقت سے 15 منٹ قبل رابطہ کرے گا۔ ہم آپ سے درخواست کرتے ہیں کہ اپنی پچھلی طبی رپورٹس ${phoneUrdu}پر بھیج دیں قبل اس کے کہ آن لائن مشاورت کا وقت ہو۔
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
${H_showMessage}
 `;
  }
}

// ============================
// CREATE PDF
// ============================
async function createAppointmentPdfBuffer(appointment) {
  const locationText = getLocationText(
    appointment.hospital,
    appointment.appointmentType === "Online"
  );
  const formattedDate = new Date(appointment.datetime).toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const isPhysical = appointment.appointmentType === "Physical";
  const urduText = generateUrduText(appointment);
  const qrBase64 = await getImageBase64(
    "https://res.cloudinary.com/daxn3hm05/image/upload/v1762167180/qr-code_1_n6kbin.png"
  );

  const logoBase64 = await getImageBase64(
    "https://res.cloudinary.com/daxn3hm05/image/upload/v1762362428/html-logs_zkmzc0.jpg"
  );

  if (!qrBase64) {
    console.error("❌ QR code fetch failed, skipping PDF generation");
    throw new Error("QR code image could not be fetched");
  }

  const phone =
    appointment.hospital === "Gujranwala Chaudhary Hospital"
      ? "03454221122"
      : "03098421122";

  const docDefinition = {
    pageSize: "A4",
    pageOrientation: "portrait",
    pageMargins: [30, 10, 30, 20], // left, top, right, bottom
    content: [
      // Header Section - Compact, without logo
      {
        columns: [
          {
            image: logoBase64,
            width: 520, // Approx full page width (adjust according to your page size)
            alignment: "center",
            margin: [0, 0, 0, 0], // Bottom margin
          },
        ],
        margin: [0, 0, 0, 2], // Header bottom margin

        // columns: [
        //   {
        //     width: "80%",
        //     stack: [
        //       {
        //         text: "Prof. Dr. Noor Ul Arfeen",
        //         style: "doctorHeader",
        //         alignment: "center",
        //       },
        //       {
        //         text: "Consultant Physician Pulmonologist & Intensivist",
        //         fontSize: 9, // Reduced
        //         color: "#9A3C78",
        //         alignment: "center",
        //         margin: [0, -5, 0, 0],
        //       },
        //       {
        //         text: "Pulmonology / Chest Clinic",
        //         fontSize: 9, // Reduced
        //         color: "#9A3C78",
        //         alignment: "center",
        //         margin: [0, -5, 0, 5], // Reduced bottom margin
        //       },
        //     ],
        //   },
        //   {
        //     width: "20%",
        //     image: qrBase64,
        //     fit: [50, 50], // Smaller QR
        //     alignment: "right",
        //     margin: [0, 0, 0, 5],
        //   },
        // ],
        // margin: [0, 0, 0, 15], // Reduced
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
                padding: [8, 4], // Reduced padding
              },
            ],
            [
              {
                ul: [
                  [`Full Name: ${appointment.fullName}`],
                  [`Appointment Number: ${appointment.appointmentNumber}`],
                  [`Date: ${formattedDate}`],
                  [`Phone: ${appointment.mobile || ""}`],
                  [`Email: ${appointment.email || ""}`],
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
              {
                text: "Doctor & Clinic Details",
                bold: true,
                fillColor: "#F3F4F6",
                colSpan: 2,
                padding: [8, 4],
              },
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
              {
                text: isPhysical ? "Physical" : "Online",
                fillColor: isPhysical ? "#D1FAE5" : "#EFF6FF",
                padding: [4, 2],
                fontSize: 10,
              },
            ],
          ],
        },
        layout: {
          fillColor: (rowIndex, node, columnIndex) =>
            rowIndex === 0 ? "#F3F4F6" : null,
        },
        margin: [0, 0, 0, 10],
      },
      // Fee Section - Compact
      // {
      //   text: "Flu Vaccination fee (Optional): 4000 PKR",
      //   style: "feeText",
      //   margin: [0, 0, 0, 8],
      // },
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
        margin: [0, 0, 0, 10],
      },
      // Footer - Compact
      {
        text: `© 2025 Pulmonology Chest Clinic - Thank you for choosing us. Contact: ${phone}`,
        style: "footer",
        alignment: "center",
        margin: [0, 5, 0, 0],
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
        font: "Amiri", // ✅ یہاں Amiri استعمال کریں
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
  const formattedDate = new Date(appointment.datetime).toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  // const phone = appointment.mobile || "03098421122";
  const phone =
    appointment.hospital === "Gujranwala Chaudhary Hospital"
      ? "03454221122"
      : "03098421122";
  const phoneUrdu = `\u202A${phone}\u202C`;

  const Ho_message = `رابطہ: ${phoneUrdu}`;
  const Ho_showMessage = Ho_message;
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
      console.error("⚠️ PDF generation failed (non-fatal):", pdfError);
      pdfBuffer = null; // Proceed without PDF
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: appointment.email,
      subject: `Appointment Confirmation - ${appointment.appointmentNumber}`,
      html: `
  ${
    appointment.appointmentType === "Online"
      ? `
  <p>🕐 Your appointment request has been confirmed</p>
  <p>👨 <strong>Doctor:</strong> Prof. Dr. Noor Ul Arfeen</p>
  <p>📅 <strong>Date:</strong> ${formattedDate}</p>
  <p>📌 <strong>Appointment Type:</strong> Online</p>
  <p>🏥 <strong>Location:</strong> Pulmonogy Chest Clinic</p>

  <p><strong>Instructions for online consultation:</strong></p>
  <p>1- Strong internet connection</p>
  <p>2- Phone number must be same which used while booking appointment</p>
  <p>3- Make sure camera of your phone or laptop focused on patient</p>
  <p>Our representative will contact you 15 minutes prior of scheduled online consultation.</p>
  <p>We kindly request you to send your previous medical records to <strong>${phone}</strong> before online consultation scheduled time.</p>
  <p>We look forward to connecting with you Online.</p>
  <p><strong>Best regards,</strong><br/>
  Team Pulmonology Chest Clinic by Prof. Dr Noor Ul Arfeen</p>
  <hr/>
  
  <p>آپ کی ملاقات کی درخواست کی تصدیق ہو گئی ہے 👨</p>
  <p><strong>ڈاکٹر:</strong> پروفیسر ڈاکٹر نور العارفین</p>
  <p>📅 <strong>تاریخ:</strong> ${formattedDate}</p>
  <p>📌 <strong>ملاقات کی قسم:</strong> آن لائن</p>
  <p>🏥 <strong>مقام:</strong> پلمونولوجی چیسٹ کلینک</p>
  <p><strong>آن لائن مشاورت کے لئے ہدایات:</strong></p>
  <p>1- مستحکم انٹرنیٹ کنکشن</p>
  <p>2- موبائل نمبر وہی ہونا چاہئے جو آپ نے بکنگ کے وقت استعمال کیا تھا</p>
  <p>3- یقینی بنائیں کہ آپ کے موبائل یا لیپ ٹاپ کا کیمرہ مریض پر مرکوز ہو۔</p>
  <p>ہمارا نمائندہ آپ سے مقررہ وقت سے 15 منٹ قبل رابطہ کرے گا۔ ہم آپ سے درخواست کرتے ہیں کہ اپنی پچھلی طبی رپورٹس <strong>${phoneUrdu}</strong> پر بھیج دیں قبل اس کے کہ آن لائن مشاورت کا وقت ہو۔</p>
  <p>ہم آپ سے آن لائن ملاقات کے منتظر ہیں۔</p>
  <p><strong>ٹیم پلمونولوجی چیسٹ کلینک</strong></p>
  `
      : `

  <h3>Dear ${appointment.fullName},</h3>
  <p>🕐 Your appointment request has been confirmed.</p>
  <p>👨 <strong>Doctor:</strong> Prof. Dr. Noor Ul Arfeen</p>
  <p>📅 <strong>Date & Time:</strong> ${formattedDate}</p>
  <p>📌 <strong>Appointment Type:</strong> ${appointment.appointmentType}</p>
  <p>🏥 <strong>Location:</strong> ${getLocationText(
    appointment.hospital,
    false
  )}</p>


  <p>Please arrive 15 minutes prior to your scheduled time to complete the necessary formalities.</p>
  <p>To ensure a smooth consultation, kindly bring your old prescription and relevant medical records with you. If it is your first appointment, bring only necessary medical records.</p>
  <p>We look forward to seeing you soon. If you have any questions or need to reschedule, please contact <strong>${phone}</strong>.</p>
  <p>Thank you for choosing Pulmonology Chest Clinic.</p>
  <p><strong>Appointment Number:</strong> ${appointment.appointmentNumber}</p>
  <p>Regards,<br/>
  Team Pulmonology / Chest Clinic by Prof Dr Noor Ul Arfeen</p>


  <hr/>

  <p>اسلام وعلیکم ${appointment.fullName},</p>
  <p>ہم آپ کی پروفیسر ڈاکٹر نور العارفین کے ساتھ ${formattedDate} کو ${getLocationText(
          appointment.hospital,
          false
        )} پر شیڈول کردہ ملاقات کی تصدیق کرتے ہیں۔</p>
  <p>برائے مہربانی ضروری کارروائی کے لیے اپنی مقررہ وقت سے 15 منٹ قبل تشریف لائیں۔</p>
  <p>میٹنگ کو بہتر بنانے کے لیے، برائے مہربانی اپنا پرانا نسخہ اور متعلقہ طبی دستاویزات اپنے ساتھ لائیں۔ اگر آپ کی پہلی ملاقات ہے تو صرف متعلقہ طبی دستاویزات اپنے ہمراہ لائیں۔ شکریہ</p>
  <p>ہم آپ کو جلد دیکھنے کے منتظر ہیں۔ اگر آپ کے کوئی سوالات ہیں یا میٹنگ کی تاریخ تبدیل کرنا چاہتے ہیں تو ہم سے رابطہ کریں۔ شکریہ</p>
  <p>ٹیم پلمونولوجی چیسٹ کلینک پروفیسر ڈاکٹر نور العارفین<br/>
<p/> ${Ho_showMessage}
  
  `
  }

  <p>Please find your confirmation PDF attached.${
    pdfBuffer ? "" : " (PDF unavailable this time—contact us if needed.)"
  }</p>
  `,

      attachments: pdfBuffer
        ? [
            {
              filename: `Appointment-${appointment.appointmentNumber}.pdf`,
              content: pdfBuffer,
              contentType: "application/pdf",
            },
          ]
        : [],
    };

    await transporter.sendMail(mailOptions);
    console.log(
      `✅ Email sent successfully to ${appointment.email}${
        pdfBuffer ? " with PDF" : " (no PDF)"
      }`
    );
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    console.error("Full error:", error.stack);
  }
}

module.exports = { sendAppointmentEmailWithPdf, createAppointmentPdfBuffer };
