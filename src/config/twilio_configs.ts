require("dotenv").config();
import twilio from "twilio";

// Initialize the Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);

export async function sendMessage(body: string, to: string) {
  try {
    const message = await client.messages.create({
      body: body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to,
    });

    return true;
  } catch (error: any) {
    console.error(`Error sending message: ${error.message}`);
    return false;
  }
}
