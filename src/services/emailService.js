/**
 * Email Service
 * Handles branded email sending for invoices and reminders
 * Falls back to plain text if no logo uploaded
 */

import { generateInvoiceEmailTemplate } from './invoiceService';

/**
 * Send a branded invoice email reminder
 * @param {Object} invoice - Invoice object
 * @param {Object} settings - Brand settings
 * @param {string} recipientEmail - Recipient email address
 * @returns {Promise<Object>} - Result object with success status and message
 */
export const sendInvoiceReminder = async (invoice, settings = {}, recipientEmail = '') => {
  try {
    if (!recipientEmail) {
      return {
        success: false,
        message: 'Recipient email address is required',
        type: 'error',
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return {
        success: false,
        message: 'Invalid email address format',
        type: 'error',
      };
    }

    const htmlTemplate = generateInvoiceEmailTemplate(invoice, settings);
    const plainTextTemplate = generatePlainTextEmailTemplate(invoice, settings);

    // In a real application, this would call a backend API
    // For now, we'll simulate the email sending and provide copy-to-clipboard functionality
    const emailPayload = {
      to: recipientEmail,
      from: settings.emailReplyTo || 'noreply@notaryfix.com',
      subject: `Invoice ${invoice.id} from ${settings.businessName || 'Notary Services'} - Due ${invoice.due}`,
      html: htmlTemplate,
      text: plainTextTemplate,
    };

    // Log the email payload (in production, send to backend API)
    console.log('Email payload prepared:', emailPayload);

    // Copy HTML template to clipboard for manual sending
    await navigator.clipboard?.writeText(htmlTemplate);

    return {
      success: true,
      message: `Email template copied to clipboard. Ready to send to ${recipientEmail}`,
      type: 'success',
      payload: emailPayload,
    };
  } catch (error) {
    console.error('Email sending error:', error);
    return {
      success: false,
      message: `Failed to prepare email: ${error.message}`,
      type: 'error',
    };
  }
};

/**
 * Generate a plain text email template for invoice reminders
 * @param {Object} invoice - Invoice object
 * @param {Object} settings - Brand settings
 * @returns {string} - Plain text email template
 */
export const generatePlainTextEmailTemplate = (invoice, settings = {}) => {
  const businessName = settings.businessName || 'Notary Services';
  const businessAddress = settings.businessAddress || '';
  const emailReplyTo = settings.emailReplyTo || '';

  const formattedAmount = Number(invoice.amount || 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
  const formattedDueDate = new Date(invoice.due).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
${businessName}
${businessAddress}

---

INVOICE REMINDER

Hello ${invoice.client || 'Valued Client'},

We have sent you an invoice for our notary services. Please review the details below and make payment by the due date.

INVOICE DETAILS
===============

Invoice Number: ${invoice.id}
Invoice Date: ${invoice.date || new Date().toLocaleDateString('en-US')}
Due Date: ${formattedDueDate}
Status: ${invoice.status || 'Pending'}

Amount Due: ${formattedAmount}

${invoice.notes ? `Description: ${invoice.notes}` : ''}

${invoice.paymentLink ? `
PAYMENT LINK
============

Please click the link below to pay this invoice securely:
${invoice.paymentLink}
` : ''}

---

If you have any questions about this invoice, please don't hesitate to reach out.

${emailReplyTo ? `Reply to: ${emailReplyTo}` : ''}

© ${new Date().getFullYear()} ${businessName}. All rights reserved.

This is an automated message. Please do not reply to this email.
  `.trim();
};

/**
 * Copy branded email reminder to clipboard
 * @param {Object} invoice - Invoice object
 * @param {Object} settings - Brand settings
 * @param {string} format - 'html' or 'text' (default: 'html')
 * @returns {Promise<boolean>} - Success status
 */
export const copyEmailReminderToClipboard = async (invoice, settings = {}, format = 'html') => {
  try {
    let template;
    if (format === 'text') {
      template = generatePlainTextEmailTemplate(invoice, settings);
    } else {
      template = generateInvoiceEmailTemplate(invoice, settings);
    }

    await navigator.clipboard?.writeText(template);
    return true;
  } catch (error) {
    console.error('Failed to copy email template:', error);
    return false;
  }
};

/**
 * Generate a branded payment reminder message
 * @param {Object} invoice - Invoice object
 * @param {Object} settings - Brand settings
 * @returns {string} - Payment reminder message
 */
export const generatePaymentReminderMessage = (invoice, settings = {}) => {
  const businessName = settings.businessName || 'Notary Services';
  const paymentLink = invoice.paymentLink || '';
  const formattedAmount = Number(invoice.amount || 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  let message = `Reminder: Invoice ${invoice.id} from ${businessName} for ${invoice.client} (${formattedAmount}) is due on ${invoice.due}.`;

  if (paymentLink) {
    message += ` Pay here: ${paymentLink}`;
  }

  return message;
};

/**
 * Prepare invoice for sending via email
 * @param {Object} invoice - Invoice object
 * @param {Object} settings - Brand settings
 * @returns {Object} - Prepared email data
 */
export const prepareInvoiceForEmail = (invoice, settings = {}) => {
  const businessName = settings.businessName || 'Notary Services';
  const businessAddress = settings.businessAddress || '';
  const businessLogo = settings.businessLogo || '';
  const emailReplyTo = settings.emailReplyTo || '';

  return {
    subject: `Invoice ${invoice.id} from ${businessName}`,
    from: emailReplyTo || 'noreply@notaryfix.com',
    businessName,
    businessAddress,
    businessLogo,
    emailReplyTo,
    invoice,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Generate a branded overdue payment notice
 * @param {Object} invoice - Invoice object
 * @param {Object} settings - Brand settings
 * @param {number} daysOverdue - Number of days overdue
 * @returns {string} - Overdue notice HTML
 */
export const generateOverdueNoticeHTML = (invoice, settings = {}, daysOverdue = 0) => {
  const brandColor = settings.brandColor || '#3b82f6';
  const businessName = settings.businessName || 'Notary Services';
  const businessAddress = settings.businessAddress || '';
  const businessLogo = settings.businessLogo || '';
  const emailReplyTo = settings.emailReplyTo || '';

  const formattedAmount = Number(invoice.amount || 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Overdue - Invoice ${invoice.id}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          color: #374151;
          line-height: 1.6;
          background-color: #f9fafb;
          margin: 0;
          padding: 0;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          color: white;
          padding: 2rem 1.5rem;
          text-align: center;
        }
        .header-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .logo {
          width: 50px;
          height: 50px;
          border-radius: 6px;
          object-fit: cover;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: bold;
        }
        .header p {
          margin: 0.5rem 0 0 0;
          font-size: 14px;
          opacity: 0.95;
        }
        .alert-banner {
          background-color: #fee2e2;
          border-left: 4px solid #dc2626;
          padding: 1.5rem;
          margin: 0;
        }
        .alert-banner h2 {
          margin: 0 0 0.5rem 0;
          color: #991b1b;
          font-size: 18px;
        }
        .alert-banner p {
          margin: 0;
          color: #7f1d1d;
          font-size: 14px;
        }
        .content {
          padding: 2rem 1.5rem;
        }
        .invoice-box {
          background-color: #f3f4f6;
          border-left: 4px solid #dc2626;
          padding: 1.5rem;
          margin: 1.5rem 0;
          border-radius: 4px;
        }
        .invoice-box h3 {
          margin: 0 0 1rem 0;
          color: #dc2626;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
        }
        .invoice-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          font-size: 14px;
        }
        .detail-item {
          margin-bottom: 0.5rem;
        }
        .detail-label {
          color: #6b7280;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
        }
        .detail-value {
          color: #1f2937;
          font-size: 15px;
          font-weight: 500;
        }
        .amount-highlight {
          font-size: 24px;
          color: #dc2626;
          font-weight: bold;
          margin-top: 0.5rem;
        }
        .cta-button {
          display: inline-block;
          background-color: #dc2626;
          color: white;
          padding: 0.875rem 2rem;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 600;
          font-size: 16px;
          margin: 1.5rem 0;
        }
        .footer {
          background-color: #f9fafb;
          padding: 1.5rem;
          border-top: 1px solid #e5e7eb;
          font-size: 12px;
          color: #6b7280;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <div class="header-content">
            ${businessLogo ? `<img src="${businessLogo}" alt="Logo" class="logo">` : ''}
            <div>
              <h1>${businessName}</h1>
              ${businessAddress ? `<p>${businessAddress}</p>` : ''}
            </div>
          </div>
        </div>

        <div class="alert-banner">
          <h2>⚠️ Payment Overdue</h2>
          <p>Your invoice is now ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue. Immediate payment is required.</p>
        </div>

        <div class="content">
          <p>Hello ${invoice.client || 'Valued Client'},</p>
          <p>Our records indicate that invoice ${invoice.id} remains unpaid and is now overdue. We kindly request that you settle this payment as soon as possible.</p>

          <div class="invoice-box">
            <h3>Overdue Invoice Details</h3>
            <div class="invoice-details">
              <div>
                <div class="detail-item">
                  <div class="detail-label">Invoice Number</div>
                  <div class="detail-value">${invoice.id}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Original Due Date</div>
                  <div class="detail-value">${new Date(invoice.due).toLocaleDateString('en-US')}</div>
                </div>
              </div>
              <div>
                <div class="detail-item">
                  <div class="detail-label">Days Overdue</div>
                  <div class="detail-value" style="color: #dc2626; font-weight: bold;">${daysOverdue}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Status</div>
                  <div class="detail-value">OVERDUE</div>
                </div>
              </div>
            </div>
            <div class="amount-highlight">${formattedAmount}</div>
          </div>

          ${invoice.paymentLink ? `
            <div style="text-align: center;">
              <a href="${invoice.paymentLink}" class="cta-button">Pay Now</a>
            </div>
          ` : ''}

          <p style="font-size: 14px; color: #6b7280; margin-top: 1.5rem;">
            If you have already sent payment, please disregard this notice. If you have any questions or need to arrange a payment plan, please contact us immediately.
          </p>
          ${emailReplyTo ? `
            <p style="font-size: 14px; color: #6b7280;">
              <strong>Contact:</strong> <a href="mailto:${emailReplyTo}">${emailReplyTo}</a>
            </p>
          ` : ''}
        </div>

        <div class="footer">
          <p style="margin: 0;">© ${new Date().getFullYear()} ${businessName}. All rights reserved.</p>
          <p style="margin: 0.5rem 0 0 0; font-size: 11px;">This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
