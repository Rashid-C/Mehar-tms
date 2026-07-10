from django.contrib import admin
from .models import Tailor, Invoice, RateSheet, ShopStitching, TailorOrder, Payment, JobInvoice

@admin.register(Tailor)
class TailorAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'phone', 'opening_balance', 'created_at']
    search_fields = ['code', 'name']

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['inv_no', 'tailor', 'md_no', 'rcv_date', 'pc_count', 'rate', 'amount', 'is_return']
    search_fields = ['inv_no', 'tailor__code', 'md_no']
    list_filter = ['tailor', 'rcv_date', 'is_return']
    readonly_fields = ['amount']

@admin.register(RateSheet)
class RateSheetAdmin(admin.ModelAdmin):
    list_display = ['md_no', 'tailor', 'rate', 'work_type', 'is_active']
    search_fields = ['md_no', 'tailor__code']
    list_filter = ['tailor', 'is_active', 'work_type']

@admin.register(ShopStitching)
class ShopStitchingAdmin(admin.ModelAdmin):
    list_display = ['date', 'tailor', 'md_no', 'pc_count', 'rate', 'total', 'cloth', 'mtr']
    search_fields = ['md_no', 'tailor__code', 'inv_no']
    list_filter = ['tailor', 'date']


@admin.register(JobInvoice)
class JobInvoiceAdmin(admin.ModelAdmin):
    list_display = ['inv_no', 'tailor', 'model_no', 'date', 'pc_count', 'rate', 'amount']
    search_fields = ['inv_no', 'model_no', 'tailor__code']
    list_filter = ['tailor', 'date']
    readonly_fields = ['amount']

@admin.register(TailorOrder)
class TailorOrderAdmin(admin.ModelAdmin):
    list_display = ['date', 'tailor', 'quantity', 'amount', 'remarks']
    search_fields = ['tailor__code', 'tailor__name']
    list_filter = ['tailor', 'date']

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['date', 'tailor', 'amount', 'remarks']
    search_fields = ['tailor__code', 'tailor__name']
    list_filter = ['tailor', 'date']