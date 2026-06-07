from django.contrib import admin
from .models import Tailor, Invoice,RateSheet

@admin.register(Tailor)
class TailorAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'phone', 'created_at']
    search_fields = ['code', 'name']

    @admin.register(RateSheet)
class RateSheetAdmin(admin.ModelAdmin):
    list_display = ['md_no', 'tailor', 'rate', 'work_type', 'is_active']
    search_fields = ['md_no', 'tailor__code']
    list_filter = ['tailor', 'is_active', 'work_type']

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['inv_no', 'tailor', 'md_no', 'rcv_date', 'pc_count', 'rate', 'amount', 'is_return']
    search_fields = ['inv_no', 'tailor__code', 'md_no']
    list_filter = ['tailor', 'rcv_date', 'is_return']
    readonly_fields = ['amount']