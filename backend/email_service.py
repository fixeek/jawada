"""
Email service — Azure Communication Services email module.

Sends transactional emails: welcome, password reset, KPI calculation summary,
login alerts, etc. Designed to fail gracefully — if email is not configured,
the rest of the app continues to work.
"""
import os
import logging
from typing import Optional

log = logging.getLogger("jawda.email")

ACS_CONNECTION_STRING = os.environ.get("ACS_CONNECTION_STRING", "")
EMAIL_SENDER = os.environ.get("EMAIL_SENDER", "DoNotReply@3d672993-0cdd-4810-b4a3-ec5b0627f350.azurecomm.net")
EMAIL_FROM_NAME = os.environ.get("EMAIL_FROM_NAME", "Jawda KPI Platform")
EMAIL_REPLY_TO = os.environ.get("EMAIL_REPLY_TO", "")
APP_URL = os.environ.get("APP_URL", "https://jawda.trizodiac.com")

_client = None
_enabled = False

try:
    if ACS_CONNECTION_STRING:
        from azure.communication.email import EmailClient
        _client = EmailClient.from_connection_string(ACS_CONNECTION_STRING)
        _enabled = True
        log.info("✓ Email service ready (Azure Communication Services)")
    else:
        log.warning("⚠ ACS_CONNECTION_STRING not set — emails will be skipped")
except Exception as e:
    log.warning(f"⚠ Email service init failed: {e}")


def is_enabled() -> bool:
    return _enabled


def _send(to_email: str, subject: str, html: str, plain_text: Optional[str] = None) -> bool:
    """Send a single email. Returns True on success, False on failure.
    Never raises — errors are logged so caller code is unaffected."""
    if not _enabled or not _client:
        log.debug(f"Email skipped (not enabled): {subject} -> {to_email}")
        return False

    try:
        message = {
            "senderAddress": EMAIL_SENDER,
            "recipients": {
                "to": [{"address": to_email}],
            },
            "content": {
                "subject": subject,
                "html": html,
                "plainText": plain_text or "Please view this email in HTML format.",
            },
        }
        if EMAIL_REPLY_TO:
            message["replyTo"] = [{"address": EMAIL_REPLY_TO}]

        poller = _client.begin_send(message)
        result = poller.result()
        status = result.get("status") if isinstance(result, dict) else getattr(result, "status", "unknown")
        log.info(f"Email sent: {subject} -> {to_email} ({status})")
        return True
    except Exception as e:
        log.error(f"Email send failed: {subject} -> {to_email}: {e}")
        return False


# ─────────────────────────────────────────────────────────────────────────
# Email templates
# ─────────────────────────────────────────────────────────────────────────

def _wrap(title: str, body_html: str, cta_text: Optional[str] = None, cta_url: Optional[str] = None) -> str:
    """Wrap content in branded HTML template."""
    cta_block = ""
    if cta_text and cta_url:
        cta_block = f'''
        <div style="text-align:center; margin: 32px 0;">
          <a href="{cta_url}" style="display:inline-block; background:linear-gradient(135deg,#0D2137,#1F4E79); color:#ffffff; padding:14px 32px; border-radius:10px; text-decoration:none; font-weight:700; font-size:14px;">{cta_text}</a>
        </div>
        '''

    return f'''<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
</head>
<body style="margin:0; padding:0; background:#F0F4F8; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F0F4F8; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff; border-radius:16px; box-shadow:0 4px 12px rgba(13,33,55,0.06); overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0D2137 0%,#1F4E79 100%); padding: 28px 32px; text-align:left;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#14B8A6,#0F766E); width:36px; height:36px; border-radius:10px; text-align:center; vertical-align:middle;">
                    <span style="color:#ffffff; font-weight:900; font-size:14px;">J</span>
                  </td>
                  <td style="padding-left:12px; vertical-align:middle;">
                    <div style="color:#ffffff; font-weight:800; font-size:15px; letter-spacing:-0.2px;">Jawda KPI Platform</div>
                    <div style="color:#9FB3C8; font-size:10px; font-weight:500; letter-spacing:0.5px; text-transform:uppercase;">by TriZodiac</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 36px 36px 12px 36px;">
              <h1 style="margin:0 0 16px 0; color:#0D2137; font-size:22px; font-weight:900; letter-spacing:-0.4px; line-height:1.2;">{title}</h1>
              <div style="color:#475569; font-size:14px; line-height:1.6;">
                {body_html}
              </div>
              {cta_block}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 16px 36px 28px 36px; border-top:1px solid #F0F4F8;">
              <div style="color:#94A3B8; font-size:11px; line-height:1.5; text-align:center;">
                Jawda KPI Platform · DOH V2 2026 · ADHICS Compliant<br>
                Powered by TriZodiac · UAE North Region
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>'''


