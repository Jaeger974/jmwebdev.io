export function verifyChangeEmailHTML(firstName, token) {
  const verificationLink = `http://localhost:3000/verify-email/${token}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<style>
  body, html {
    margin: 0;
    padding: 0;
    font-family: "Helvetica Neue", Arial, sans-serif;
    background-color: #fff7fa;
    color: #3a2a2a;
  }

  .container {
    max-width: 600px;
    margin: 0 auto;
    border-radius: 12px;
    padding: 32px;
  }

  h1 {
    color: #b30059;
    font-size: 30px;
    margin-bottom: 12px;
    text-align: center;
  }

  h2 {
    color: #b30059;
    font-size: 20px;
    margin-top: 28px;
    margin-bottom: 8px;
  }

  p {
    line-height: 1.6;
    font-size: 16px;
    margin-bottom: 16px;
  }

    .cta-button {
    display: inline-block;
    background: #b30059;
    color: #ffffff !important;
    padding: 10px 15px;
    border-radius: 10px;
    text-decoration: none;
    font-weight: bold;
    margin-top: 20px;
    text-align: center;
  }

  .button-wrapper {
    text-align: center;
    margin-top: 20px;
  }

  .cta-button:hover {
    background: #8a0047;
  }

  .main-text {
    background: #ffe3ec;
    padding: 20px;
    border-radius: 12px;
    margin-top: 20px;
    margin-bottom: 20px;
  }

  .poem-title {
    font-size: 24px;
    color: #b30059;
    text-align: center;
    margin-bottom: 6px;
  }

  .poem-author {
    font-size: 16px;
    text-align: center;
    color: #7a6f6f;
    margin-bottom: 16px;
  }

  

  .footer {
    text-align: center;
    margin-top: 40px;
    font-size: 13px;
    color: #7a6f6f;
  }

  .divider {
    height: 1px;
    background: #ffe3ec;
    margin: 24px 0;
  }
  
    @media (prefers-color-scheme: dark) {
    body, html {
      background-color: #2b2b2b !important;
      color: #f2f2f2 !important;
    }
    .poem-box {
      background: #3a3a3a !important;
    }
    .cta-button {
      background: #ff4f9a !important;
    }
  }

</style>

</head>
<body>
  <table
    align="center"
    width="100%"
    border="0"
    cellpadding="0"
    cellspacing="0"
    role="presentation"
    style="padding:10px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto','Oxygen','Ubuntu','Cantarell','Fira Sans','Droid Sans','Helvetica Neue',sans-serif;font-size:1.1em;line-height:155%;background-color:#fab7b7;"
  >
    <tbody>
      <tr>
        <td align="center">

          <!-- INNER ROUNDED CARD -->
          <table
            align="center"
            width="100%"
            border="0"
            cellpadding="0"
            cellspacing="0"
            role="presentation"
            style="max-width:600px;background-color:#ff8b8b;border-radius:36px;padding:20px;"
          >
            <tbody>
              <tr>
                <td align="center">

                  <!-- CONTENT CONTAINER -->
                  <div class="container">

    <p></p>

    <div class="divider"></div>

    <div class="main-text">
        <h1>${firstName}, you leveled up! We love that for you. 
        Verify Your New Email Address now:</h1>
    </div>

    <div class="divider"></div>

    <div class="button-wrapper">
      <a href="${verificationLink}" class="cta-button">
        Verify Email Address
      </a>
    </div>

    <div class="footer">
      <p>Sent with chaotic affection by <strong>Amourly</strong> 💘</p>
    </div>

  </div>
</div>
                  <!-- END CONTAINER -->

                </td>
              </tr>
            </tbody>
          </table>
          <!-- END INNER CARD -->

        </td>
      </tr>
    </tbody>
  </table>
</html>
  `;
}