/**
 * 💌 Appointment Email + PDF Generator
 * -------------------------------------
 * Author: Saqib Ali
 * Description: Sends appointment confirmation emails 
 *              with a beautifully designed PDF slip.
 */

const nodemailer = require("nodemailer");
const axios = require("axios");
const PDFDocument = require("pdfkit");
const { PassThrough } = require("stream");


// 🌐 Validate SMTP Configuration
if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.warn("⚠️  SMTP configuration is incomplete. Email sending may fail.");
}


// 🚀 Create Nodemailer Transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: { rejectUnauthorized: false },
});


// 🏥 Compute Appointment Details
function getAppointmentDetails(hospital) {
  let details = {
    appointmentType: "Online",
    locationText: "Doctors Hospital & Medical Center, Lahore",
    clinicName: "E-Chest Clinic (Online)",
    thankYou: "Thank you for choosing E-Chest Clinic (Online).",
    signature: "Team Pulmonology Chest Clinic\nE-Chest Clinic (Online)",
    urduFirst: true,
    urduText: `محترم [مریض کا نام]، آپ کی اپائنٹمنٹ [تاریخ اور وقت] پر [مقام] میں مقرر کی گئی ہے۔ براہ کرم وقت پر پہنچیں۔`
  };

  switch (hospital) {
    case "Doctor Hospital":
      Object.assign(details, {
        appointmentType: "Physical",
        locationText: "Doctors Hospital & Medical Center, Lahore",
        clinicName: "Pulmonology / Chest Clinic",
        thankYou: "Thank you for choosing Pulmonology Chest Clinic.",
        signature: "Team Pulmonology / Chest Clinic by Prof. Dr. Noor Ul Arfeen",
        urduFirst: false,
      });
      break;

    case "Farooq Hospital":
      Object.assign(details, {
        appointmentType: "Physical",
        locationText: "Farooq Hospital, Westwood Colony, Thokar Niaz Baig, Lahore",
        clinicName: "Pulmonology / Chest Clinic",
        thankYou: "Thank you for choosing Pulmonology Chest Clinic.",
        signature: "Team Pulmonology / Chest Clinic by Prof. Dr. Noor Ul Arfeen",
        urduFirst: false,
      });
      break;

    case "Gujranwala Chaudhary Hospital":
      Object.assign(details, {
        appointmentType: "Physical",
        locationText: "Chaudhary Hospital, Satellite Town, Khokhar Ke, Gujranwala",
        clinicName: "Pulmonology / Chest Clinic",
        thankYou: "Thank you for choosing Pulmonology Chest Clinic.",
        signature: "Team Pulmonology / Chest Clinic by Prof. Dr. Noor Ul Arfeen",
        urduFirst: false,
      });
      break;
  }

  return details;
}


// 🖼️ Helper: Fetch Image as Base64
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