def send_welcome_email(to_email: str, full_name: str, temp_password: str, role: str, facility_name: Optional[str] = None) -> bool:
    """Welcome email for newly created users with their temporary password."""
    role_label = role.replace("_", " ").title()
    facility_block = f'<p style="margin:8px 0;"><strong>Clinic:</strong> {facility_name}</p>' if facility_name else ''

    body = f'''
    <p>Hello <strong>{full_name}</strong>,</p>
    <p>Your account on the Jawda KPI Platform has been created. Below are your login details:</p>

    <div style="background:#F8FAFC; border-left:4px solid #14B8A6; padding:16px 20px; margin: 20px 0; border-radius:8px;">
      <p style="margin:8px 0;"><strong>Email:</strong> {to_email}</p>
      <p style="margin:8px 0;"><strong>Temporary password:</strong> <code style="background:#fff; padding:4px 8px; border-radius:4px; font-family:monospace; color:#0D2137;">{temp_password}</code></p>
      <p style="margin:8px 0;"><strong>Role:</strong> {role_label}</p>
      {facility_block}
    </div>

    <p><strong>You will be required to change your password on first login.</strong></p>
    <p>If you didn't expect this email, please contact your administrator.</p>
    '''

    return _send(
        to_email=to_email,
        subject="Welcome to Jawda KPI Platform — Your account is ready",
        html=_wrap("Welcome to Jawda KPI", body, cta_text="Sign In", cta_url=APP_URL),
        plain_text=f"Hello {full_name},\n\nYour Jawda KPI account has been created.\n\nEmail: {to_email}\nPassword: {temp_password}\nRole: {role_label}\n\nSign in at {APP_URL}\n\nYou'll be required to change your password on first login.",
    )


def send_kpi_calculation_email(to_email: str, full_name: str, facility_name: str,
                                quarter: str, summary: dict) -> bool:
    """Notify a user that KPIs were calculated for their clinic."""
    verdict = summary.get("verdict", "")
    meeting = summary.get("meeting_target", 0)
    calculable = summary.get("calculable", 0)
    missing = summary.get("missing_data", 0)

    verdict_label = {
        "ready": "Ready for Submission",
        "attention": "Needs Attention",
        "not_ready": "Not Ready",
    }.get(verdict, "Calculated")

    verdict_color = {
        "ready": "#059669",
        "attention": "#D97706",
        "not_ready": "#DC2626",
    }.get(verdict, "#475569")

    body = f'''
    <p>Hello <strong>{full_name}</strong>,</p>
    <p>KPI calculations for <strong>{facility_name}</strong> have been completed for <strong>{quarter}</strong>.</p>

    <div style="background:#F8FAFC; padding:20px; border-radius:10px; margin:20px 0;">
      <p style="margin:6px 0; font-size:13px; color:#64748B;">Status</p>
      <p style="margin:6px 0; font-size:18px; font-weight:900; color:{verdict_color};">{verdict_label}</p>
      <hr style="border:none; border-top:1px solid #E2E8F0; margin:16px 0;">
      <p style="margin:6px 0; font-size:13px;"><strong>{meeting} of {calculable}</strong> KPIs meeting DOH targets</p>
      {f'<p style="margin:6px 0; font-size:13px; color:#DC2626;"><strong>{missing}</strong> KPIs cannot be calculated (missing data)</p>' if missing else ''}
    </div>

    <p>Sign in to view the full results, action plan, and audit trail.</p>
    '''

    return _send(
        to_email=to_email,
        subject=f"KPI Results Ready — {facility_name} ({quarter})",
        html=_wrap(f"{quarter} Results: {verdict_label}", body, cta_text="View Dashboard", cta_url=APP_URL),
        plain_text=f"KPI calculations for {facility_name} ({quarter}) are ready.\n\nVerdict: {verdict_label}\n{meeting}/{calculable} KPIs meeting target.\n\nView at {APP_URL}",
    )


def send_password_reset_email(to_email: str, full_name: str, temp_password: str, reset_by: str) -> bool:
    """Sent when an admin resets a user's password."""
    body = f'''
    <p>Hello <strong>{full_name}</strong>,</p>
    <p>Your Jawda KPI Platform password was reset by <strong>{reset_by}</strong>. Use the temporary password below to sign in:</p>

    <div style="background:#F8FAFC; border-left:4px solid #14B8A6; padding:16px 20px; margin: 20px 0; border-radius:8px;">
      <p style="margin:8px 0;"><strong>Email:</strong> {to_email}</p>
      <p style="margin:8px 0;"><strong>Temporary password:</strong> <code style="background:#fff; padding:4px 8px; border-radius:4px; font-family:monospace; color:#0D2137;">{temp_password}</code></p>
    </div>

    <p><strong>You will be required to set a new password on next login.</strong></p>
    <p>If you did not request this reset, please contact your administrator immediately.</p>
    '''
    return _send(
        to_email=to_email,
        subject="Your Jawda KPI password was reset",
        html=_wrap("Password Reset", body, cta_text="Sign In", cta_url=APP_URL),
        plain_text=f"Hello {full_name},\n\nYour Jawda KPI password was reset by {reset_by}.\n\nEmail: {to_email}\nTemporary password: {temp_password}\n\nSign in at {APP_URL} — you'll be required to set a new password.",
    )


def send_password_changed_email(to_email: str, full_name: str) -> bool:
    """Confirm password change."""
    body = f'''
    <p>Hello <strong>{full_name}</strong>,</p>
    <p>Your Jawda KPI Platform password was changed successfully.</p>
    <p>If you did not make this change, please contact your administrator immediately.</p>
    '''
    return _send(
        to_email=to_email,
        subject="Your password was changed",
        html=_wrap("Password Updated", body),
        plain_text=f"Hello {full_name}, your Jawda KPI password was changed. If this wasn't you, contact your administrator.",
    )
