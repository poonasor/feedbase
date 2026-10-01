import { JSXElementConstructor, ReactElement } from 'react';
import { Resend } from 'resend';

export const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Sender address for transactional email. Its domain must be verified in the
// Resend account owning RESEND_API_KEY (https://resend.com/domains). Accepts a
// bare address or a full "Name <address>" value. Falls back to the deployment's
// root domain, and finally to the original feedbase.app address.
const systemFrom = (() => {
  const configured = process.env.RESEND_FROM_EMAIL;
  if (configured) return configured.includes('<') ? configured : `Feedbase <${configured}>`;
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  if (rootDomain) return `Feedbase <system@${rootDomain}>`;
  return 'Feedbase <system@feedbase.app>';
})();

export const sendEmail = async ({
  email,
  subject,
  react,
  marketing,
  test = process.env.NODE_ENV === 'development',
}: {
  email: string;
  subject: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  react: ReactElement<any, string | JSXElementConstructor<any>>;
  marketing?: boolean;
  test?: boolean;
}) => {
  if (!resend) {
    throw new Error(
      'Resend is not configured. You need to add a RESEND_API_KEY in your .env file for emails to work.'
    );
  }
  return resend.emails.send({
    from: marketing ? 'Christo from Feedbase <christo@feedbase.app>' : systemFrom,
    to: test ? 'delivered@resend.dev' : email,
    subject,
    react,
  });
};

export const sendBatchEmails = async ({
  emails,
  subject,
  reactEmails,
  headers,
  marketing,
  test = process.env.NODE_ENV === 'development',
}: {
  emails: string[];
  subject: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reactEmails: ReactElement<any, string | JSXElementConstructor<any>>[];
  headers?: Record<string, string>[];
  marketing?: boolean;
  test?: boolean;
}) => {
  if (!resend) {
    throw new Error(
      'Resend is not configured. You need to add a RESEND_API_KEY in your .env file for emails to work.'
    );
  }

  if (emails.length !== reactEmails.length) {
    throw new Error('emails and reactEmails arrays must be the same length.');
  }

  if (headers && emails.length !== headers.length) {
    throw new Error('emails and headers arrays must be the same length.');
  }

  return resend.batch.create(
    emails.map((email) => ({
      from: marketing ? 'Christo from Feedbase <christo@feedbase.app>' : systemFrom,
      to: test ? 'delivered@resend.dev' : email,
      subject,
      headers: headers ? headers[emails.indexOf(email)] : undefined,
      react: reactEmails[emails.indexOf(email)],
    }))
  );
};
