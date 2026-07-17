from django.db import migrations


def merge(apps, schema_editor):
    StitchingReference = apps.get_model('invoices', 'StitchingReference')
    StitchingWorkLine = apps.get_model('invoices', 'StitchingWorkLine')

    try:
        st001 = StitchingReference.objects.get(ref_no='ST001')
        st005 = StitchingReference.objects.get(ref_no='ST005')
    except StitchingReference.DoesNotExist:
        return

    if st001.md_no != st005.md_no or st001.inv_no != st005.inv_no:
        return

    StitchingWorkLine.objects.filter(reference=st001).update(reference=st005)
    st001.delete()


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('invoices', '0030_delete_shopstitching'),
    ]

    operations = [
        migrations.RunPython(merge, noop),
    ]
