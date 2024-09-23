import { sendMail } from "../utils/mailHelper.js";
const adminMail = "learn.capitalhub@gmail.com";
// const adminMail = "adithyahebbar32@gmail.com";

export const contactUs = async (args) => {
  try {
    const { name, email, mobile, inquiryType, description, isEcom, page } = args;
    let emailMessage = "";
    if (isEcom) {
      emailMessage = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            /* Define your CSS styles here */
            body {
              font-family: Arial, sans-serif;
              background-color: #f5f5f5;
            }
            .container {
              border: 1px solid #e0e0e0;
              padding: 20px;
              border-radius: 5px;
              background-color: #fff;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              max-width: 600px;
              margin: 0 auto;
            }
            h2 {
              color: #333;
            }
            ul {
              list-style-type: none;
              padding: 0;
            }
            li {
              margin-bottom: 10px;
            }
            strong {
              font-weight: bold;
            }
            p {
              margin-top: 20px;
              color: #555;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Contact Us Form</h2>
            <ul>
              <li><strong>Name:</strong> ${name}</li>
              <li><strong>Email:</strong> ${email}</li>
              <li><strong>Mobile Number:</strong> ${mobile}</li>
              <li><strong>Type of Application:</strong> ${inquiryType}</li>
              <li><strong>Comments:</strong> ${description}</li>
            </ul>
            <p><strong>Page From:</strong> ${page}</p>
          </div>
        </body>
        </html>
      `;

    } else {
      emailMessage = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          /* Define your CSS styles here */
          body {
            font-family: Arial, sans-serif;
          }
          .container {
            border: 1px solid #e0e0e0;
            padding: 10px;
            border-radius: 5px;
            background-color: #f9f9f9;
          }
          h2 {
            color: #333;
          }
          ul {
            list-style-type: none;
            padding: 0;
          }
          li {
            margin-bottom: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Contact Us Inquiry</h2>
          <ul>
            <li><strong>Name:</strong> ${name}</li>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Mobile Number:</strong> ${mobile}</li>
            <li><strong>Inquiry Type:</strong> ${inquiryType}</li>
            <li><strong>Description:</strong></li>
          </ul>
          <p>${description}</p>
        </div>
      </body>
      </html>
      `;
    }


    const response = await sendMail(
      "Contact Us Form",
      adminMail,
      email,
      "Contact Us Inquiry",
      emailMessage
    );

    if (response.status === 200) {
      return {
        status: 200,
        message: "Your inquiry has been sent successfully.",
      };
    } else {
      return {
        status: 500,
        message: "An error occurred while sending your inquiry.",
      };
    }
  } catch (error) {
    console.error("Error sending mail:", error);
    return {
      status: 500,
      message: "An error occurred while sending mail.",
    };
  }
}


export const lookingForFundingMail = async (args, email, name) => {
  try {
    const {
      whoAreYou,
      yourBuildBefore,
      whyDoingThis,
      problem,
      solution,
      targetMarket,
      mvpProductYet,
      gainedAnyTraction,
      yourNextStep,
      useTheFundingRaised,
    } = args;
    let emailMessage = `
    <html>

<head>
  <style>
    body {
      font-family: 'Arial', sans-serif;
    }

    .container {
      max-width: 600px;
      margin: 20px auto;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 5px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }

    h2 {
      color: #333;
    }

    p {
      color: #666;
    }

    strong {
      color: #333;
    }

    .question {
      margin-bottom: 10px;
    }

    .answer {
      margin-bottom: 20px;
      margin-left: 20px;
    }
  </style>
</head>

<body>
  <div class="container">
    <h2>Looking For Funding Mail Submission</h2>

    <div class="question">
      <p class="answer"><strong>Name:</strong> ${name}</p>
    </div>

    <div class="question">
      <p class="answer"><strong>Email:</strong> ${email}</p>
    </div>

    <div class="question">
      <p class="answer"><strong>Who are you?:</strong> ${whoAreYou}</p>
    </div>

    <div class="question">
      <p class="answer"><strong>What have your team built before?:</strong> ${yourBuildBefore}</p>
    </div>

    <div class="question">
      <p class="answer"><strong>Why are you doing this?:</strong> ${whyDoingThis}</p>
    </div>

    <div class="question">
      <p class="answer"><strong>What problem are you solving?:</strong> ${problem}</p>
    </div>

    <div class="question">
      <p class="answer"><strong>What's your solution?:</strong> ${solution}</p>
    </div>

    <div class="question">
      <p class="answer"><strong>Who is your target market?:</strong> ${targetMarket}</p>
    </div>

    <div class="question">
      <p class="answer"><strong>Have you built a Minimum Viable Product (MVP) yet?:</strong> ${mvpProductYet}</p>
    </div>

    <div class="question">
      <p class="answer"><strong>Have you gained any traction on your idea/MVP so far?:</strong> ${gainedAnyTraction}</p>
    </div>

    <div class="question">
      <p class="answer"><strong>What are your next steps?:</strong> ${yourNextStep}</p>
    </div>

    <div class="question">
      <p class="answer"><strong>How will you use the funding raised through Capital HUB?:</strong> ${useTheFundingRaised}</p>
    </div>
  </div>
</body>

</html>

  `;

    const response = await sendMail(
      "Contact Us Form",
      adminMail,
      email,
      "Contact Us Inquiry",
      emailMessage
    );

    if (response.status === 200) {
      return {
        status: 200,
        message: "Your form has been sent successfully.",
      };
    } else {
      return {
        status: 500,
        message: "An error occurred while sending your inquiry.",
      };
    }

  } catch (error) {
    console.error("Error sending mail:", error);
    return {
      status: 500,
      message: "An error occurred while sending mail.",
    };
  }
}