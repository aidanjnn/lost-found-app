"""
Email Utility Module
Sprint 4: Issue #42 - Email Notifications

Handles email sending for claim status updates and password recovery.
Uses SMTP if configured, otherwise outputs to console (mock mode).

Author: Team 15 (Ruhani, Sheehan, Aidan, Neng, Theni)
Sprint: 4
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

# Email configuration (set via environment variables)
SMTP_HOST = os.getenv('SMTP_HOST', None)
SMTP_PORT = os.getenv('SMTP_PORT', 587)
SMTP_USER = os.getenv('SMTP_USER', None)
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', None)
FROM_EMAIL = os.getenv('FROM_EMAIL', 'noreply@uwaterloo.ca')

# Check if SMTP is configured
SMTP_ENABLED = all([SMTP_HOST, SMTP_USER, SMTP_PASSWORD])


def send_email(to_email, subject, html_body, text_body=None):
    """
    Send an email to the specified recipient.
    
    If SMTP is not configured, prints email to console (mock mode).
    
    Args:
        to_email (str): Recipient email address
        subject (str): Email subject
        html_body (str): HTML email body
        text_body (str, optional): Plain text email body (fallback)
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    if SMTP_ENABLED:
        return _send_smtp_email(to_email, subject, html_body, text_body)
    else:
        return _mock_email(to_email, subject, html_body, text_body)


def _send_smtp_email(to_email, subject, html_body, text_body=None):
    """
    Send email using SMTP server.
    """
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['From'] = FROM_EMAIL
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # Add plain text part if provided
        if text_body:
            part1 = MIMEText(text_body, 'plain')
            msg.attach(part1)
        
        # Add HTML part
        part2 = MIMEText(html_body, 'html')
        msg.attach(part2)
        
        # Connect to SMTP server and send
        with smtplib.SMTP(SMTP_HOST, int(SMTP_PORT)) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        
        print(f"✉️ Email sent to {to_email}: {subject}")
        return True
    except Exception as e:
        print(f"❌ Failed to send email to {to_email}: {e}")
        return False


def _mock_email(to_email, subject, html_body, text_body=None):
    """
    Mock email sending by printing to console.
    """
    print("\n" + "="*80)
    print("📧 MOCK EMAIL (SMTP not configured)")
    print("="*80)
    print(f"From: {FROM_EMAIL}")
    print(f"To: {to_email}")
    print(f"Subject: {subject}")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("-"*80)
    if text_body:
        print("Plain Text Body:")
        print(text_body)
        print("-"*80)
    print("HTML Body:")
    print(html_body)
    print("="*80 + "\n")
    return True


# ============================================================================
# Email Templates for Claim Status Updates
# ============================================================================

