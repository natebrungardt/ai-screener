from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
from app.core.config import SENDGRID_API_KEY, SENDER_EMAIL, SENDER_NAME


def send_email(to_email: str, subject: str, body: str) -> None:
    message = Mail(
        from_email=Email(SENDER_EMAIL, SENDER_NAME),
        to_emails=To(to_email),
        subject=subject,
        plain_text_content=Content("text/plain", body),
    )
    sg = SendGridAPIClient(SENDGRID_API_KEY)
    response = sg.send(message)
    if response.status_code >= 400:
        raise RuntimeError(f"SendGrid error {response.status_code}: {response.body}")
