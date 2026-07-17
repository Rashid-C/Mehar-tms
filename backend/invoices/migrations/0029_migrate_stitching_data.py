from django.db import migrations


def migrate_data(apps, schema_editor):
    ShopStitching = apps.get_model('invoices', 'ShopStitching')
    StitchingReference = apps.get_model('invoices', 'StitchingReference')
    AllocationMaterial = apps.get_model('invoices', 'AllocationMaterial')
    StitchingWorkLine = apps.get_model('invoices', 'StitchingWorkLine')

    # Group old flat rows into references: rows sharing the same ref_no, or (for
    # rows with no ref_no) the same md_no/cloth/mtr/inv_no, become one reference
    # with multiple work lines — this is how the old "multi-tailor" rows were stored.
    groups = {}
    next_seq = 1
    for old in ShopStitching.objects.order_by('date', 'id'):
        key = old.ref_no or (old.md_no, old.cloth, old.mtr, old.inv_no)
        groups.setdefault(key, []).append(old)

    for key, rows in groups.items():
        first = rows[0]
        ref_no = first.ref_no
        if not ref_no:
            while True:
                candidate = f"ST{next_seq:03d}"
                next_seq += 1
                if not StitchingReference.objects.filter(ref_no=candidate).exists():
                    ref_no = candidate
                    break

        remarks = first.remarks
        if any(r.pc_count for r in rows):
            piece_note = '; '.join(f"{r.tailor.code}: {r.pc_count}pc" for r in rows)
            remarks = f"{remarks} (Pieces — {piece_note})".strip()

        reference = StitchingReference.objects.create(
            ref_no=ref_no,
            md_no=first.md_no,
            tailor_id=first.tailor_id,
            inv_no=first.inv_no,
            remarks=remarks,
        )

        if first.cloth:
            AllocationMaterial.objects.create(reference=reference, name=first.cloth, qty=first.mtr or 0)

        for r in rows:
            StitchingWorkLine.objects.create(
                reference=reference,
                tailor_id=r.tailor_id,
                rate=r.rate,
                date=r.date,
            )


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('invoices', '0028_stitchingreference_allocationmaterial_and_more'),
    ]

    operations = [
        migrations.RunPython(migrate_data, noop),
    ]
