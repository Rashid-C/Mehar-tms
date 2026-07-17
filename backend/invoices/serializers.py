from rest_framework import serializers
from .models import RateSheet, Tailor, Invoice, TailorOrder, Payment, JobInvoice, MaterialIssue, Item, StitchingReference, AllocationMaterial, StitchingWorkLine

class TailorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tailor
        fields = '__all__'

class InvoiceSerializer(serializers.ModelSerializer):
    tailor_code = serializers.CharField(source='tailor.code', read_only=True)
    tailor_name = serializers.CharField(source='tailor.name', read_only=True)

    class Meta:
        model = Invoice
        fields = '__all__'
        read_only_fields = ['amount']

class RateSheetSerializer(serializers.ModelSerializer):
    tailor_code = serializers.CharField(source='tailor.code', read_only=True)
    tailor_name = serializers.CharField(source='tailor.name', read_only=True)

    class Meta:
        model = RateSheet
        fields = '__all__'
        read_only_fields = ['tailor_code', 'tailor_name']



class JobInvoiceSerializer(serializers.ModelSerializer):
    tailor_code = serializers.CharField(source='tailor.code', read_only=True)
    tailor_name = serializers.CharField(source='tailor.name', read_only=True)

    class Meta:
        model = JobInvoice
        fields = '__all__'
        read_only_fields = ['amount', 'tailor_code', 'tailor_name']


class TailorOrderSerializer(serializers.ModelSerializer):
    tailor_code = serializers.CharField(source='tailor.code', read_only=True)
    tailor_name = serializers.CharField(source='tailor.name', read_only=True)

    class Meta:
        model = TailorOrder
        fields = '__all__'
        read_only_fields = ['tailor_code', 'tailor_name']


class PaymentSerializer(serializers.ModelSerializer):
    tailor_code = serializers.CharField(source='tailor.code', read_only=True)
    tailor_name = serializers.CharField(source='tailor.name', read_only=True)

    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['tailor_code', 'tailor_name']


class MaterialIssueSerializer(serializers.ModelSerializer):
    tailor_code = serializers.CharField(source='tailor.code', read_only=True)
    tailor_name = serializers.CharField(source='tailor.name', read_only=True)

    class Meta:
        model = MaterialIssue
        fields = '__all__'
        read_only_fields = ['tailor_code', 'tailor_name']


class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = '__all__'


class AllocationMaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = AllocationMaterial
        fields = '__all__'


class StitchingWorkLineSerializer(serializers.ModelSerializer):
    tailor_code = serializers.CharField(source='tailor.code', read_only=True)
    tailor_name = serializers.CharField(source='tailor.name', read_only=True)

    class Meta:
        model = StitchingWorkLine
        fields = '__all__'
        read_only_fields = ['tailor_code', 'tailor_name']


class StitchingReferenceSerializer(serializers.ModelSerializer):
    tailor_code = serializers.CharField(source='tailor.code', read_only=True)
    tailor_name = serializers.CharField(source='tailor.name', read_only=True)
    materials = AllocationMaterialSerializer(many=True, read_only=True)
    work_lines = StitchingWorkLineSerializer(many=True, read_only=True)
    materials_total = serializers.SerializerMethodField()
    work_total = serializers.SerializerMethodField()

    class Meta:
        model = StitchingReference
        fields = '__all__'
        read_only_fields = ['tailor_code', 'tailor_name']

    def get_materials_total(self, obj):
        return sum(float(m.qty) for m in obj.materials.all())

    def get_work_total(self, obj):
        return sum(float(w.rate) for w in obj.work_lines.all())
