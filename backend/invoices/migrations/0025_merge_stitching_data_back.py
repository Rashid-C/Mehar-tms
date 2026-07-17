from django.db import migrations


def merge_back(apps, schema_editor):
    StitchingReference = apps.get_model('invoices', 'StitchingReference')
    ShopStitching = apps.get_model('invoices', 'ShopStitching')

    for reference in StitchingReference.objects.order_by('id'):
        lines = list(reference.lines.order_by('id'))
        for i, line in enumerate(lines):
            ShopStitching.objects.create(
                ref_no=reference.ref_no if i == 0 else None,
                tailor_id=line.tailor_id,
                md_no=reference.md_no,
                date=line.date,
                pc_count=line.pieces,
                rate=line.price,
                total=line.total,
                cloth=reference.cloth,
                mtr=reference.mtr,
                inv_no=reference.inv_no,
                remarks=reference.remarks,
            )


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('invoices', '0024_alter_stitchingline_tailor_shopstitching'),
    ]

    operations = [
        migrations.RunPython(merge_back, noop),
    ]