// 🧾 Generate Appointment PDF
async function createAppointmentPdfBuffer(appointment) {
  console.log("🚀 ~  ~ appointment:", appointment)
  const appt = appointment;
  const details = getAppointmentDetails(appt.hospital || "");

  const date = new Date(appt.datetime).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  // const time = new Date(appt.datetime).toLocaleTimeString("en-GB", {
  //   hour: "2-digit",
  //   minute: "2-digit",
  // });
  // const fee = appt.fee || 3500;

  const logoBase64 = await getImageBase64(
    "https://res.cloudinary.com/daxn3hm05/image/upload/v1762362428/html-logs_zkmzc0.jpg"
  );
  const qrBase64 = await getImageBase64(
    "https://res.cloudinary.com/daxn3hm05/image/upload/v1762167180/qr-code_1_n6kbin.png"
  );
  const qrBase64Urdo = await getImageBase64(
    "https://res.cloudinary.com/daxn3hm05/image/upload/v1762514498/urdo-pic_dccbxt.png"
  );

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const stream = new PassThrough();
    const chunks = [];

    doc.pipe(stream);

    // 🎨 Colors
    const primary = "#9A3C78";
    const accent = "#F3E8F7";
    const textDark = "#374151";
    const borderLight = "#E5E7EB";

    let y = 50;

    // 🏷️ Logo (centered)
    // if (logoBase64) {
    //   const logoWidth = 160;
    //   const logoX = (595 - logoWidth) / 2;
    //   doc.image(logoBase64, logoX, y, { width: logoWidth });
    //   y += 100;
    // }

    if (logoBase64) {
  const pageWidth = 595; // A4 width in points
  const leftMargin = 30;
  const rightMargin = 30;
  const logoWidth = pageWidth - leftMargin - rightMargin; // full width minus margins
  const logoX = leftMargin;

  // Draw the logo with full width
  doc.image(logoBase64, logoX, y, { width: logoWidth });

  // Add extra space below logo to prevent overlap with text
  y += (logoWidth * 0.35) + 40; // auto-adjust height + margin
}


    // ✨ Title
    doc.font("Helvetica-Bold")
      .fontSize(18)
      .fillColor(primary)
      .text("Your Appointment Has Been Received", 40, y, {
        align: "center",
        width: 515,
      });
    y += 30;

    doc.font("Helvetica")
      .fontSize(13)
      .fillColor(textDark)
      .text(`Dear ${appt.fullName},`, 40, y, { align: "center", width: 515 });
    y += 20;

    doc.text(
      "Your appointment with Prof. Dr. Noor Ul Arfeen has been successfully booked.",
      40,
      y,
      { align: "center", width: 515 }
    );
    y += 30;

    // 📅 Appointment Card
doc.roundedRect(70, y, 460, 120, 10).fillAndStroke(accent, primary);
doc.fillColor(textDark).font("Helvetica").fontSize(12);

// Appointment Number
doc.text("Appointment No:", 90, y + 18);
doc.text(appt.appointmentNumber, 200, y + 18);

// Date
doc.text("Date:", 90, y + 38);
doc.text(date, 200, y + 38);

// Time
// doc.text("Time:", 90, y + 58);
// doc.text(time, 200, y + 58);
// Type
doc.text("Type:", 90, y + 58);
doc.text(details.appointmentType, 200, y + 58);
// Location
doc.text("Location:", 90, y + 78);
doc.text(details.locationText, 200, y + 78, { width: 320 });

// Fee
// doc.text("Fee:", 90, y + 98);
// doc.text(`${fee} PKR`, 200, y + 98);



y += 160; // Add more space before next section


    // // 📅 Appointment Card
    // doc.roundedRect(70, y, 460, 100, 10).fillAndStroke(accent, primary);
    // doc.fillColor(textDark).font("Helvetica").fontSize(12);
    // doc.text("Appointment No:", 90, y + 18);
    // doc.text(appt.appointmentNumber, 160, y + 18);
    // doc.text("Date:", 90, y + 18);
    // doc.text(date, 160, y + 18);
    // doc.text("Time:", 90, y + 38);
    // doc.text(time, 160, y + 38);
    // doc.text("Location:", 90, y + 58);
    // doc.text(details.locationText, 160, y + 58, { width: 340 });
    // doc.text("Fee:", 90, y + 78);
    // doc.text(`${fee} PKR`, 160, y + 78);
    // doc.text("Type:", 90, y + 78);
    // doc.text(`${details.appointmentType} PKR`, 160, y + 78);
    // y += 150;
  
    // 🌙 Urdu Message + QR
    if (qrBase64Urdo) {
      const urduWidth = 260;
      const urduX = (595 - urduWidth) / 2;
      doc.image(qrBase64Urdo, urduX, y, { width: urduWidth });
      y += 60;
    }
    

    if (qrBase64) {
      const qrX = (595 - 90) / 2;
      doc.image(qrBase64, qrX, y, { width: 90 });
      doc.fontSize(10)
        .fillColor("#6B7280")
        .text("Scan for Directions", 40, y + 95, {
          align: "center",
          width: 515,
        });
      y += 120;
    }

    // 💬 Confirmation Box
    doc.roundedRect(70, y, 460, 55, 10).fillAndStroke(accent, borderLight);
    doc.font("Helvetica-Oblique")
      .fontSize(12)
      .fillColor(textDark)
      .text(
        "Our representative will contact you soon during office hours to confirm your appointment.",
        90,
        y + 15,
        { width: 420, align: "center" }
      );
    y += 80;

    // 📋 Appointment Details Box
    // doc.roundedRect(70, y, 460, 80, 10).stroke(primary);
    // doc.font("Helvetica-Bold")
    //   .fontSize(13)
    //   .fillColor(primary)
    //   .text("Appointment Details", 70, y - 5, {
    //     width: 460,
    //     align: "center",
    //   });
    // y += 20;

    // doc.font("Helvetica")
    //   .fontSize(12)
    //   .fillColor(textDark)
    //   .text(`Appointment No: ${appt.appointmentNumber}`, 100, y + 10)
    //   .text(`Type: ${details.appointmentType}`, 100, y + 30)
    //   // .text(`Hospital: ${details.clinicName}`, 100, y + 50);
    // y += 100;

    // 🔻 Footer
    doc.fontSize(10)
      .fillColor("#9CA3AF")
      .text(
        `© ${new Date().getFullYear()} ${details.clinicName} | ${details.locationText}, Pakistan`,
        40,
        y,
        { align: "center", width: 515 }
      );

    // ✅ Finalize
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
    doc.end();
  });
}



// 📧 Send Email with PDF
async function createSendAppointmentEmailWithPdf(toEmail, appointment) {
  const pdfBuffer = await createAppointmentPdfBuffer(appointment);
  const details = getAppointmentDetails(appointment.hospital || "");

  const date = new Date(appointment.datetime).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
//  const time = new Date(appointment.datetime).toLocaleTimeString("en-US", {
//   hour: "2-digit",
//   minute: "2-digit",
//   hour12: true,
// });

const body = `
Dear ${appointment.fullName},

🕐 Your appointment request has been received!

👨 Doctor: Prof. Dr. Noor Ul Arfeen
📅 Date : ${date}
📌 Type: ${details.appointmentType}
🏥 Location: ${details.locationText}


Our representative will contact you soon during office hours to confirm your appointment

${details.urduFirst
    ? `آپ کی مجوزہ اپائنٹمنٹ درج ہو چکی ہے۔
ہمارا نمائندہ دفتری اوقات میں تصدیق کے لیے جلد رابطہ کرے گا۔ شکریہ۔

${details.thankYou}`
    : `${details.thankYou}

آپ کی مجوزہ اپائنٹمنٹ درج ہو چکی ہے۔
ہمارا نمائندہ دفتری اوقات میں تصدیق کے لیے جلد رابطہ کرے گا۔ شکریہ۔`
}

🔖 Appointment Number: ${appointment.appointmentNumber}

Regards,
${details.signature}

`;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: `Appointment Slip - ${appointment.appointmentNumber}`,
    text: body,
    attachments: [
      {
        filename: `Appointment-${appointment.appointmentNumber}.pdf`,
        content: pdfBuffer,
      },
    ],
  };

  return transporter.sendMail(mailOptions);
}


// ✅ Exported Modules
module.exports = {
  createAppointmentPdfBuffer,
  createSendAppointmentEmailWithPdf,
};
