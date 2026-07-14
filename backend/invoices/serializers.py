from rest_framework import serializers
from .models import RateSheet, Tailor, Invoice, ShopStitching, TailorOrder, Payment, JobInvoice, MaterialIssue, Item

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

class ShopStitchingSerializer(serializers.ModelSerializer):
    tailor_code = serializers.CharField(source='tailor.code', read_only=True)
    tailor_name = serializers.CharField(source='tailor.name', read_only=True)

    class Meta:
        model = ShopStitching
        fields = '__all__'
        read_only_fields = ['total', 'tailor_code', 'tailor_name']


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
