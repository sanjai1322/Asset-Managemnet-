import os
from datetime import datetime

# ── Configuration ──────────────────────────────────────────────────
EMAIL_MODE = os.environ.get("EMAIL_MODE", "demo").lower()
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
MAIL_FROM = os.environ.get("MAIL_FROM", "onboarding@resend.dev")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "")

# Try importing resend SDK
try:
    import resend
    RESEND_AVAILABLE = True
except ImportError:
    resend = None  # type: ignore
    RESEND_AVAILABLE = False

# Configure resend SDK if key is present
if RESEND_API_KEY and RESEND_AVAILABLE:
    resend.api_key = RESEND_API_KEY

# In-memory sent email logs
sent_emails_log: list[dict] = []


def send_html_email(to_email: str, subject: str, html_body: str):
    """
    Send an HTML email.
    - demo mode (or missing key): log to console + in-memory list only.
    - live mode: send via Resend API, then also log to in-memory list.
    A send failure NEVER raises — errors are caught and logged.
    """
    timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    email_record = {
        "to": to_email,
        "subject": subject,
        "body": html_body,
        "timestamp": timestamp,
    }

    # Always append to in-memory log (so the UI shows it regardless)
    sent_emails_log.append(email_record)

    # Console log
    print(
        f"\n{'='*75}"
        f"\n[OUTGOING EMAIL — MODE: {EMAIL_MODE.upper()}]"
        f"\nTimestamp: {timestamp}"
        f"\nTo:        {to_email}"
        f"\nSubject:   {subject}"
        f"\n{'-'*75}"
        f"\nHTML Body Snippet:\n{html_body[:300]}..."
        f"\n{'='*75}\n"
    )

    use_live = (
        EMAIL_MODE == "live"
        and RESEND_AVAILABLE
        and bool(RESEND_API_KEY)
    )

    if use_live:
        # Sandbox mode redirect: If using the default onboarding sender,
        # redirect all emails to the verified account owner to avoid sandbox errors
        if MAIL_FROM == "onboarding@resend.dev" and to_email != "sanjai131418@gmail.com":
            print(f"[SANDBOX REDIRECT] Redirecting recipient {to_email} -> sanjai131418@gmail.com to bypass Resend restrictions")
            subject = f"[Dev Redirect from {to_email}] {subject}"
            to_email = "sanjai131418@gmail.com"
            
        try:
            params: resend.Emails.SendParams = {
                "from": MAIL_FROM,
                "to": [to_email],
                "subject": subject,
                "html": html_body,
            }
            result = resend.Emails.send(params)
            print(f"[SUCCESS] Resend email sent successfully to {to_email} (id: {result.get('id', 'N/A')})")
        except Exception as e:
            print(f"[ERROR] Resend API error sending to {to_email}: {e}")
    else:
        if EMAIL_MODE == "live":
            if not RESEND_AVAILABLE:
                print("[WARNING] EMAIL_MODE=live but 'resend' package is not installed. Kept in demo fallback.")
            elif not RESEND_API_KEY:
                print("[WARNING] EMAIL_MODE=live but RESEND_API_KEY is not set. Kept in demo fallback.")


# ── HTML Email Templates ────────────────────────────────────────────

