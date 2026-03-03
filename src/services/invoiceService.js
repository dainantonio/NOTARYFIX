/**
 * Invoice PDF and Email Service
 * Handles branded invoice PDF generation and HTML email templates
 */

/**
 * Generate a branded invoice PDF using HTML print stylesheet
 * @param {Object} invoice - Invoice object with id, client, amount, due, date, status, etc.
 * @param {Object} settings - Brand settings (brandColor, businessName, businessAddress, licenseNumber, businessLogo)
 * @returns {void} - Opens print dialog or downloads PDF
 */
export const generateInvoicePDF = (invoice, settings = {}) => {
  const brandColor = settings.brandColor || '#3b82f6';
  const businessName = settings.businessName || 'Notary Services';
  const businessAddress = settings.businessAddress || '';
  const licenseNumber = settings.licenseNumber || '';
  const businessLogo = settings.businessLogo || '';

  const paymentLink = invoice.paymentLink || '';
  const formattedAmount = Number(invoice.amount || 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
  const formattedDueDate = new Date(invoice.due).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Invoice ${invoice.id}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          color: #1f2937;
          line-height: 1.6;
          background: white;
        }
        .container {
          max-width: 8.5in;
          height: 11in;
          margin: 0 auto;
          padding: 0.5in;
          background: white;
        }
        .header {
          border-bottom: 3px solid ${brandColor};
          padding-bottom: 1rem;
          margin-bottom: 2rem;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .logo-section {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .logo {
          width: 60px;
          height: 60px;
          border-radius: 8px;
          object-fit: cover;
        }
        .business-info {
          flex: 1;
        }
        .business-name {
          font-size: 24px;
          font-weight: bold;
          color: ${brandColor};
          margin-bottom: 0.25rem;
        }
        .business-address {
          font-size: 12px;
          color: #6b7280;
        }
        .invoice-title {
          text-align: right;
        }
        .invoice-title h1 {
          font-size: 32px;
          color: ${brandColor};
          margin-bottom: 0.5rem;
        }
        .invoice-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin-bottom: 2rem;
        }
        .detail-block {
          font-size: 13px;
        }
        .detail-label {
          color: #6b7280;
          font-weight: 600;
          margin-bottom: 0.25rem;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.05em;
        }
        .detail-value {
          color: #1f2937;
          font-size: 14px;
        }
        .line-items {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 2rem;
        }
        .line-items thead {
          background-color: #f3f4f6;
          border-bottom: 2px solid ${brandColor};
        }
        .line-items th {
          padding: 0.75rem;
          text-align: left;
          font-weight: 600;
          color: ${brandColor};
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .line-items td {
          padding: 1rem 0.75rem;
          border-bottom: 1px solid #e5e7eb;
        }
        .line-items tbody tr:last-child td {
          border-bottom: 2px solid ${brandColor};
        }
        .amount-right {
          text-align: right;
        }
        .totals {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 2rem;
        }
        .totals-table {
          width: 300px;
        }
        .total-row {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 1rem;
          padding: 0.5rem 0;
          border-bottom: 1px solid #e5e7eb;
          font-size: 14px;
        }
        .total-row.grand-total {
          border-bottom: 2px solid ${brandColor};
          border-top: 2px solid ${brandColor};
          padding: 1rem 0;
          font-weight: bold;
          font-size: 16px;
          color: ${brandColor};
        }
        .payment-section {
          background-color: #f9fafb;
          border: 2px solid ${brandColor};
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          text-align: center;
        }
        .payment-section h3 {
          color: ${brandColor};
          margin-bottom: 0.5rem;
          font-size: 16px;
        }
        .payment-link {
          display: inline-block;
          background-color: ${brandColor};
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 600;
          margin-top: 0.5rem;
          word-break: break-all;
          font-size: 12px;
        }
        .footer {
          border-top: 1px solid #e5e7eb;
          padding-top: 1rem;
          margin-top: 2rem;
          font-size: 11px;
          color: #6b7280;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .footer-left {
          text-align: left;
        }
        .footer-right {
          text-align: right;
        }
        .license-number {
          font-weight: 600;
          color: ${brandColor};
        }
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 100%;
            height: auto;
            margin: 0;
            padding: 0.5in;
          }
          .payment-section {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-section">
            ${businessLogo ? `<img src="${businessLogo}" alt="Logo" class="logo">` : ''}
            <div class="business-info">
              <div class="business-name">${businessName}</div>
              ${businessAddress ? `<div class="business-address">${businessAddress}</div>` : ''}
            </div>
          </div>
          <div class="invoice-title">
            <h1>INVOICE</h1>
          </div>
        </div>

        <div class="invoice-details">
          <div class="detail-block">
            <div class="detail-label">Bill To</div>
            <div class="detail-value">${invoice.client || 'Client Name'}</div>
          </div>
          <div class="detail-block">
            <div class="detail-label">Invoice Number</div>
            <div class="detail-value">${invoice.id}</div>
          </div>
          <div class="detail-block">
            <div class="detail-label">Invoice Date</div>
            <div class="detail-value">${invoice.date || new Date().toLocaleDateString('en-US')}</div>
          </div>
          <div class="detail-block">
            <div class="detail-label">Due Date</div>
            <div class="detail-value">${formattedDueDate}</div>
          </div>
        </div>

        <table class="line-items">
          <thead>
            <tr>
              <th>Description</th>
              <th class="amount-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${invoice.notes || 'Notary Services'}</td>
              <td class="amount-right">${formattedAmount}</td>
            </tr>
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-table">
            <div class="total-row grand-total">
              <span>Total Due</span>
              <span>${formattedAmount}</span>
            </div>
          </div>
        </div>

        ${paymentLink ? `
          <div class="payment-section">
            <h3>Pay Now</h3>
            <p style="font-size: 12px; color: #6b7280; margin-bottom: 0.5rem;">Click the link below to pay this invoice securely:</p>
            <a href="${paymentLink}" class="payment-link">${paymentLink}</a>
          </div>
        ` : ''}

        <div class="footer">
          <div class="footer-left">
            ${licenseNumber ? `<div><span class="license-number">License:</span> ${licenseNumber}</div>` : ''}
            <div style="margin-top: 0.5rem;">Generated on ${new Date().toLocaleDateString('en-US')}</div>
          </div>
          <div class="footer-right">
            <div>Status: <strong>${invoice.status || 'Pending'}</strong></div>
          </div>
        </div>
      </div>

      <script>
        window.addEventListener('load', function() {
          window.print();
        });
      </script>
    </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, '_blank');
  if (printWindow) {
    printWindow.addEventListener('afterprint', () => {
      URL.revokeObjectURL(url);
    });
  }
};

/**
 * Generate a branded HTML email template for invoice reminders
 * @param {Object} invoice - Invoice object
 * @param {Object} settings - Brand settings
 * @returns {string} - HTML email template
 */
export const generateInvoiceEmailTemplate = (invoice, settings = {}) => {
  const brandColor = settings.brandColor || '#3b82f6';
  const businessName = settings.businessName || 'Notary Services';
  const businessAddress = settings.businessAddress || '';
  const businessLogo = settings.businessLogo || '';
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
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice ${invoice.id}</title>
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
          background: linear-gradient(135deg, ${brandColor} 0%, ${adjustBrightness(brandColor, -20)} 100%);
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
        .content {
          padding: 2rem 1.5rem;
        }
        .greeting {
          margin-bottom: 1.5rem;
          font-size: 16px;
        }
        .invoice-box {
          background-color: #f3f4f6;
          border-left: 4px solid ${brandColor};
          padding: 1.5rem;
          margin: 1.5rem 0;
          border-radius: 4px;
        }
        .invoice-box h3 {
          margin: 0 0 1rem 0;
          color: ${brandColor};
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
          color: ${brandColor};
          font-weight: bold;
          margin-top: 0.5rem;
        }
        .cta-button {
          display: inline-block;
          background-color: ${brandColor};
          color: white;
          padding: 0.875rem 2rem;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 600;
          font-size: 16px;
          margin: 1.5rem 0;
          transition: opacity 0.2s;
        }
        .cta-button:hover {
          opacity: 0.9;
        }
        .footer {
          background-color: #f9fafb;
          padding: 1.5rem;
          border-top: 1px solid #e5e7eb;
          font-size: 12px;
          color: #6b7280;
          text-align: center;
        }
        .footer-link {
          color: ${brandColor};
          text-decoration: none;
        }
        .divider {
          height: 1px;
          background-color: #e5e7eb;
          margin: 1.5rem 0;
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

        <div class="content">
          <div class="greeting">
            <p>Hello ${invoice.client || 'Valued Client'},</p>
            <p>We have sent you an invoice for our notary services. Please review the details below and make payment by the due date.</p>
          </div>

          <div class="invoice-box">
            <h3>Invoice Details</h3>
            <div class="invoice-details">
              <div>
                <div class="detail-item">
                  <div class="detail-label">Invoice Number</div>
                  <div class="detail-value">${invoice.id}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Invoice Date</div>
                  <div class="detail-value">${invoice.date || new Date().toLocaleDateString('en-US')}</div>
                </div>
              </div>
              <div>
                <div class="detail-item">
                  <div class="detail-label">Due Date</div>
                  <div class="detail-value">${formattedDueDate}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Status</div>
                  <div class="detail-value">${invoice.status || 'Pending'}</div>
                </div>
              </div>
            </div>
            <div class="amount-highlight">${formattedAmount}</div>
          </div>

          ${invoice.paymentLink ? `
            <div style="text-align: center;">
              <a href="${invoice.paymentLink}" class="cta-button">Pay Invoice Now</a>
            </div>
            <p style="text-align: center; font-size: 12px; color: #6b7280;">
              Or copy and paste this link in your browser:<br>
              <code style="background-color: #f3f4f6; padding: 0.25rem 0.5rem; border-radius: 3px; word-break: break-all;">${invoice.paymentLink}</code>
            </p>
          ` : ''}

          <div class="divider"></div>

          <p style="font-size: 14px; color: #6b7280;">
            If you have any questions about this invoice, please don't hesitate to reach out.
          </p>
          ${emailReplyTo ? `
            <p style="font-size: 14px; color: #6b7280;">
              <strong>Reply to:</strong> <a href="mailto:${emailReplyTo}" class="footer-link">${emailReplyTo}</a>
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

/**
 * Helper to adjust hex color brightness
 * @param {string} hex - Hex color code
 * @param {number} percent - Percentage to adjust (-100 to 100)
 * @returns {string} - Adjusted hex color
 */
function adjustBrightness(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

/**
 * Export invoice as PDF
 * @param {Object} invoice - Invoice object
 * @param {Object} settings - Brand settings
 */
export const exportInvoicePDF = (invoice, settings = {}) => {
  generateInvoicePDF(invoice, settings);
};

/**
 * Copy branded email template to clipboard
 * @param {Object} invoice - Invoice object
 * @param {Object} settings - Brand settings
 */
export const copyEmailTemplateToClipboard = (invoice, settings = {}) => {
  const template = generateInvoiceEmailTemplate(invoice, settings);
  navigator.clipboard?.writeText(template).then(() => {
    console.log('Email template copied to clipboard');
  }).catch((err) => {
    console.error('Failed to copy email template:', err);
  });
};
