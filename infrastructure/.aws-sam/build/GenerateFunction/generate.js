import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const bedrock = new BedrockRuntimeClient({ region: process.env.BEDROCK_REGION || 'eu-west-2' });

const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://latepayment.ishsitotombe.co.uk',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const handler = async (event) => {
  if (event.requestContext?.http?.method === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const {
    creditorName,
    creditorCompany,
    debtorCompany,
    invoiceNumber,
    invoiceAmount,
    invoiceDate,
    paymentTermsDays,
    daysOverdue,
    tone, // 'polite' | 'firm' | 'final'
  } = body;

  const prompt = buildPrompt({ creditorName, creditorCompany, debtorCompany, invoiceNumber, invoiceAmount, invoiceDate, paymentTermsDays, daysOverdue, tone });

  const command = new InvokeModelCommand({
    modelId: 'amazon.nova-pro-v1:0',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      messages: [{ role: 'user', content: [{ text: prompt }] }],
      inferenceConfig: { maxTokens: 600, temperature: 0.3 }
    })
  });

  const response = await bedrock.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  const result = responseBody.output.message.content[0].text;

  return {
    statusCode: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ result })
  };
};

function buildPrompt({ creditorName, creditorCompany, debtorCompany, invoiceNumber, invoiceAmount, invoiceDate, paymentTermsDays, daysOverdue, tone }) {
  const formattedAmount = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(invoiceAmount);
  const dueDate = new Date(new Date(invoiceDate).getTime() + paymentTermsDays * 86400000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const invoiceDateFormatted = new Date(invoiceDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  // Statutory interest rate under Late Payment of Commercial Debts (Interest) Act 1998
  // 8% above Bank of England base rate — simplified here as a fixed reference
  const statutoryRate = 8; // above base rate — exact figure changes, we reference the Act

  if (tone === 'polite') {
    return `Write a polite but professional late payment reminder email from ${creditorName} at ${creditorCompany} to ${debtorCompany}.

Invoice details:
- Invoice number: ${invoiceNumber}
- Invoice date: ${invoiceDateFormatted}
- Amount: ${formattedAmount}
- Payment terms: ${paymentTermsDays} days
- Due date: ${dueDate}
- Days overdue: ${daysOverdue} days

This is the first chase. The tone should be friendly and assume the delay is an oversight.

Format:
Subject: [clear subject referencing invoice number and company name]

Dear [appropriate salutation for ${debtorCompany}],

[2-3 short paragraphs. First: polite reminder the invoice is overdue. Second: payment details or request for update. Third: brief friendly close.]

Yours sincerely,
${creditorName}
${creditorCompany}

Rules:
- Plain professional English. No legal threats yet.
- Include the invoice number, amount, and due date in the body.
- Sound like a real business owner, not a template.
- Output only the email. No commentary.`;
  }

  if (tone === 'firm') {
    return `Write a firm late payment notice email from ${creditorName} at ${creditorCompany} to ${debtorCompany}. This is the second or third chase.

Invoice details:
- Invoice number: ${invoiceNumber}
- Invoice date: ${invoiceDateFormatted}
- Amount: ${formattedAmount}
- Payment terms: ${paymentTermsDays} days
- Due date: ${dueDate}
- Days overdue: ${daysOverdue} days

The tone should be firm and professional. Reference that under the Late Payment of Commercial Debts (Interest) Act 1998, statutory interest at ${statutoryRate}% above the Bank of England base rate may be applied to the outstanding amount. Do not calculate the exact interest — mention the right exists.

Format:
Subject: [clear subject — second notice, invoice number]

Dear [appropriate salutation for ${debtorCompany}],

[3 short paragraphs. First: state the invoice remains unpaid despite previous contact. Second: reference the statutory right to charge interest under the 1998 Act. Third: request payment within 7 days to avoid further action.]

Yours sincerely,
${creditorName}
${creditorCompany}

Rules:
- Professional but noticeably firmer than a first reminder.
- Do not make empty threats. Only reference rights that exist under UK law.
- Output only the email. No commentary.`;
  }

  // Final notice
  return `Write a final notice letter from ${creditorName} at ${creditorCompany} to ${debtorCompany} before legal action or debt recovery.

Invoice details:
- Invoice number: ${invoiceNumber}
- Invoice date: ${invoiceDateFormatted}
- Amount: ${formattedAmount}
- Payment terms: ${paymentTermsDays} days
- Due date: ${dueDate}
- Days overdue: ${daysOverdue} days

This is the final notice before the matter is referred to a debt recovery agency or County Court. Reference:
1. The Late Payment of Commercial Debts (Interest) Act 1998 — right to claim statutory interest at ${statutoryRate}% above Bank of England base rate
2. The right to claim reasonable debt recovery costs under the same Act (£40–£100 fixed compensation depending on invoice value, plus reasonable recovery costs)
3. That a County Court Judgment (CCJ) would be recorded against ${debtorCompany}

Format:
Subject: FINAL NOTICE — Invoice ${invoiceNumber} — ${formattedAmount} — [${debtorCompany}]

Dear [appropriate salutation for ${debtorCompany}],

[4 short paragraphs. First: state this is the final notice. Second: itemise what is owed including statutory interest right. Third: reference recovery costs and CCJ consequences. Fourth: demand payment within 7 days or state the next step.]

Yours sincerely,
${creditorName}
${creditorCompany}

Rules:
- Formal letter style — this may be printed and sent.
- Strong and clear but factually accurate. Do not threaten anything that isn't real.
- Output only the letter. No commentary.`;
}