def generate_base_template(title: str, content_html: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                background-color: #0b0f19;
                color: #f1f5f9;
                margin: 0;
                padding: 0;
                -webkit-font-smoothing: antialiased;
            }}
            .container {{
                max-width: 600px;
                margin: 40px auto;
                background-color: #111827;
                border: 1px solid rgba(148, 163, 184, 0.1);
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 10px 25px rgba(0,0,0,0.5);
            }}
            .header {{
                background: linear-gradient(135deg, #6366f1, #06b6d4);
                padding: 30px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                color: #ffffff;
                font-size: 24px;
                font-weight: 700;
                letter-spacing: 0.5px;
            }}
            .body {{
                padding: 40px 30px;
                line-height: 1.6;
                color: #e2e8f0;
            }}
            .body p {{
                margin-top: 0;
                margin-bottom: 20px;
                font-size: 15px;
            }}
            .card {{
                background-color: rgba(148, 163, 184, 0.04);
                border: 1px solid rgba(148, 163, 184, 0.08);
                border-radius: 8px;
                padding: 20px;
                margin: 25px 0;
            }}
            .card-title {{
                font-weight: 600;
                color: #818cf8;
                margin-top: 0;
                margin-bottom: 15px;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }}
            .detail-row {{
                display: flex;
                margin-bottom: 8px;
                font-size: 14px;
            }}
            .detail-label {{
                font-weight: 600;
                color: #94a3b8;
                width: 150px;
            }}
            .detail-value {{
                color: #f1f5f9;
                flex: 1;
            }}
            .footer {{
                background-color: #0f172a;
                padding: 20px;
                text-align: center;
                border-top: 1px solid rgba(148, 163, 184, 0.06);
                font-size: 12px;
                color: #64748b;
            }}
            .footer a {{
                color: #818cf8;
                text-decoration: none;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>AssetFlow</h1>
            </div>
            <div class="body">
                {content_html}
            </div>
            <div class="footer">
                <p>This is an automated notification from the AssetFlow Management System.</p>
                <p>&copy; {datetime.now().year} AssetFlow. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """


def get_allocation_html(user_name: str, asset_name: str, category: str, serial: str) -> str:
    content = f"""
    <p>Hi {user_name},</p>
    <p>A new hardware/software asset has been successfully allocated. Please keep this email for your records.</p>
    
    <div class="card">
        <div class="card-title">Allocation Details</div>
        <div class="detail-row">
            <div class="detail-label">Asset Name:</div>
            <div class="detail-value">{asset_name}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Category:</div>
            <div class="detail-value">{category.replace('_', ' ')}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Serial Number:</div>
            <div class="detail-value">{serial}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Assigned Date:</div>
            <div class="detail-value">{datetime.now().strftime("%Y-%m-%d")}</div>
        </div>
    </div>
    
    <p>Please ensure proper care and usage of company assets. If you notice any technical issues, please submit a maintenance report through the AssetFlow dashboard.</p>
    """
    return generate_base_template("Asset Allocation Confirmation", content)


def get_return_html(user_name: str, asset_name: str, serial: str) -> str:
    content = f"""
    <p>Hi {user_name},</p>
    <p>We confirm that the following company asset has been returned. The item has been marked as returned and is back in the inventory.</p>
    
    <div class="card">
        <div class="card-title">Return Summary</div>
        <div class="detail-row">
            <div class="detail-label">Asset Name:</div>
            <div class="detail-value">{asset_name}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Serial Number:</div>
            <div class="detail-value">{serial}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Returned Date:</div>
            <div class="detail-value">{datetime.now().strftime("%Y-%m-%d")}</div>
        </div>
    </div>
    
    <p>Thank you for returning the asset promptly.</p>
    """
    return generate_base_template("Asset Return Confirmation", content)


def get_maintenance_html(user_name: str, asset_name: str, serial: str, description: str, cost: float) -> str:
    content = f"""
    <p>Hi {user_name},</p>
    <p>A new maintenance action has been logged for a company asset. Please find the service details below:</p>
    
    <div class="card">
        <div class="card-title">Maintenance Record</div>
        <div class="detail-row">
            <div class="detail-label">Asset Name:</div>
            <div class="detail-value">{asset_name}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Serial Number:</div>
            <div class="detail-value">{serial}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Description:</div>
            <div class="detail-value">{description}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Repair Cost:</div>
            <div class="detail-value">${cost:.2f}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Logged Date:</div>
            <div class="detail-value">{datetime.now().strftime("%Y-%m-%d")}</div>
        </div>
    </div>
    
    <p>The asset status has been updated to <strong>In Maintenance</strong>.</p>
    """
    return generate_base_template("Maintenance Service Alert", content)


def get_warranty_check_html(user_name: str, flagged_assets: list) -> str:
    table_rows = ""
    for asset in flagged_assets:
        status_color = "#ef4444" if asset["status"] == "Expired" else "#f59e0b"
        table_rows += f"""
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid rgba(148, 163, 184, 0.08); font-size: 13px;">{asset["name"]}</td>
            <td style="padding: 10px; border-bottom: 1px solid rgba(148, 163, 184, 0.08); font-size: 13px;">{asset["serial"]}</td>
            <td style="padding: 10px; border-bottom: 1px solid rgba(148, 163, 184, 0.08); font-size: 13px;">{asset["expiry"]}</td>
            <td style="padding: 10px; border-bottom: 1px solid rgba(148, 163, 184, 0.08); font-size: 13px; font-weight: 600; color: {status_color};">{asset["status"]}</td>
        </tr>
        """
        
    content = f"""
    <p>Hi {user_name},</p>
    <p>A warranty audit has completed. The system flagged <strong>{len(flagged_assets)}</strong> assets with expired or expiring warranties (expiring within 30 days).</p>
    
    <div style="margin: 25px 0; overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; background-color: rgba(148, 163, 184, 0.02); border: 1px solid rgba(148, 163, 184, 0.06); border-radius: 8px;">
            <thead>
                <tr style="background-color: rgba(148, 163, 184, 0.06);">
                    <th style="padding: 12px 10px; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #94a3b8; border-bottom: 1px solid rgba(148, 163, 184, 0.1);">Asset</th>
                    <th style="padding: 12px 10px; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #94a3b8; border-bottom: 1px solid rgba(148, 163, 184, 0.1);">Serial</th>
                    <th style="padding: 12px 10px; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #94a3b8; border-bottom: 1px solid rgba(148, 163, 184, 0.1);">Expiry Date</th>
                    <th style="padding: 12px 10px; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #94a3b8; border-bottom: 1px solid rgba(148, 163, 184, 0.1);">Status</th>
                </tr>
            </thead>
            <tbody>
                {table_rows}
            </tbody>
        </table>
    </div>
    
    <p>Please review these assets and arrange for extensions or strategic replacements.</p>
    """
    return generate_base_template("Warranty Expiry Summary Report", content)
