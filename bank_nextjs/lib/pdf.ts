// @ts-nocheck
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Generates a highly detailed, professional fintech receipt (PDF) for a transaction
 */
export async function generateReceiptPdf(
    transactionId: string,
    amount: string,
    date: Date,
    senderName: string,
    senderAccount: string,
    receiverName: string,
    receiverAccount: string,
    description: string
): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    
    // Create an A4 sized page (roughly 600x800)
    const page = pdfDoc.addPage([600, 800]);
    const { height, width } = page.getSize();

    // Load standard fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // --- LOGO & BANK DETAILS ---
    // Text Logo
    page.drawText('IDPBANK', { 
        x: 50, y: height - 80, size: 28, font: boldFont, color: rgb(0.1, 0.3, 0.6) 
    });
    
    // Bank Address
    page.drawText('123 Financial District, New York, NY 10005', { 
        x: 50, y: height - 100, size: 10, font, color: rgb(0.4, 0.4, 0.4) 
    });
    page.drawText('support@idpbank23.com | +1 (800) 555-0199', { 
        x: 50, y: height - 115, size: 10, font, color: rgb(0.4, 0.4, 0.4) 
    });

    // "RECEIPT" Watermark/Title on the right
    page.drawText('RECEIPT', { 
        x: width - 200, y: height - 90, size: 36, font: boldFont, color: rgb(0.9, 0.9, 0.9) 
    });

    // Separator line
    page.drawLine({
      start: { x: 50, y: height - 140 },
      end: { x: width - 50, y: height - 140 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8)
    });

    // --- TRANSACTION METADATA ---
    page.drawText('Transaction Details', { x: 50, y: height - 180, size: 16, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
    
    page.drawText('Receipt ID:', { x: 50, y: height - 210, size: 12, font: boldFont });
    page.drawText(transactionId, { x: 150, y: height - 210, size: 12, font });

    page.drawText('Date & Time:', { x: 350, y: height - 210, size: 12, font: boldFont });
    page.drawText(date.toLocaleString(), { x: 440, y: height - 210, size: 12, font });

    page.drawText('Operation Type:', { x: 50, y: height - 235, size: 12, font: boldFont });
    page.drawText('Online Transfer', { x: 150, y: height - 235, size: 12, font });

    page.drawText('Status:', { x: 350, y: height - 235, size: 12, font: boldFont });
    page.drawText('SUCCESS', { x: 440, y: height - 235, size: 12, font: boldFont, color: rgb(0.1, 0.6, 0.2) });

    // --- SENDER & RECEIVER BOXES ---
    // Background for Sender
    page.drawRectangle({
        x: 50, y: height - 370,
        width: 230, height: 100,
        color: rgb(0.96, 0.96, 0.98),
        borderColor: rgb(0.9, 0.9, 0.9),
        borderWidth: 1,
    });
    page.drawText('SENDER', { x: 60, y: height - 290, size: 12, font: boldFont, color: rgb(0.4, 0.4, 0.5) });
    page.drawText(senderName, { x: 60, y: height - 315, size: 14, font: boldFont });
    page.drawText('Account:', { x: 60, y: height - 335, size: 10, font, color: rgb(0.5, 0.5, 0.5) });
    page.drawText(senderAccount, { x: 60, y: height - 350, size: 10, font });

    // Background for Receiver
    page.drawRectangle({
        x: 320, y: height - 370,
        width: 230, height: 100,
        color: rgb(0.96, 0.96, 0.98),
        borderColor: rgb(0.9, 0.9, 0.9),
        borderWidth: 1,
    });
    page.drawText('RECEIVER', { x: 330, y: height - 290, size: 12, font: boldFont, color: rgb(0.4, 0.4, 0.5) });
    page.drawText(receiverName, { x: 330, y: height - 315, size: 14, font: boldFont });
    page.drawText('Account:', { x: 330, y: height - 335, size: 10, font, color: rgb(0.5, 0.5, 0.5) });
    page.drawText(receiverAccount, { x: 330, y: height - 350, size: 10, font });


    // --- AMOUNT & DESCRIPTION ---
    page.drawLine({
        start: { x: 50, y: height - 410 },
        end: { x: width - 50, y: height - 410 },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8)
    });

    page.drawText('Description:', { x: 50, y: height - 450, size: 14, font: boldFont });
    page.drawText(description || 'Money Transfer', { x: 150, y: height - 450, size: 14, font });

    page.drawText('Amount Transferred:', { x: 50, y: height - 490, size: 16, font: boldFont });
    page.drawText(`$${amount}`, { 
        x: 220, y: height - 492, size: 24, font: boldFont, color: rgb(0.1, 0.4, 0.8) 
    });

    // --- FOOTER ---
    page.drawLine({
        start: { x: 50, y: 100 },
        end: { x: width - 50, y: 100 },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8)
    });
    
    page.drawText('This is a computer generated receipt and does not require a physical signature.', { 
        x: 50, y: 70, size: 10, font, color: rgb(0.5, 0.5, 0.5) 
    });
    page.drawText('Thank you for banking with IDPBank.', { 
        x: 50, y: 55, size: 10, font: boldFont, color: rgb(0.4, 0.4, 0.4) 
    });

    // Return as a binary Buffer
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
}