def send_claim_submitted_email(claimant_name, claimant_email, item_description, claim_id):
    """
    Send email when a claim is submitted.
    """
    subject = "Claim Submitted - UW Lost & Found"
    
    html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #003366 0%, #004488 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }}
        .button {{ display: inline-block; padding: 12px 24px; background: #003366; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
        .footer {{ text-align: center; padding: 20px; color: #888; font-size: 12px; }}
        .highlight {{ background: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 15px 0; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Claim Submitted Successfully</h1>
        </div>
        <div class="content">
            <p>Hi <strong>{claimant_name}</strong>,</p>
            
            <p>Your claim has been successfully submitted to the UW Lost & Found system!</p>
            
            <div class="highlight">
                <strong>Claim ID:</strong> #{claim_id}<br>
                <strong>Item:</strong> {item_description}<br>
                <strong>Status:</strong> Pending Review
            </div>
            
            <p>Our staff will review your claim and verification details shortly. You will receive another email when your claim status is updated.</p>
            
            <p><strong>What happens next?</strong></p>
            <ul>
                <li>Staff will review your verification details</li>
                <li>Your claim will be approved or rejected based on the information provided</li>
                <li>If approved, you'll receive pickup instructions</li>
            </ul>
            
            <p>You can check your claim status anytime by logging into your account.</p>
            
            <p>Thank you for using UW Lost & Found!</p>
        </div>
        <div class="footer">
            <p>University of Waterloo Lost & Found System</p>
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
"""
    
    text_body = f"""
UW Lost & Found - Claim Submitted

Hi {claimant_name},

Your claim has been successfully submitted!

Claim ID: #{claim_id}
Item: {item_description}
Status: Pending Review

Our staff will review your claim shortly. You will receive another email when your claim status is updated.

Thank you for using UW Lost & Found!

---
University of Waterloo Lost & Found System
This is an automated message. Please do not reply to this email.
"""
    
    return send_email(claimant_email, subject, html_body, text_body)


def send_claim_approved_email(claimant_name, claimant_email, item_description, claim_id, pickup_location):
    """
    Send email when a claim is approved.
    """
    subject = "✅ Claim Approved - UW Lost & Found"
    
    html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }}
        .button {{ display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
        .footer {{ text-align: center; padding: 20px; color: #888; font-size: 12px; }}
        .success-box {{ background: #d4edda; padding: 15px; border-left: 4px solid #28a745; margin: 15px 0; border-radius: 4px; }}
        .important {{ background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 15px 0; border-radius: 4px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Your Claim Has Been Approved!</h1>
        </div>
        <div class="content">
            <p>Hi <strong>{claimant_name}</strong>,</p>
            
            <p>Great news! Your claim has been approved by our staff.</p>
            
            <div class="success-box">
                <strong>Claim ID:</strong> #{claim_id}<br>
                <strong>Item:</strong> {item_description}<br>
                <strong>Status:</strong> ✅ Approved
            </div>
            
            <div class="important">
                <strong>📍 Pickup Location:</strong> {pickup_location}<br>
                <strong>⏰ Next Step:</strong> Visit the location to pick up your item
            </div>
            
            <p><strong>What to bring:</strong></p>
            <ul>
                <li>Valid student ID or government-issued photo ID</li>
                <li>This email confirmation (digital or printed)</li>
                <li>Any additional proof of ownership if requested</li>
            </ul>
            
            <p><strong>Important:</strong> Please pick up your item as soon as possible. After pickup, staff will mark your claim as "Picked Up".</p>
            
            <p>If you have any questions, please contact the Lost & Found desk at the pickup location.</p>
            
            <p>Thank you for using UW Lost & Found!</p>
        </div>
        <div class="footer">
            <p>University of Waterloo Lost & Found System</p>
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
"""
    
    text_body = f"""
UW Lost & Found - Claim Approved

Hi {claimant_name},

Great news! Your claim has been approved.

Claim ID: #{claim_id}
Item: {item_description}
Status: APPROVED

PICKUP LOCATION: {pickup_location}

What to bring:
- Valid student ID or government-issued photo ID
- This email confirmation
- Any additional proof of ownership if requested

Please pick up your item as soon as possible.

Thank you for using UW Lost & Found!

---
University of Waterloo Lost & Found System
This is an automated message. Please do not reply to this email.
"""
    
    return send_email(claimant_email, subject, html_body, text_body)


def send_claim_rejected_email(claimant_name, claimant_email, item_description, claim_id, staff_notes=None):
    """
    Send email when a claim is rejected.
    """
    subject = "❌ Claim Update - UW Lost & Found"
    
    notes_section = ""
    if staff_notes:
        notes_section = f"""
            <div class="info-box">
                <strong>Staff Notes:</strong><br>
                {staff_notes}
            </div>
        """
    
    html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }}
        .footer {{ text-align: center; padding: 20px; color: #888; font-size: 12px; }}
        .info-box {{ background: #e7f3ff; padding: 15px; border-left: 4px solid #003366; margin: 15px 0; border-radius: 4px; }}
        .warning-box {{ background: #f8d7da; padding: 15px; border-left: 4px solid #dc3545; margin: 15px 0; border-radius: 4px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Claim Status Update</h1>
        </div>
        <div class="content">
            <p>Hi <strong>{claimant_name}</strong>,</p>
            
            <p>We've reviewed your claim for the following item:</p>
            
            <div class="warning-box">
                <strong>Claim ID:</strong> #{claim_id}<br>
                <strong>Item:</strong> {item_description}<br>
                <strong>Status:</strong> Not Approved
            </div>
            
            {notes_section}
            
            <p>Unfortunately, we were unable to approve your claim at this time. This may be due to:</p>
            <ul>
                <li>Insufficient verification details</li>
                <li>Information that doesn't match the item description</li>
                <li>The item has already been claimed by someone else</li>
            </ul>
            
            <p>If you believe this is an error or if you have additional information, please:</p>
            <ul>
                <li>Visit the Lost & Found desk in person with proof of ownership</li>
                <li>Submit a new claim with more detailed verification information</li>
            </ul>
            
            <p>Thank you for your understanding.</p>
        </div>
        <div class="footer">
            <p>University of Waterloo Lost & Found System</p>
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
"""
    
    text_body = f"""
UW Lost & Found - Claim Status Update

Hi {claimant_name},

We've reviewed your claim for the following item:

Claim ID: #{claim_id}
Item: {item_description}
Status: Not Approved

{f"Staff Notes: {staff_notes}" if staff_notes else ""}

Unfortunately, we were unable to approve your claim at this time. If you believe this is an error or have additional information, please visit the Lost & Found desk in person or submit a new claim with more details.

Thank you for your understanding.

---
University of Waterloo Lost & Found System
This is an automated message. Please do not reply to this email.
"""
    
    return send_email(claimant_email, subject, html_body, text_body)


def send_claim_picked_up_email(claimant_name, claimant_email, item_description, claim_id):
    """
    Send email when a claim is marked as picked up.
    """
    subject = "✅ Item Picked Up - UW Lost & Found"
    
    html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #17a2b8 0%, #138496 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }}
        .footer {{ text-align: center; padding: 20px; color: #888; font-size: 12px; }}
        .success-box {{ background: #d1ecf1; padding: 15px; border-left: 4px solid #17a2b8; margin: 15px 0; border-radius: 4px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Item Successfully Picked Up!</h1>
        </div>
        <div class="content">
            <p>Hi <strong>{claimant_name}</strong>,</p>
            
            <p>This confirms that you have successfully picked up your item.</p>
            
            <div class="success-box">
                <strong>Claim ID:</strong> #{claim_id}<br>
                <strong>Item:</strong> {item_description}<br>
                <strong>Status:</strong> ✅ Picked Up - Complete
            </div>
            
            <p>Your claim is now complete and has been archived in our system.</p>
            
            <p>Thank you for using the UW Lost & Found service. We're glad we could help reunite you with your item!</p>
            
            <p>If you have any feedback or suggestions for improving our service, please let us know.</p>
        </div>
        <div class="footer">
            <p>University of Waterloo Lost & Found System</p>
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
"""
    
    text_body = f"""
UW Lost & Found - Item Picked Up

Hi {claimant_name},

This confirms that you have successfully picked up your item.

Claim ID: #{claim_id}
Item: {item_description}
Status: Picked Up - Complete

Your claim is now complete. Thank you for using UW Lost & Found!

---
University of Waterloo Lost & Found System
This is an automated message. Please do not reply to this email.
"""
    
    return send_email(claimant_email, subject, html_body, text_body)


# ============================================================================
# Password Recovery Email
# ============================================================================

def send_password_recovery_email(user_name, user_email, password):
    """
    Send email with password for password recovery.
    Note: In production, this should send a password reset link, not the actual password.
    """
    subject = "🔐 Password Recovery - UW Lost & Found"
    
    html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #6610f2 0%, #520dc2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }}
        .footer {{ text-align: center; padding: 20px; color: #888; font-size: 12px; }}
        .password-box {{ background: #f8f9fa; padding: 20px; border: 2px solid #6610f2; margin: 20px 0; border-radius: 8px; text-align: center; }}
        .password {{ font-size: 24px; font-weight: bold; color: #6610f2; letter-spacing: 2px; }}
        .warning {{ background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 15px 0; border-radius: 4px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Password Recovery</h1>
        </div>
        <div class="content">
            <p>Hi <strong>{user_name}</strong>,</p>
            
            <p>You requested to recover your password for the UW Lost & Found system.</p>
            
            <div class="password-box">
                <p style="margin: 0 0 10px 0; color: #666;">Your Password:</p>
                <p class="password">{password}</p>
            </div>
            
            <div class="warning">
                <strong>⚠️ Security Reminder:</strong><br>
                For your security, we recommend that you change your password after logging in.
            </div>
            
            <p><strong>If you did not request this password recovery:</strong></p>
            <ul>
                <li>Someone may have tried to access your account</li>
                <li>Please change your password immediately</li>
                <li>Contact us if you notice any suspicious activity</li>
            </ul>
            
            <p>You can now log in to your account using the password above.</p>
        </div>
        <div class="footer">
            <p>University of Waterloo Lost & Found System</p>
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
"""
    
    text_body = f"""
UW Lost & Found - Password Recovery

Hi {user_name},

You requested to recover your password.

Your Password: {password}

SECURITY REMINDER: We recommend that you change your password after logging in.

If you did not request this password recovery, please change your password immediately and contact us.

---
University of Waterloo Lost & Found System
This is an automated message. Please do not reply to this email.
"""
    
    return send_email(user_email, subject, html_body, text_body)


