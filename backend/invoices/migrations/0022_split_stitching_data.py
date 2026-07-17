from django.db import migrations


def split_data(apps, schema_editor):
    ShopStitching = apps.get_model('invoices', 'ShopStitching')
    StitchingReference = apps.get_model('invoices', 'StitchingReference')
    StitchingLine = apps.get_model('invoices', 'StitchingLine')

    for i, old in enumerate(ShopStitching.objects.order_by('date', 'id'), start=1):
        ref_no = old.ref_no or f"ST{i:03d}"
        reference = StitchingReference.objects.create(
            ref_no=ref_no,
            md_no=old.md_no,
            cloth=old.cloth,
            mtr=old.mtr,
            inv_no=old.inv_no,
            remarks=old.remarks,
        )
        StitchingLine.objects.create(
            reference=reference,
            tailor=old.tailor,
            date=old.date,
            work_type='',
            price=old.rate,
            pieces=old.pc_count,
            total=old.total,
        )


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('invoices', '0021_stitchingreference_stitchingline'),
    ]

    operations = [
        migrations.RunPython(split_data, noop),
    ]
