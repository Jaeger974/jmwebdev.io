export function samplePoemHTML(recipientName, poemTitle, poemAuthor, poemHTML, unsubscribeToken) {

const unwantedEmail = 
  `http://localhost:3000/unwanted-email?token=${unsubscribeToken}`;


  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">
  <head>
    <meta content="width=device-width" name="viewport" />
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta content="IE=edge" http-equiv="X-UA-Compatible" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta content="telephone=no,address=no,email=no,date=no,url=no" name="format-detection" />

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

      .stop-request {
        text-align: center;
        margin-top: 20px;
        color: #7a6f6f;
        text-decoration: none; 
      }

      .cta-button {
        align: center;
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
                      <h1>Someone's thinking of you 💘</h1>

                      <p>You've been hit by an Amore</p>

                      <p>
                        Oop — guess what. Someone just dropped an Amore on you like a chaotic emotional grenade.<br /><br />
                        Yep. A real human being thought, "You know who deserves unsolicited tenderness today?
                        <em>You.</em>"
                      </p>

                      <div class="divider"></div>

                      <h2>${poemTitle}</h2>

                      <h3>${poemAuthor}</h3>
                      <p>${poemHTML}</p>

                      <div class="divider"></div>
                      <p>
                        If you're not vibing with these poetic love‑bombs, you can tell Cupid to chill by clicking
                        below.
                      </p>

                      <p class="stop-request"> 
                      <a href="${unwantedEmail}">Please stop emotionally ambushing me with poems.</a>
                      </p>

                      <div class="divider"></div>

                      <div class="footer">
                        <p>
                          Sent with chaotic affection by
                          <strong><a href="http://localhost:3000/">Amourly</a></strong> 💌
                        </p>
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
  </body>
</html>`;
}