import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface SubscriptionPassData {
  subscriptionId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  gymName: string;
  gymAddress: string;
  gymPhone: string;
  subscriptionName: string;
  subscriptionDescription: string;
  durationInDays: number;
  startDate: string;
  endDate: string;
  cost: number;
  currency: string;
  features: string[];
  qrCode?: string;
}

export class PDFGenerator {
  static async generateSubscriptionPass(data: SubscriptionPassData): Promise<void> {
    // Create a temporary div element to render the pass
    const passElement = document.createElement('div');
    passElement.id = 'subscription-pass';
    passElement.style.cssText = `
      width: 210mm;
      min-height: 297mm;
      padding: 20mm;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-family: 'Arial', sans-serif;
      position: absolute;
      top: -9999px;
      left: -9999px;
    `;

    // Generate the pass HTML
    passElement.innerHTML = this.generatePassHTML(data);

    // Append to body temporarily
    document.body.appendChild(passElement);

    try {
      // Convert to canvas
      const canvas = await html2canvas(passElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        width: 794, // A4 width in pixels at 96 DPI
        height: 1123, // A4 height in pixels at 96 DPI
      });

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Add the image to PDF
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);

      // Download the PDF
      pdf.save(`Neyofit-pass-${data.subscriptionId}.pdf`);
    } finally {
      // Clean up
      document.body.removeChild(passElement);
    }
  }

  private static generatePassHTML(data: SubscriptionPassData): string {
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    const formatCurrency = (amount: number, currency: string) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency,
      }).format(amount);
    };

    return `
      <div style="background: white; border-radius: 20px; padding: 30px; color: #333; position: relative; overflow: hidden;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px; position: relative;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 15px; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Neyofit</h1>
            <p style="margin: 5px 0 0 0; font-size: 16px; opacity: 0.9;">Gym Membership Pass</p>
          </div>
          
          <!-- QR Code Placeholder -->
          <div style="width: 120px; height: 120px; background: #f0f0f0; border: 2px dashed #ccc; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; border-radius: 10px;">
            <div style="text-align: center; color: #666;">
              <div style="font-size: 12px;">QR Code</div>
              <div style="font-size: 10px;">${data.subscriptionId.slice(-8)}</div>
            </div>
          </div>
        </div>

        <!-- User Information -->
        <div style="background: #f8f9fa; padding: 20px; border-radius: 15px; margin-bottom: 25px;">
          <h2 style="margin: 0 0 15px 0; font-size: 20px; color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Member Information</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <strong>Name:</strong><br>
              <span style="color: #666;">${data.userName}</span>
            </div>
            <div>
              <strong>Email:</strong><br>
              <span style="color: #666;">${data.userEmail}</span>
            </div>
            <div>
              <strong>Phone:</strong><br>
              <span style="color: #666;">${data.userPhone}</span>
            </div>
            <div>
              <strong>Pass ID:</strong><br>
              <span style="color: #666; font-family: monospace;">${data.subscriptionId}</span>
            </div>
          </div>
        </div>

        <!-- Gym Information -->
        <div style="background: #e8f4fd; padding: 20px; border-radius: 15px; margin-bottom: 25px;">
          <h2 style="margin: 0 0 15px 0; font-size: 20px; color: #333; border-bottom: 2px solid #2196f3; padding-bottom: 10px;">Gym Details</h2>
          <div>
            <div style="margin-bottom: 10px;">
              <strong>Gym Name:</strong><br>
              <span style="color: #666; font-size: 18px;">${data.gymName}</span>
            </div>
            <div style="margin-bottom: 10px;">
              <strong>Address:</strong><br>
              <span style="color: #666;">${data.gymAddress}</span>
            </div>
            <div>
              <strong>Contact:</strong><br>
              <span style="color: #666;">${data.gymPhone}</span>
            </div>
          </div>
        </div>

        <!-- Subscription Details -->
        <div style="background: #f0f8e8; padding: 20px; border-radius: 15px; margin-bottom: 25px;">
          <h2 style="margin: 0 0 15px 0; font-size: 20px; color: #333; border-bottom: 2px solid #4caf50; padding-bottom: 10px;">Subscription Details</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <strong>Plan:</strong><br>
              <span style="color: #666; font-size: 16px;">${data.subscriptionName}</span>
            </div>
            <div>
              <strong>Duration:</strong><br>
              <span style="color: #666;">${data.durationInDays} days</span>
            </div>
            <div>
              <strong>Start Date:</strong><br>
              <span style="color: #666;">${formatDate(data.startDate)}</span>
            </div>
            <div>
              <strong>End Date:</strong><br>
              <span style="color: #666;">${formatDate(data.endDate)}</span>
            </div>
            <div>
              <strong>Amount Paid:</strong><br>
              <span style="color: #4caf50; font-size: 18px; font-weight: bold;">${formatCurrency(data.cost, data.currency)}</span>
            </div>
            <div>
              <strong>Status:</strong><br>
              <span style="color: #4caf50; font-weight: bold;">✓ Active</span>
            </div>
          </div>
          
          ${data.subscriptionDescription ? `
            <div style="margin-top: 15px;">
              <strong>Description:</strong><br>
              <span style="color: #666;">${data.subscriptionDescription}</span>
            </div>
          ` : ''}
        </div>

        <!-- Features -->
        ${data.features && data.features.length > 0 ? `
          <div style="background: #fff3e0; padding: 20px; border-radius: 15px; margin-bottom: 25px;">
            <h2 style="margin: 0 0 15px 0; font-size: 20px; color: #333; border-bottom: 2px solid #ff9800; padding-bottom: 10px;">Included Features</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
              ${data.features.map(feature => `
                <div style="display: flex; align-items: center; padding: 8px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <span style="color: #4caf50; margin-right: 8px; font-weight: bold;">✓</span>
                  <span style="color: #333;">${feature}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e0e0e0;">
          <div style="background: #667eea; color: white; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
            <div style="font-size: 14px; font-weight: bold; margin-bottom: 5px;">Important Instructions</div>
            <div style="font-size: 12px; opacity: 0.9;">
              • Present this pass at the gym for entry<br>
              • Valid only for the specified duration<br>
              • Non-transferable and non-refundable<br>
              • Keep this pass safe and do not share
            </div>
          </div>
          
          <div style="color: #666; font-size: 12px;">
            <div>Generated on ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}</div>
            <div style="margin-top: 5px;">© 2024 Neyofit. All rights reserved.</div>
          </div>
        </div>

        <!-- Decorative elements -->
        <div style="position: absolute; top: 20px; right: 20px; width: 100px; height: 100px; background: linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05)); border-radius: 50%; opacity: 0.3;"></div>
        <div style="position: absolute; bottom: 20px; left: 20px; width: 60px; height: 60px; background: linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05)); border-radius: 50%; opacity: 0.3;"></div>
      </div>
    `;
  }
}
