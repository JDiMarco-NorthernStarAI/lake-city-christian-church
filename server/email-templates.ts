const CHURCH_NAME = "Lake City Christian Church";
const CHURCH_URL = process.env.APP_URL || "https://lakecitychristian.church";
const CHURCH_ADDRESS = "6717 Fry Road, Middleburg Heights, OH";

function baseLayout(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#111111;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#111111;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#1a1a1a;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#00D4FF 0%,#0088DD 50%,#0033AA 100%);padding:32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:0.5px;">${CHURCH_NAME}</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:13px;letter-spacing:1px;">LC3</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;border-top:1px solid #2a2a2a;text-align:center;">
              <p style="margin:0 0 8px;color:#888888;font-size:12px;">${CHURCH_NAME}</p>
              <p style="margin:0 0 8px;color:#666666;font-size:11px;">${CHURCH_ADDRESS}</p>
              <a href="${CHURCH_URL}" style="color:#00D4FF;font-size:11px;text-decoration:none;">Visit our website</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function button(text: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td style="background:linear-gradient(135deg,#00D4FF,#0033AA);border-radius:6px;padding:12px 28px;">
        <a href="${url}" style="color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;display:inline-block;">${text}</a>
      </td>
    </tr>
  </table>`;
}

function heading(text: string): string {
  return `<h2 style="margin:0 0 16px;color:#ffffff;font-size:20px;font-weight:600;">${text}</h2>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;color:#cccccc;font-size:14px;line-height:1.6;">${text}</p>`;
}

function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 0;color:#888888;font-size:13px;width:120px;vertical-align:top;">${label}</td>
    <td style="padding:8px 0;color:#cccccc;font-size:13px;vertical-align:top;">${value}</td>
  </tr>`;
}

function detailsTable(rows: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:16px 0;background-color:#222222;border-radius:6px;padding:16px;">
    ${rows}
  </table>`;
}

export function welcomeEmail(name: string): { subject: string; html: string } {
  return {
    subject: `Welcome to ${CHURCH_NAME}!`,
    html: baseLayout(`Welcome to ${CHURCH_NAME}`, `
      ${heading(`Welcome, ${name}!`)}
      ${paragraph(`We're so glad you've joined the ${CHURCH_NAME} community. Our mission is to connect people to a life-changing relationship with Jesus.`)}
      ${paragraph("Here are some things you can do with your account:")}
      ${detailsTable(`
        ${detailRow("Events", "Sign up for church events and activities")}
        ${detailRow("Sermons", "Watch and explore past sermons")}
        ${detailRow("Kids", "Register your children for kids ministry")}
        ${detailRow("Give", "Set up one-time or recurring donations")}
      `)}
      ${button("Visit Our Website", CHURCH_URL)}
      ${paragraph("If you have any questions, don't hesitate to reach out to us through our contact page.")}
    `),
  };
}

