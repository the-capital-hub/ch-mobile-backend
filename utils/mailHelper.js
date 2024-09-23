import emailjs from '@emailjs/nodejs';

export const sendMail = async (from_name, to_mail, from_mail, subject, message) => {
    emailjs.init({
        publicKey: process.env.EMAILJS_PUBLIC_KEY,
        privateKey: process.env.EMAILJS_PRIVATE_KEY,
      });
      const response = await emailjs.send(
        process.env.EMAILJS_SERVICE_ID,
        process.env.EMAILJS_TEMPLATE_ID,
        {
          subject: subject,
          message: message, 
          to_mail: to_mail,
          from_name: from_name,   
          from_mail: from_mail,
        },
      )
      return response;
}
