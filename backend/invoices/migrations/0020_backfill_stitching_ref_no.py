from django.db import migrations


def backfill_ref_no(apps, schema_editor):
    ShopStitching = apps.get_model('invoices', 'ShopStitching')
    for i, record in enumerate(ShopStitching.objects.order_by('date', 'id'), start=1):
        record.ref_no = f"ST{i:03d}"
        record.save(update_fields=['ref_no'])


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('invoices', '0019_shopstitching_ref_no'),
    ]

    operations = [
        migrations.RunPython(backfill_ref_no, noop),
    ]
