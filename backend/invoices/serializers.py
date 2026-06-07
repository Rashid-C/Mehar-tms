from rest_framework import serializers
from .models import RateSheet, Tailor, Invoice

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