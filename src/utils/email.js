import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, subject, text) => {
  await resend.emails.send({
    from: 'no-reply@3suniverse.com', // Update this to your verified domain in Resend
    to,
    subject,
    text
  });
  console.log(`Email sent to ${to}`);
};

export default sendEmail;