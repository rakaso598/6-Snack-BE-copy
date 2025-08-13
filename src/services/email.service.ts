import nodemailer from 'nodemailer';

type TEmailOptions = {
  to: string;
  subject: string;
  html: string;
};

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async (options: TEmailOptions): Promise<void> => {
  try {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[이메일 발송 성공] 수신자: ${options.to}`);
  } catch (error) {
    console.error('[이메일 발송 실패]', error);
    throw new Error('이메일 발송에 실패했습니다.');
  }
};

const generateInviteEmailTemplate = (name: string, inviteLink: string, role: string, expiresAt: Date): string => {
    const roleText = role === 'ADMIN' ? '관리자' : '일반 사용자';
    const formattedExpiresAt = expiresAt.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>회사 초대</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
          }
          .invite-button {
            display: inline-block;
            background-color: #3498db;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
          }
          .invite-button:hover {
            background-color: #2980b9;
          }
          .info-box {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #3498db;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #7f8c8d;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🍽️ Snack</div>
            <h2>회사 초대</h2>
          </div>
          
          <p>안녕하세요, <strong>${name}</strong>님!</p>
          
          <p>회사 관리자가 귀하를 <strong>${roleText}</strong>로 초대했습니다.</p>
          
          <div class="info-box">
            <strong>초대 정보:</strong><br>
            • 역할: ${roleText}<br>
            • 만료일: ${formattedExpiresAt}
          </div>
          
          <p>아래 버튼을 클릭하여 회원가입을 완료해주세요:</p>
          
          <div style="text-align: center;">
            <a href="${inviteLink}" class="invite-button">회원가입 완료하기</a>
          </div>
          
          <p><strong>주의사항:</strong></p>
          <ul>
            <li>이 초대 링크는 ${formattedExpiresAt}까지 유효합니다.</li>
            <li>링크를 클릭하면 비밀번호를 설정하여 회원가입이 완료됩니다.</li>
            <li>본인이 요청하지 않은 초대라면 이 이메일을 무시하셔도 됩니다.</li>
          </ul>
          
          <div class="footer">
            <p>이 이메일은 자동으로 발송되었습니다. 문의사항이 있으시면 관리자에게 연락해주세요.</p>
          </div>
        </div>
      </body>
      </html>
    `;
};

export default {
  sendEmail,
  generateInviteEmailTemplate,
}; 