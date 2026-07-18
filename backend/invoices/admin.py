from django.contrib import admin
from .models import Tailor, Invoice, RateSheet, TailorOrder, Payment, JobInvoice, Item, StitchingReference, AllocationMaterial, StitchingWorkLine

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

@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'item_type', 'category', 'roll_no', 'model_no', 'size', 'color', 'base_unit', 'purchase_price', 'selling_price', 'discount_percent', 'tax_percent', 'store', 'track_inventory', 'opening_stock']
    search_fields = ['name', 'code', 'category', 'color', 'roll_no', 'model_no']
    list_filter = ['item_type', 'category', 'size', 'color', 'store', 'track_inventory', 'warehouse']

class AllocationMaterialInline(admin.TabularInline):
    model = AllocationMaterial
    extra = 0

class StitchingWorkLineInline(admin.TabularInline):
    model = StitchingWorkLine
    extra = 0

@admin.register(StitchingReference)
class StitchingReferenceAdmin(admin.ModelAdmin):
    list_display = ['ref_no', 'md_no', 'tailor', 'inv_no', 'created_at']
    search_fields = ['ref_no', 'md_no', 'inv_no', 'tailor__code']
    list_filter = ['tailor']
    inlines = [AllocationMaterialInline, StitchingWorkLineInline]

@admin.register(AllocationMaterial)
class AllocationMaterialAdmin(admin.ModelAdmin):
    list_display = ['reference', 'name', 'qty', 'price']
    search_fields = ['reference__ref_no', 'name']

@admin.register(StitchingWorkLine)
class StitchingWorkLineAdmin(admin.ModelAdmin):
    list_display = ['reference', 'tailor', 'work_type', 'rate', 'date']
    search_fields = ['reference__ref_no', 'tailor__code', 'work_type']
    list_filter = ['tailor', 'work_type', 'date']