export function contactConfirmationEmail(name: string, message: string): { subject: string; html: string } {
  return {
    subject: `We received your message - ${CHURCH_NAME}`,
    html: baseLayout("Message Received", `
      ${heading("We Got Your Message")}
      ${paragraph(`Hi ${name}, thank you for reaching out to us! We've received your message and a member of our team will get back to you soon.`)}
      ${detailsTable(`${detailRow("Your Message", message)}`)}
      ${paragraph("In the meantime, feel free to explore our website for more information about our church and upcoming events.")}
      ${button("Explore Our Church", CHURCH_URL)}
    `),
  };
}

export function eventSignupConfirmationEmail(
  name: string,
  eventTitle: string,
  eventDate: string,
  eventLocation: string | null,
  status: string
): { subject: string; html: string } {
  const statusText = status === "waitlist"
    ? "You've been added to the waitlist. We'll notify you if a spot opens up."
    : "You're all set! We look forward to seeing you there.";

  return {
    subject: `${status === "waitlist" ? "Waitlisted" : "Registered"}: ${eventTitle} - ${CHURCH_NAME}`,
    html: baseLayout("Event Registration", `
      ${heading(status === "waitlist" ? "You're on the Waitlist" : "You're Registered!")}
      ${paragraph(`Hi ${name}, ${statusText}`)}
      ${detailsTable(`
        ${detailRow("Event", eventTitle)}
        ${detailRow("Date", eventDate)}
        ${eventLocation ? detailRow("Location", eventLocation) : ""}
        ${detailRow("Status", status === "waitlist" ? "Waitlisted" : "Confirmed")}
      `)}
      ${button("View My Events", `${CHURCH_URL}/events`)}
    `),
  };
}

export function connectCardConfirmationEmail(firstName: string): { subject: string; html: string } {
  return {
    subject: `Thanks for connecting! - ${CHURCH_NAME}`,
    html: baseLayout("Thanks for Connecting", `
      ${heading(`Hi ${firstName}!`)}
      ${paragraph("Thank you for filling out a connect card. We're so glad you're interested in learning more about our church community.")}
      ${paragraph("A member of our team will be in touch with you soon. In the meantime, here are some ways to get involved:")}
      ${detailsTable(`
        ${detailRow("Small Groups", "Join a group and build deeper connections")}
        ${detailRow("Serve", "Find ways to use your gifts to serve others")}
        ${detailRow("Events", "Check out upcoming events and activities")}
      `)}
      ${button("Learn More", `${CHURCH_URL}/ministries`)}
    `),
  };
}

export function donationReceiptEmail(
  donorName: string,
  amount: string,
  fundName: string,
  frequency: string,
  date: string
): { subject: string; html: string } {
  const frequencyLabel = frequency === "one_time" ? "One-Time" : frequency === "weekly" ? "Weekly" : "Monthly";

  return {
    subject: `Donation Receipt - ${CHURCH_NAME}`,
    html: baseLayout("Donation Receipt", `
      ${heading("Thank You for Your Generosity")}
      ${paragraph(`Dear ${donorName}, thank you for your generous donation to ${CHURCH_NAME}. Your giving makes a difference in our community.`)}
      ${detailsTable(`
        ${detailRow("Amount", amount)}
        ${detailRow("Fund", fundName)}
        ${detailRow("Type", frequencyLabel)}
        ${detailRow("Date", date)}
      `)}
      ${paragraph("This email serves as your donation receipt. Please keep it for your records.")}
      ${button("View Giving", `${CHURCH_URL}/give`)}
    `),
  };
}

export function smallGroupSignupNotification(
  submitterName: string,
  submitterEmail: string,
  submitterPhone: string | undefined,
  groupNames: string[],
  submittedAt: Date,
): { subject: string; html: string } {
  return {
    subject: `New City Group Signup: ${submitterName} - ${CHURCH_NAME}`,
    html: baseLayout("New City Group Signup", `
      ${heading("New City Group Interest")}
      ${paragraph(`Someone has expressed interest in joining a City Group. Please follow up with them to get connected!`)}
      ${detailsTable(`
        ${detailRow("Name", submitterName)}
        ${detailRow("Email", `<a href="mailto:${submitterEmail}" style="color:#00D4FF;">${submitterEmail}</a>`)}
        ${submitterPhone ? detailRow("Phone", `<a href="tel:${submitterPhone}" style="color:#00D4FF;">${submitterPhone}</a>`) : ""}
        ${detailRow("Group(s)", groupNames.join(", "))}
        ${detailRow("Submitted", submittedAt.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" }))}
      `)}
      ${button("View All Signups", `${CHURCH_URL}/admin/dashboard`)}
      ${paragraph("You can manage City Groups and view all signups in the admin dashboard under the Small Groups tab.")}
    `),
  };
}

export function adminNotificationEmail(
  subject: string,
  messageBody: string,
  details: Record<string, string> = {}
): { subject: string; html: string } {
  const detailRows = Object.entries(details)
    .map(([key, value]) => detailRow(key, value))
    .join("");

  return {
    subject: `[Admin] ${subject} - ${CHURCH_NAME}`,
    html: baseLayout(subject, `
      ${heading(subject)}
      ${paragraph(messageBody)}
      ${Object.keys(details).length > 0 ? detailsTable(detailRows) : ""}
      ${button("Go to Admin Dashboard", `${CHURCH_URL}/admin`)}
    `),
  };
}
