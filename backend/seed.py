import datetime
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models

def seed_db():
    print("Dropping all tables...")
    models.Base.metadata.drop_all(bind=engine)
    print("Creating tables...")
    models.Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        today = datetime.date.today()

        # ── Employees (15) ──────────────────────────────────────────────
        print("Seeding Employees...")
        employees = [
            # Engineering (5)
            models.Employee(name="Alice Chen", email="alice.chen@acme.com", department="Engineering"),
            models.Employee(name="Marcus Rivera", email="marcus.rivera@acme.com", department="Engineering"),
            models.Employee(name="Priya Sharma", email="priya.sharma@acme.com", department="Engineering"),
            models.Employee(name="James O'Brien", email="james.obrien@acme.com", department="Engineering"),
            models.Employee(name="Sofia Nakamura", email="sofia.nakamura@acme.com", department="Engineering"),
            # Design (3)
            models.Employee(name="Olivia Martinez", email="olivia.martinez@acme.com", department="Design"),
            models.Employee(name="Liam Foster", email="liam.foster@acme.com", department="Design"),
            models.Employee(name="Ava Richardson", email="ava.richardson@acme.com", department="Design"),
            # Sales (3)
            models.Employee(name="Noah Patel", email="noah.patel@acme.com", department="Sales"),
            models.Employee(name="Emma Johansson", email="emma.johansson@acme.com", department="Sales"),
            models.Employee(name="Ethan Brooks", email="ethan.brooks@acme.com", department="Sales"),
            # HR (2)
            models.Employee(name="Isabella Torres", email="isabella.torres@acme.com", department="HR"),
            models.Employee(name="Daniel Kim", email="daniel.kim@acme.com", department="HR"),
            # Finance (2)
            models.Employee(name="Mia Watson", email="mia.watson@acme.com", department="Finance"),
            models.Employee(name="Alexander Müller", email="alex.muller@acme.com", department="Finance"),
        ]
        db.add_all(employees)
        db.flush()

        # ── Assets (48) ────────────────────────────────────────────────
        print("Seeding Assets...")

        def d(days_ago):
            return today - datetime.timedelta(days=days_ago)

        assets = [
            # === LAPTOPS (16) ===
            # Old / expired warranty
            models.Asset(name="Dell Latitude 5520", category=models.CategoryEnum.LAPTOP, serial_number="DL-5520-7A3F", purchase_date=d(1600), warranty_end_date=d(500), status=models.StatusEnum.AVAILABLE, condition_score=4),
            models.Asset(name="Dell Latitude 7420", category=models.CategoryEnum.LAPTOP, serial_number="DL-7420-9B1E", purchase_date=d(1200), warranty_end_date=d(100), status=models.StatusEnum.AVAILABLE, condition_score=5),
            models.Asset(name="HP EliteBook 840 G7", category=models.CategoryEnum.LAPTOP, serial_number="HP-840G7-2C4D", purchase_date=d(1400), warranty_end_date=d(300), status=models.StatusEnum.AVAILABLE, condition_score=3),
            models.Asset(name="HP ProBook 450 G8", category=models.CategoryEnum.LAPTOP, serial_number="HP-450G8-5E6F", purchase_date=d(900), warranty_end_date=d(50), status=models.StatusEnum.AVAILABLE, condition_score=6),
            models.Asset(name="Lenovo ThinkPad T14s", category=models.CategoryEnum.LAPTOP, serial_number="LN-T14S-8G7H", purchase_date=d(1100), warranty_end_date=d(200), status=models.StatusEnum.AVAILABLE, condition_score=4),
            models.Asset(name="Lenovo ThinkPad X1 Carbon Gen 9", category=models.CategoryEnum.LAPTOP, serial_number="LN-X1C9-1I2J", purchase_date=d(800), warranty_end_date=d(10), status=models.StatusEnum.AVAILABLE, condition_score=7),
            # Newer / good condition
            models.Asset(name="MacBook Pro 14\" M3", category=models.CategoryEnum.LAPTOP, serial_number="AP-MBP14-3K4L", purchase_date=d(200), warranty_end_date=today + datetime.timedelta(days=530), status=models.StatusEnum.AVAILABLE, condition_score=10),
            models.Asset(name="MacBook Air 15\" M2", category=models.CategoryEnum.LAPTOP, serial_number="AP-MBA15-5M6N", purchase_date=d(350), warranty_end_date=today + datetime.timedelta(days=380), status=models.StatusEnum.AVAILABLE, condition_score=9),
            models.Asset(name="Dell XPS 15 9530", category=models.CategoryEnum.LAPTOP, serial_number="DL-XPS15-7O8P", purchase_date=d(150), warranty_end_date=today + datetime.timedelta(days=580), status=models.StatusEnum.AVAILABLE, condition_score=10),
            models.Asset(name="HP Spectre x360 14", category=models.CategoryEnum.LAPTOP, serial_number="HP-SPX14-9Q0R", purchase_date=d(100), warranty_end_date=today + datetime.timedelta(days=630), status=models.StatusEnum.AVAILABLE, condition_score=10),
            models.Asset(name="Lenovo ThinkPad X1 Carbon Gen 11", category=models.CategoryEnum.LAPTOP, serial_number="LN-X1C11-1S2T", purchase_date=d(180), warranty_end_date=today + datetime.timedelta(days=550), status=models.StatusEnum.AVAILABLE, condition_score=9),
            models.Asset(name="Dell Latitude 9440", category=models.CategoryEnum.LAPTOP, serial_number="DL-9440-3U4V", purchase_date=d(250), warranty_end_date=today + datetime.timedelta(days=480), status=models.StatusEnum.AVAILABLE, condition_score=9),
            models.Asset(name="MacBook Pro 16\" M3 Pro", category=models.CategoryEnum.LAPTOP, serial_number="AP-MBP16-5W6X", purchase_date=d(120), warranty_end_date=today + datetime.timedelta(days=610), status=models.StatusEnum.AVAILABLE, condition_score=10),
            models.Asset(name="HP ZBook Studio G10", category=models.CategoryEnum.LAPTOP, serial_number="HP-ZBS10-7Y8Z", purchase_date=d(300), warranty_end_date=today + datetime.timedelta(days=430), status=models.StatusEnum.AVAILABLE, condition_score=8),
            models.Asset(name="Lenovo IdeaPad 5 Pro", category=models.CategoryEnum.LAPTOP, serial_number="LN-IP5P-9A0B", purchase_date=d(500), warranty_end_date=today + datetime.timedelta(days=230), status=models.StatusEnum.AVAILABLE, condition_score=7),
            models.Asset(name="Dell Inspiron 16 Plus", category=models.CategoryEnum.LAPTOP, serial_number="DL-I16P-1C2D", purchase_date=d(400), warranty_end_date=today + datetime.timedelta(days=330), status=models.StatusEnum.AVAILABLE, condition_score=8),

            # === MONITORS (10) ===
            models.Asset(name="LG UltraWide 34WN80C", category=models.CategoryEnum.MONITOR, serial_number="LG-34WN-3E4F", purchase_date=d(1300), warranty_end_date=d(200), status=models.StatusEnum.AVAILABLE, condition_score=5),
            models.Asset(name="Samsung Odyssey G7 32\"", category=models.CategoryEnum.MONITOR, serial_number="SS-G732-5G6H", purchase_date=d(600), warranty_end_date=today + datetime.timedelta(days=130), status=models.StatusEnum.AVAILABLE, condition_score=8),
            models.Asset(name="Dell UltraSharp U2723QE", category=models.CategoryEnum.MONITOR, serial_number="DL-U27Q-7I8J", purchase_date=d(200), warranty_end_date=today + datetime.timedelta(days=530), status=models.StatusEnum.AVAILABLE, condition_score=10),
            models.Asset(name="LG 27UK850-W 4K", category=models.CategoryEnum.MONITOR, serial_number="LG-27UK-9K0L", purchase_date=d(1500), warranty_end_date=d(400), status=models.StatusEnum.AVAILABLE, condition_score=4),
            models.Asset(name="Samsung ViewFinity S8 27\"", category=models.CategoryEnum.MONITOR, serial_number="SS-VFS8-1M2N", purchase_date=d(150), warranty_end_date=today + datetime.timedelta(days=580), status=models.StatusEnum.AVAILABLE, condition_score=10),
            models.Asset(name="Dell P2722H 27\"", category=models.CategoryEnum.MONITOR, serial_number="DL-P272-3O4P", purchase_date=d(700), warranty_end_date=d(30), status=models.StatusEnum.AVAILABLE, condition_score=7),
            models.Asset(name="LG DualUp 28MQ780", category=models.CategoryEnum.MONITOR, serial_number="LG-DU28-5Q6R", purchase_date=d(250), warranty_end_date=today + datetime.timedelta(days=480), status=models.StatusEnum.AVAILABLE, condition_score=9),
            models.Asset(name="BenQ PD2725U", category=models.CategoryEnum.MONITOR, serial_number="BQ-PD27-7S8T", purchase_date=d(400), warranty_end_date=today + datetime.timedelta(days=330), status=models.StatusEnum.AVAILABLE, condition_score=8),
            models.Asset(name="ASUS ProArt PA278CV", category=models.CategoryEnum.MONITOR, serial_number="AS-PA27-9U0V", purchase_date=d(350), warranty_end_date=today + datetime.timedelta(days=380), status=models.StatusEnum.AVAILABLE, condition_score=9),
            models.Asset(name="Samsung S24R350 24\"", category=models.CategoryEnum.MONITOR, serial_number="SS-S24R-1W2X", purchase_date=d(1100), warranty_end_date=d(150), status=models.StatusEnum.AVAILABLE, condition_score=6),

            # === PHONES (10) ===
            models.Asset(name="iPhone 15 Pro", category=models.CategoryEnum.PHONE, serial_number="AP-IP15P-3Y4Z", purchase_date=d(120), warranty_end_date=today + datetime.timedelta(days=610), status=models.StatusEnum.AVAILABLE, condition_score=10),
            models.Asset(name="iPhone 14", category=models.CategoryEnum.PHONE, serial_number="AP-IP14-5A6B", purchase_date=d(500), warranty_end_date=today + datetime.timedelta(days=230), status=models.StatusEnum.AVAILABLE, condition_score=8),
            models.Asset(name="iPhone 12 Mini", category=models.CategoryEnum.PHONE, serial_number="AP-IP12M-7C8D", purchase_date=d(1400), warranty_end_date=d(350), status=models.StatusEnum.AVAILABLE, condition_score=3),
            models.Asset(name="Samsung Galaxy S24 Ultra", category=models.CategoryEnum.PHONE, serial_number="SS-GS24U-9E0F", purchase_date=d(90), warranty_end_date=today + datetime.timedelta(days=640), status=models.StatusEnum.AVAILABLE, condition_score=10),
            models.Asset(name="Samsung Galaxy S22", category=models.CategoryEnum.PHONE, serial_number="SS-GS22-1G2H", purchase_date=d(800), warranty_end_date=d(70), status=models.StatusEnum.AVAILABLE, condition_score=6),
            models.Asset(name="Samsung Galaxy A54", category=models.CategoryEnum.PHONE, serial_number="SS-GA54-3I4J", purchase_date=d(300), warranty_end_date=today + datetime.timedelta(days=430), status=models.StatusEnum.AVAILABLE, condition_score=9),
            models.Asset(name="Google Pixel 8 Pro", category=models.CategoryEnum.PHONE, serial_number="GP-PX8P-5K6L", purchase_date=d(150), warranty_end_date=today + datetime.timedelta(days=580), status=models.StatusEnum.AVAILABLE, condition_score=10),
            models.Asset(name="iPhone 13", category=models.CategoryEnum.PHONE, serial_number="AP-IP13-7M8N", purchase_date=d(1000), warranty_end_date=d(100), status=models.StatusEnum.AVAILABLE, condition_score=5),
            models.Asset(name="OnePlus 12", category=models.CategoryEnum.PHONE, serial_number="OP-12-9O0P", purchase_date=d(200), warranty_end_date=today + datetime.timedelta(days=530), status=models.StatusEnum.AVAILABLE, condition_score=9),
            models.Asset(name="Samsung Galaxy Z Flip5", category=models.CategoryEnum.PHONE, serial_number="SS-GZF5-1Q2R", purchase_date=d(250), warranty_end_date=today + datetime.timedelta(days=480), status=models.StatusEnum.AVAILABLE, condition_score=8),

            # === SOFTWARE LICENSES (12) ===
            models.Asset(name="Adobe Creative Cloud (Team)", category=models.CategoryEnum.SOFTWARE_LICENSE, serial_number="SW-ADCC-3S4T", purchase_date=d(60), warranty_end_date=today + datetime.timedelta(days=305), status=models.StatusEnum.AVAILABLE, condition_score=10),
            models.Asset(name="JetBrains All Products Pack", category=models.CategoryEnum.SOFTWARE_LICENSE, serial_number="SW-JBAP-5U6V", purchase_date=d(30), warranty_end_date=today + datetime.timedelta(days=335), status=models.StatusEnum.AVAILABLE, condition_score=10),
            models.Asset(name="Microsoft 365 Business Premium", category=models.CategoryEnum.SOFTWARE_LICENSE, serial_number="SW-M365-7W8X", purchase_date=d(90), warranty_end_date=today + datetime.timedelta(days=275), status=models.StatusEnum.AVAILABLE, condition_score=10),
            models.Asset(name="Figma Organization Plan", category=models.CategoryEnum.SOFTWARE_LICENSE, serial_number="SW-FGMA-9Y0Z", purchase_date=d(45), warranty_end_date=today + datetime.timedelta(days=320), status=models.StatusEnum.AVAILABLE, condition_score=10),
            models.Asset(name="Slack Business+ License", category=models.CategoryEnum.SOFTWARE_LICENSE, serial_number="SW-SLCK-1A2B", purchase_date=d(120), warranty_end_date=today + datetime.timedelta(days=245), status=models.StatusEnum.AVAILABLE, condition_score=10),
            models.Asset(name="GitHub Enterprise License", category=models.CategoryEnum.SOFTWARE_LICENSE, serial_number="SW-GHUB-3C4D", purchase_date=d(180), warranty_end_date=today + datetime.timedelta(days=185), status=models.StatusEnum.AVAILABLE, condition_score=10),
            models.Asset(name="Jira Software Premium", category=models.CategoryEnum.SOFTWARE_LICENSE, serial_number="SW-JIRA-5E6F", purchase_date=d(200), warranty_end_date=today + datetime.timedelta(days=165), status=models.StatusEnum.AVAILABLE, condition_score=10),
            models.Asset(name="Zoom Workplace License", category=models.CategoryEnum.SOFTWARE_LICENSE, serial_number="SW-ZOOM-7G8H", purchase_date=d(150), warranty_end_date=today + datetime.timedelta(days=215), status=models.StatusEnum.AVAILABLE, condition_score=10),
            models.Asset(name="AutoCAD 2024 License", category=models.CategoryEnum.SOFTWARE_LICENSE, serial_number="SW-ACAD-9I0J", purchase_date=d(1300), warranty_end_date=d(200), status=models.StatusEnum.AVAILABLE, condition_score=10),
            models.Asset(name="Tableau Desktop License", category=models.CategoryEnum.SOFTWARE_LICENSE, serial_number="SW-TBLU-1K2L", purchase_date=d(400), warranty_end_date=today + datetime.timedelta(days=50), status=models.StatusEnum.AVAILABLE, condition_score=10),
            models.Asset(name="Adobe Acrobat Pro DC", category=models.CategoryEnum.SOFTWARE_LICENSE, serial_number="SW-AAPD-3M4N", purchase_date=d(1500), warranty_end_date=d(400), status=models.StatusEnum.AVAILABLE, condition_score=10),
            models.Asset(name="Notion Team Plan", category=models.CategoryEnum.SOFTWARE_LICENSE, serial_number="SW-NOTN-5O6P", purchase_date=d(100), warranty_end_date=today + datetime.timedelta(days=265), status=models.StatusEnum.AVAILABLE, condition_score=10),
        ]
        db.add_all(assets)
        db.flush()

        # ── Allocations (24 — 14 active, 10 returned) ──────────────────
        print("Seeding Allocations...")
        allocations_data = [
            # Active allocations
            (6,  0, 30, None),   # MacBook Pro 14 -> Alice Chen
            (7,  5, 60, None),   # MacBook Air 15 -> Olivia Martinez
            (8,  1, 20, None),   # Dell XPS 15 -> Marcus Rivera
            (9,  6, 45, None),   # HP Spectre -> Liam Foster
            (10, 2, 15, None),   # ThinkPad X1 Gen 11 -> Priya Sharma
            (12, 3, 25, None),   # MacBook Pro 16 -> James O'Brien
            (18, 0, 40, None),   # Dell UltraSharp -> Alice Chen
            (20, 5, 35, None),   # Samsung ViewFinity -> Olivia Martinez
            (22, 7, 50, None),   # LG DualUp -> Ava Richardson
            (26, 8, 10, None),   # iPhone 15 Pro -> Noah Patel
            (29, 9, 8, None),    # Samsung Galaxy S24 -> Emma Johansson
            (36, 0, 5, None),    # Adobe CC -> Alice Chen
            (37, 1, 5, None),    # JetBrains -> Marcus Rivera
            (39, 5, 12, None),   # Figma -> Olivia Martinez
            # Returned allocations
            (0,  4, 200, 50),    # Dell Latitude 5520 -> Sofia, returned
            (1,  10, 180, 30),   # Dell Latitude 7420 -> Ethan, returned
            (3,  8, 300, 100),   # HP ProBook -> Noah, returned
            (5,  11, 150, 20),   # ThinkPad X1 Gen 9 -> Isabella, returned
            (13, 2, 250, 80),    # HP ZBook -> Priya, returned
            (17, 6, 120, 40),    # Samsung Odyssey -> Liam, returned
            (27, 12, 90, 15),    # iPhone 14 -> Daniel, returned
            (30, 13, 200, 60),   # Samsung Galaxy S22 -> Mia, returned
            (33, 14, 100, 25),   # iPhone 13 -> Alexander, returned
            (44, 10, 60, 10),    # Tableau -> Ethan, returned
        ]

        for asset_idx, emp_idx, days_ago, returned_days_ago in allocations_data:
            alloc = models.Allocation(
                asset_id=assets[asset_idx].id,
                employee_id=employees[emp_idx].id,
                assigned_date=d(days_ago),
                returned_date=d(returned_days_ago) if returned_days_ago is not None else None
            )
            db.add(alloc)
            # If active (not returned), mark asset as ALLOCATED
            if returned_days_ago is None:
                assets[asset_idx].status = models.StatusEnum.ALLOCATED

        db.flush()

        # ── Maintenance Records (20) ───────────────────────────────────
        print("Seeding Maintenance Records...")
        maintenance_data = [
            # Dell Latitude 5520 (asset 0) — 4 records → triggers high maintenance
            (0, 500, "Battery replacement - swollen battery detected", 120),
            (0, 350, "Screen flickering repair - replaced LCD panel", 340),
            (0, 200, "Keyboard malfunction - replaced keyboard assembly", 85),
            (0, 50,  "Thermal paste reapplication and fan cleaning", 45),
            # HP EliteBook 840 G7 (asset 2) — 3 records → triggers high maintenance
            (2, 600, "Hard drive failure - replaced with SSD", 180),
            (2, 350, "Charging port repair - replaced DC jack", 95),
            (2, 100, "RAM upgrade and diagnostics", 150),
            # Dell Latitude 7420 (asset 1) — 2 records
            (1, 400, "OS reinstall and driver update", 50),
            (1, 150, "Hinge repair - left hinge replaced", 120),
            # HP ProBook 450 G8 (asset 3) — 2 records
            (3, 300, "Touchpad replacement", 75),
            (3, 80,  "Battery health check and calibration", 30),
            # Lenovo ThinkPad T14s (asset 4) — 3 records → triggers high maintenance
            (4, 500, "Display panel replacement - dead pixels", 280),
            (4, 250, "Motherboard repair - USB ports failing", 420),
            (4, 60,  "Firmware update and BIOS reset", 25),
            # LG UltraWide (asset 16) — 1 record
            (16, 200, "Backlight bleeding repair", 150),
            # Samsung S24R350 (asset 25) — 1 record
            (25, 100, "Color calibration and OSD repair", 60),
            # iPhone 12 Mini (asset 28) — 2 records
            (28, 400, "Screen replacement - cracked display", 220),
            (28, 150, "Battery replacement - degraded capacity", 80),
            # iPhone 13 (asset 33) — 1 record
            (33, 200, "Face ID sensor recalibration", 90),
            # Samsung Galaxy S22 (asset 30) — 1 record
            (30, 120, "Charging port cleaning and replacement", 65),
        ]

        for asset_idx, days_ago, desc, cost in maintenance_data:
            db.add(models.MaintenanceRecord(
                asset_id=assets[asset_idx].id,
                service_date=d(days_ago),
                description=desc,
                cost=cost
            ))

        # Set a couple assets to IN_MAINTENANCE status
        assets[2].status = models.StatusEnum.IN_MAINTENANCE   # HP EliteBook
        assets[4].status = models.StatusEnum.IN_MAINTENANCE   # ThinkPad T14s

        # Set a couple assets to RETIRED status
        assets[19].status = models.StatusEnum.RETIRED  # LG 27UK850 (old, low condition)
        assets[46].status = models.StatusEnum.RETIRED   # Adobe Acrobat Pro DC (very old license)

        # Clean new tables
        print("Cleaning audit and verification tables...")
        db.query(models.AuditLog).delete()
        db.query(models.VerificationRecord).delete()
        db.commit()

        # Seed verification records
        print("Seeding verification records...")
        verifications = [
            # Overdue 100 days ago
            models.VerificationRecord(asset_id=assets[0].id, verified_by="Alice Chen", verified_at=datetime.datetime.now() - datetime.timedelta(days=100), status=models.VerificationStatusEnum.CONFIRMED, notes="Asset looks good."),
            models.VerificationRecord(asset_id=assets[1].id, verified_by="Alice Chen", verified_at=datetime.datetime.now() - datetime.timedelta(days=120), status=models.VerificationStatusEnum.DAMAGED, notes="Screen scratches."),
            
            # Recent 10 days ago
            models.VerificationRecord(asset_id=assets[6].id, verified_by="Marcus Rivera", verified_at=datetime.datetime.now() - datetime.timedelta(days=10), status=models.VerificationStatusEnum.CONFIRMED, notes="Verified in office."),
            models.VerificationRecord(asset_id=assets[7].id, verified_by="Marcus Rivera", verified_at=datetime.datetime.now() - datetime.timedelta(days=5), status=models.VerificationStatusEnum.NEEDS_REVIEW, notes="User complained about audio."),
        ]
        db.add_all(verifications)
        
        # Set flagged_in_audit for damaged one
        assets[1].flagged_in_audit = True
        
        # Seed some audit log entries
        print("Seeding audit log entries...")
        audit_logs = [
            models.AuditLog(user_email="alice.chen@acme.com", user_name="Alice Chen", action=models.AuditActionEnum.ASSET_CREATED, asset_id=assets[0].id, details="Created asset: Dell Latitude 5520", timestamp=datetime.datetime.now() - datetime.timedelta(days=150)),
            models.AuditLog(user_email="alice.chen@acme.com", user_name="Alice Chen", action=models.AuditActionEnum.ASSET_VERIFIED, asset_id=assets[0].id, details="Verified asset: Dell Latitude 5520 as CONFIRMED", timestamp=datetime.datetime.now() - datetime.timedelta(days=100)),
            models.AuditLog(user_email="marcus.rivera@acme.com", user_name="Marcus Rivera", action=models.AuditActionEnum.ASSET_ALLOCATED, asset_id=assets[0].id, details="Allocated asset to employee ID 1", timestamp=datetime.datetime.now() - datetime.timedelta(days=90)),
            models.AuditLog(user_email="marcus.rivera@acme.com", user_name="Marcus Rivera", action=models.AuditActionEnum.MAINTENANCE_LOGGED, asset_id=assets[0].id, details="Logged maintenance action: Clean keyboard (Cost: $25)", timestamp=datetime.datetime.now() - datetime.timedelta(days=45)),
            models.AuditLog(user_email="admin@acme.com", user_name="System Admin", action=models.AuditActionEnum.ASSET_RETURNED, asset_id=assets[0].id, details="Returned asset from allocation ID 1", timestamp=datetime.datetime.now() - datetime.timedelta(days=10)),
        ]
        db.add_all(audit_logs)

        db.commit()
        print(f"Seed complete! {len(assets)} assets, {len(employees)} employees, {len(allocations_data)} allocations, {len(maintenance_data)} maintenance records.")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
