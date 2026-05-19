import cron from "node-cron";
import { db } from "../config/db_config";
import { smsQueue } from "../queue/sms_queue";

export const startReminderJob = () => {
  cron.schedule("0 9 * * *", async () => {
    console.info("Checking reminders...");

    try {
      const query = `
        SELECT
          visits.id AS visit_id,
          customers.first_name,
          customers.phone_number,
          visits.service_type
        FROM visits
        JOIN customers
          ON visits.customer_id = customers.id
        WHERE visits.reminder_date = CURDATE()
          AND visits.sms_sent = FALSE
          AND customers.opt_out = FALSE
      `;

      const [rows]: any = await db.execute(query);

      for (const customer of rows) {
        await smsQueue.add(
          "send-reminder",
          {
            visit_id: customer.visit_id,
            first_name: customer.first_name,
            phone_number: customer.phone_number,
            service_type: customer.service_type,
          },
          {
            attempts: 3,
            backoff: {
              type: "exponential",
              delay: 5000,
            },
            removeOnComplete: true,
            removeOnFail: false,
          },
        );
      }

      console.info(`${rows.length} jobs added to queue`);
    } catch (error) {
      console.error(error);
    }
  });
};

// import { Request, Response } from "express";
// import cron from "node-cron";
// import { db } from "../config/db_config";
// import { sendMessage } from "../config/twilio_configs";

// export const startReminderJob = () => {
//   // Runs every day at 9:00 AM
//   cron.schedule("0 9 * * *", async () => {
//     console.info("Running reminder job...");

//     try {
//       // Get today's reminders
//       const query = `
//         SELECT
//           visits.id AS visit_id,
//           customers.first_name,
//           customers.phone_number,
//           visits.service_type,
//           visits.reminder_date
//         FROM visits
//         JOIN customers
//           ON visits.customer_id = customers.id
//         WHERE visits.reminder_date = CURDATE()
//           AND visits.sms_sent = FALSE
//           AND customers.opt_out = FALSE
//       `;

//       const [rows]: any = await db.execute(query);

//       if (rows.length === 0) {
//         console.log("No reminders for today");
//         return;
//       }

//       for (const customer of rows) {
//         try {
//           // =====================================
//           // SEND SMS
//           // =====================================

//           console.info(`
//             Sending reminder to ${customer.phone_number}
//           `);

//           // Example SMS text
//           const message = `
// Hi ${customer.first_name || "Customer"},
// Your ${customer.service_type} service reminder is due today.
// Please visit us again. Thank you!
//           `;

//           console.log(message);
//           const isSuccess = await sendMessage(message, customer.phone_number);

//           // =====================================
//           // AFTER SMS SUCCESS
//           // =====================================
//           if (!isSuccess) {
//             // SEND TO QUEUE FOR RESEND
//             console.error("Can't send the message to the user");
//             continue;
//           }
//           const updateQuery = `
//             UPDATE visits
//             SET sms_sent = TRUE,
//                 sms_sent_at = NOW()
//             WHERE id = ?
//           `;

//           await db.execute(updateQuery, [customer.visit_id]);
//         } catch (smsError: any) {
//           console.error("SMS Send Error:", smsError);

//           // Save failure reason
//           await db.execute(
//             `
//             UPDATE visits
//             SET sms_failure_reason = ?
//             WHERE id = ?
//             `,
//             [smsError.message, customer.visit_id],
//           );
//         }
//       }

//       console.log("Reminder job completed");
//     } catch (error) {
//       console.error("Reminder Job Error:", error);
//     }
//   });
// };
