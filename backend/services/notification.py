import os
import smtplib
import json
import urllib.request
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime
from sqlalchemy.orm import Session
import models
from mailer import generate_base_template

# ─── Email Templates ───

def get_allocation_html(user_name: str, asset_name: str, category: str, serial: str) -> str:
    content = f"""
    <p>Hi {user_name},</p>
    <p>A new hardware/software asset has been successfully allocated. Please keep this email for your records.</p>
    <div class="card">
        <div class="card-title">Allocation Details</div>
        <div class="detail-row"><div class="detail-label">Asset Name:</div><div class="detail-value">{asset_name}</div></div>
        <div class="detail-row"><div class="detail-label">Category:</div><div class="detail-value">{category.replace('_', ' ')}</div></div>
        <div class="detail-row"><div class="detail-label">Serial Number:</div><div class="detail-value">{serial}</div></div>
        <div class="detail-row"><div class="detail-label">Assigned Date:</div><div class="detail-value">{datetime.now().strftime("%Y-%m-%d")}</div></div>
    </div>
    <p>Please ensure proper care and usage of company assets.</p>
    """
    return generate_base_template("Asset Allocation Confirmation", content)

def get_return_html(user_name: str, asset_name: str, serial: str) -> str:
    content = f"""
    <p>Hi {user_name},</p>
    <p>We confirm that the following company asset has been returned. The item has been marked as returned and is back in the inventory.</p>
    <div class="card">
        <div class="card-title">Return Summary</div>
        <div class="detail-row"><div class="detail-label">Asset Name:</div><div class="detail-value">{asset_name}</div></div>
        <div class="detail-row"><div class="detail-label">Serial Number:</div><div class="detail-value">{serial}</div></div>
        <div class="detail-row"><div class="detail-label">Returned Date:</div><div class="detail-value">{datetime.now().strftime("%Y-%m-%d")}</div></div>
    </div>
    """
    return generate_base_template("Asset Return Confirmation", content)

