import nodemailer from 'nodemailer';

let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // boolean, no string
  auth: {
    user: "icsgr6@gmail.com",
    pass: "kpqtfwwfdwrzbyyz",
  },
});

// 📬 Envío de confirmación de ticket
export async function sendTicketConfirmation(ticket) {
  console.log('📧 Enviando email de confirmación para ticket:', ticket);
  const from = 'tizichiaro@gmail.com';
  const toEmail = ticket.userMail;
  const subject = `Confirmación de compra - Ticket #${ticket.id}`;

  // 🧾 Visitantes
  let visitantesHTML = '<li>Sin visitantes</li>';
  let visitantesTexto = 'Sin visitantes';
  if (Array.isArray(ticket.visitantes) && ticket.visitantes.length > 0) {
    visitantesTexto = ticket.visitantes
      .map((v, i) => `Visitante ${i + 1}: Edad ${v.edad}, Pase ${v.tipoPase}`)
      .join('\n');
    visitantesHTML = ticket.visitantes
      .map(
        (v, i) =>
          `<li><strong>Visitante ${i + 1}</strong>: Edad ${v.edad}, Pase ${v.tipoPase}</li>`
      )
      .join('');
  }
  // Preparar QR y attachments correctamente usando ticket.qrCode
  const qrCode = ticket?.qrCode || null;
  const attachments = [];
  let qrImgTag = '<p>No hay QR disponible.</p>';

  if (qrCode) {
    // Base64 data URL (e.g. 'data:image/png;base64,...')
    if (typeof qrCode === 'string' && qrCode.startsWith('data:image')) {
      const base64 = qrCode.split('base64,')[1] || qrCode;
      attachments.push({
        filename: 'qrcode.png',
        content: base64,
        encoding: 'base64',
        cid: 'qrcode@ticket',
      });
      qrImgTag = `<img src="cid:qrcode@ticket" alt="QR" style="max-width:200px;"/>`;
    } else if (typeof qrCode === 'string' && /^https?:\/\//i.test(qrCode)) {
      // Remote URL: reference directly in the HTML (no attachment)
      qrImgTag = `<img src="${qrCode}" alt="QR" style="max-width:200px;"/>`;
    } else {
      // Assume local file path: attach and reference via CID
      attachments.push({
        filename: 'qrcode.png',
        path: qrCode,
        cid: 'qrcode@ticket',
      });
      qrImgTag = `<img src="cid:qrcode@ticket" alt="QR" style="max-width:200px;"/>`;
    }
  }

  // 🧱 Cuerpo HTML con imagen embebida (usa CID cuando se adjunta)
  const html = `
    <p>Gracias por su compra.</p>
    <h3>Detalle de la reserva</h3>
    <ul>
      <li><strong>ID</strong>: ${ticket.id}</li>
      <li><strong>Fecha de visita</strong>: ${ticket.fechaVisita.split('T')[0]}</li>
      <li><strong>Cantidad</strong>: ${ticket.cantidad}</li>
      <li><strong>Forma de pago</strong>: ${ticket.pago}</li>
      <li><strong>User ID</strong>: ${ticket.userId}</li>
    </ul>
    <h4>Visitantes</h4>
    <ul>${visitantesHTML}</ul>
    ${qrImgTag}
    <p>¡Esperamos verlo pronto!</p>
  `;

  const mailOptions = {
    from,
    to: toEmail,
    subject,
    text: `Gracias por su compra.\n\nDetalle de la reserva:\n${visitantesTexto}\n\n¡Esperamos verlo pronto!`,
    html,
    attachments,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email enviado: ", info.messageId);
  } catch (error) {
    console.error("❌ Error de envío de email:", error);
  }
}

export default { sendTicketConfirmation };