def get_maintenance_html(user_name: str, asset_name: str, serial: str, description: str, cost: float, completed: bool = False) -> str:
    status_str = "Completed" if completed else "Scheduled"
    content = f"""
    <p>Hi {user_name},</p>
    <p>A maintenance action has been <strong>{status_str}</strong> for a company asset. Please find details below:</p>
    <div class="card">
        <div class="card-title">Maintenance Record</div>
        <div class="detail-row"><div class="detail-label">Asset Name:</div><div class="detail-value">{asset_name}</div></div>
        <div class="detail-row"><div class="detail-label">Serial Number:</div><div class="detail-value">{serial}</div></div>
        <div class="detail-row"><div class="detail-label">Description:</div><div class="detail-value">{description}</div></div>
        <div class="detail-row"><div class="detail-label">Repair Cost:</div><div class="detail-value">${cost:.2f}</div></div>
        <div class="detail-row"><div class="detail-label">Logged Date:</div><div class="detail-value">{datetime.now().strftime("%Y-%m-%d")}</div></div>
    </div>
    """
    return generate_base_template(f"Maintenance Service {status_str}", content)

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
    <p>A warranty audit has completed. The system flagged <strong>{len(flagged_assets)}</strong> assets with expired or expiring warranties.</p>
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
    """
    return generate_base_template("Warranty Expiry Summary Report", content)

def get_verification_flagged_html(user_name: str, asset_name: str, serial: str, status: str, notes: str) -> str:
    content = f"""
    <p>Hi {user_name},</p>
    <p>An asset verification has flagged the following asset with status: <strong>{status}</strong>.</p>
    <div class="card">
        <div class="card-title">Verification Issue Alert</div>
        <div class="detail-row"><div class="detail-label">Asset:</div><div class="detail-value">{asset_name}</div></div>
        <div class="detail-row"><div class="detail-label">Serial:</div><div class="detail-value">{serial}</div></div>
        <div class="detail-row"><div class="detail-label">Status:</div><div class="detail-value" style="color: #ef4444; font-weight: 600;">{status}</div></div>
        <div class="detail-row"><div class="detail-label">Notes:</div><div class="detail-value">{notes or "N/A"}</div></div>
    </div>
    """
    return generate_base_template("Verification Issue Alert", content)

# ─── Service Classes ───

class EmailService:
    @staticmethod
    def send_email(to_email: str, subject: str, html_body: str) -> bool:
        smtp_host = os.environ.get("SMTP_HOST")
        smtp_port = os.environ.get("SMTP_PORT")
        smtp_username = os.environ.get("SMTP_USERNAME")
        smtp_password = os.environ.get("SMTP_PASSWORD")
        smtp_from = os.environ.get("SMTP_FROM", "noreply@assetflow.com")
        
        if not all([smtp_host, smtp_port, smtp_username, smtp_password]):
            print(f"[EMAIL LOG (DEMO)] To: {to_email} | Subject: {subject}")
            import mailer
            mailer.send_html_email(to_email, subject, html_body)
            return True
            
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = smtp_from
            msg['To'] = to_email
            
            part = MIMEText(html_body, 'html')
            msg.attach(part)
            
            server = smtplib.SMTP(smtp_host, int(smtp_port))
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.sendmail(smtp_from, to_email, msg.as_string())
            server.quit()
            
            import mailer
            mailer.sent_emails_log.append({
                "to": to_email,
                "subject": subject,
                "body": html_body,
                "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
            })
            return True
        except Exception as e:
            print(f"[EMAIL ERROR] Failed to send email: {e}")
            raise e


class SlackNotificationService:
    @staticmethod
    def send_slack(message: str) -> bool:
        webhook_url = os.environ.get("SLACK_WEBHOOK_URL")
        if not webhook_url:
            print(f"[SLACK LOG (DEMO)] {message}")
            return True
            
        try:
            payload = {"text": message}
            data = json.dumps(payload).encode('utf-8')
            req = urllib.request.Request(
                webhook_url,
                data=data,
                headers={'Content-Type': 'application/json'}
            )
            with urllib.request.urlopen(req) as response:
                response.read()
            return True
        except Exception as e:
            print(f"[SLACK ERROR] Failed to send Slack Webhook: {e}")
            raise e


class PushNotificationService:
    _initialized = False

    @classmethod
    def init_firebase(cls):
        if cls._initialized:
            return True
        try:
            import firebase_admin
            from firebase_admin import credentials
        except ImportError:
            print("[WARNING] firebase-admin package is not installed. Push notifications will fall back to console logging.")
            return False

        cred_path = os.environ.get("FIREBASE_SERVICE_ACCOUNT", "firebase-service-account.json")
        if os.path.exists(cred_path):
            try:
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
                cls._initialized = True
                return True
            except Exception as e:
                print(f"[ERROR] Failed to initialize Firebase Admin SDK: {e}")
        else:
            print("[WARNING] Firebase service account file not found. Push notifications will fall back to console logging.")
        return False

    @classmethod
    def send_push(cls, db: Session, user_id: int, title: str, body: str):
        has_sdk = cls.init_firebase()
        
        tokens = db.query(models.UserFcmToken).filter(models.UserFcmToken.user_id == user_id).all()
        if not tokens:
            return
            
        for token_record in tokens:
            token = token_record.token
            if has_sdk:
                try:
                    from firebase_admin import messaging
                    message = messaging.Message(
                        notification=messaging.Notification(
                            title=title,
                            body=body
                        ),
                        token=token
                    )
                    messaging.send(message)
                    print(f"[PUSH] Sent to user {user_id}: {title}")
                except Exception as e:
                    err_msg = str(e).lower()
                    if "registration-token-not-registered" in err_msg or "invalid-argument" in err_msg or "unregistered" in err_msg:
                        print(f"[PUSH] Removing unregistered token: {token[:15]}...")
                        db.delete(token_record)
                        db.commit()
                    else:
                        print(f"[PUSH ERROR] {e}")
            else:
                print(f"[PUSH LOG (DEMO)] User ID: {user_id} | Title: {title} | Body: {body}")


# ─── Central Dispatcher ───

class NotificationDispatcher:
    @staticmethod
    def _log_status(db: Session, notification_type: str, recipient: str, status: str, error_msg: str = None):
        try:
            log_entry = models.NotificationLog(
                notification_type=notification_type,
                recipient=recipient,
                status=status,
                failure_reason=error_msg
            )
            db.add(log_entry)
            db.commit()
        except Exception as e:
            print(f"[LOGGER ERROR] Failed to write notification log: {e}")

    @classmethod
    def dispatch(cls, db: Session, recipient_email: str, notification_type: str, data: dict):
        """
        Dispatches notifications to users/admins based on preferences.
        `recipient_email` can be an employee email or admin email.
        """
        user = db.query(models.User).filter(models.User.email == recipient_email).first()
        
        pref_email = user.pref_email if (user and user.pref_email is not None) else True
        pref_slack = user.pref_slack if (user and user.pref_slack is not None) else True
        pref_push = user.pref_push if (user and user.pref_push is not None) else True
        user_id = user.id if user else None

        # 1. Dispatch Email
        if pref_email:
            try:
                html_body = ""
                subject = f"AssetFlow Notification: {notification_type}"
                
                if notification_type == "Asset Allocated":
                    html_body = get_allocation_html(data.get("employee_name", "User"), data.get("asset_name"), data.get("category"), data.get("serial"))
                    subject = f"Asset Assigned: {data.get('asset_name')}"
                elif notification_type == "Asset Returned":
                    html_body = get_return_html(data.get("employee_name", "User"), data.get("asset_name"), data.get("serial"))
                    subject = f"Asset Returned: {data.get('asset_name')}"
                elif notification_type == "Maintenance Scheduled":
                    html_body = get_maintenance_html(data.get("employee_name", "Admin"), data.get("asset_name"), data.get("serial"), data.get("description"), data.get("cost"), completed=False)
                    subject = f"Maintenance Scheduled for {data.get('asset_name')}"
                elif notification_type == "Maintenance Completed":
                    html_body = get_maintenance_html(data.get("employee_name", "Admin"), data.get("asset_name"), data.get("serial"), data.get("description"), data.get("cost"), completed=True)
                    subject = f"Maintenance Completed: {data.get('asset_name')}"
                elif notification_type == "Warranty Expiring Soon":
                    html_body = get_warranty_check_html(data.get("employee_name", "Admin"), data.get("flagged_assets", []))
                    subject = f"Warranty Expiry Summary - {len(data.get('flagged_assets', []))} Assets Flagged"
                elif notification_type == "Verification Flagged":
                    html_body = get_verification_flagged_html(data.get("employee_name", "Admin"), data.get("asset_name"), data.get("serial"), data.get("status"), data.get("notes"))
                    subject = f"Verification Alert: {data.get('asset_name')} is {data.get('status')}"
                
                EmailService.send_email(recipient_email, subject, html_body)
                cls._log_status(db, f"Email ({notification_type})", recipient_email, "SUCCESS")
            except Exception as e:
                cls._log_status(db, f"Email ({notification_type})", recipient_email, "FAILED", str(e))

        # 2. Dispatch Slack
        if pref_slack:
            try:
                title_map = {
                    "Asset Allocated": "New Asset Allocation",
                    "Maintenance Completed": "Asset Maintenance Completed",
                    "Verification Flagged": "Asset Verification Warning"
                }
                title = title_map.get(notification_type, notification_type)
                
                emp_name = data.get("employee_name", "N/A")
                asset_name = data.get("asset_name", "N/A")
                cat = data.get("category", "N/A").replace("_", " ")
                serial = data.get("serial", "N/A")
                status = data.get("status", "N/A")
                date_str = datetime.now().strftime("%Y-%m-%d")
                
                msg = (
                    f"*AssetFlow:* {title}\n"
                    f"• *Employee:* {emp_name}\n"
                    f"• *Asset:* {asset_name} ({cat})\n"
                    f"• *Serial Number:* {serial}\n"
                    f"• *Status:* {status}\n"
                    f"• *Date:* {date_str}"
                )
                
                if notification_type in ["Asset Allocated", "Maintenance Completed", "Verification Flagged"]:
                    SlackNotificationService.send_slack(msg)
                    cls._log_status(db, f"Slack ({notification_type})", "Channel Webhook", "SUCCESS")
            except Exception as e:
                cls._log_status(db, f"Slack ({notification_type})", "Channel Webhook", "FAILED", str(e))

        # 3. Dispatch Push Notifications
        if pref_push and user_id:
            try:
                title_map = {
                    "Asset Allocated": "New Asset Assigned",
                    "Maintenance Completed": "Maintenance Completed",
                    "Warranty Expiring Soon": "Warranty Expiration Alert"
                }
                title = title_map.get(notification_type, "System Notification")
                body = f"Asset {data.get('asset_name')} status updated to {data.get('status')}."
                
                if notification_type in ["Asset Allocated", "Maintenance Completed", "Warranty Expiring Soon"]:
                    PushNotificationService.send_push(db, user_id, title, body)
                    cls._log_status(db, f"Push ({notification_type})", f"User ID: {user_id}", "SUCCESS")
            except Exception as e:
                cls._log_status(db, f"Push ({notification_type})", f"User ID: {user_id}", "FAILED", str(e))
