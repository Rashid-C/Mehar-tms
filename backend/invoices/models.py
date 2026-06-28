import re
from django.db import models
from django.core.exceptions import ValidationError


def validate_model_no(value):
    if not re.fullmatch(r'[a-zA-Z0-9]{1,7}', value):
        raise ValidationError('Model number must be 1–7 characters: letters and numbers only.')


class Tailor(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)  # MJ, KL, SD-ST etc
    phone = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.code} - {self.name}"

class Invoice(models.Model):
    tailor = models.ForeignKey(Tailor, on_delete=models.PROTECT, related_name='invoices')
    inv_no = models.PositiveIntegerField(unique=True)
    md_no = models.CharField(max_length=20)
    rcv_date = models.DateField()
    pc_count = models.PositiveIntegerField()
    rate = models.DecimalField(max_digits=8, decimal_places=2)
    amount = models.DecimalField(max_digits=10, decimal_places=2, editable=False)
    remarks = models.TextField(blank=True)
    is_return = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Auto-calculate amount — never trust manual entry
        self.amount = self.pc_count * self.rate
        super().save(*args, **kwargs)

    def __str__(self):
        return f"INV-{self.inv_no} | {self.tailor.code} | {self.amount}"

    class Meta:
        ordering = ['-inv_no']


class RateSheet(models.Model):
    tailor = models.ForeignKey(Tailor, on_delete=models.PROTECT, related_name='rate_sheets')
    md_no = models.CharField(max_length=20, unique=True)
    rate = models.DecimalField(max_digits=8, decimal_places=2)
    work_type = models.CharField(max_length=50, blank=True, default='regular')
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.md_no} → {self.tailor.code} @ {self.rate}"

    class Meta:
        ordering = ['md_no']

class ShopStitching(models.Model):
    tailor = models.ForeignKey(Tailor, on_delete=models.PROTECT, related_name='stitchings')
    md_no = models.CharField(max_length=20)
    date = models.DateField()
    pc_count = models.PositiveIntegerField()
    rate = models.DecimalField(max_digits=8, decimal_places=2)
    total = models.DecimalField(max_digits=10, decimal_places=2, editable=False)
    cloth = models.CharField(max_length=100, blank=True)
    mtr = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    inv_no = models.CharField(max_length=20, blank=True)
    remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        self.total = self.pc_count * self.rate
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.date} | {self.tailor.code} | {self.md_no} | {self.total}"

    class Meta:
        ordering = ['-date', '-created_at']

class JobInvoice(models.Model):
    inv_no = models.CharField(max_length=20, unique=True)   # MP001, MP002 …
    model_no = models.CharField(max_length=7, validators=[validate_model_no])
    date = models.DateField()
    pc_count = models.PositiveIntegerField()
    rate = models.DecimalField(max_digits=8, decimal_places=2)
    amount = models.DecimalField(max_digits=10, decimal_places=2, editable=False)
    tailor = models.ForeignKey(Tailor, on_delete=models.PROTECT, related_name='job_invoices')
    remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        self.amount = self.pc_count * self.rate
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.inv_no} | {self.tailor.code} | {self.model_no} | {self.amount}"

    class Meta:
        ordering = ['-created_at']


class TailorOrder(models.Model):
    inv_no = models.CharField(max_length=20, blank=True)
    job_invoice = models.ForeignKey(
        JobInvoice, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='orders'
    )
    tailor = models.ForeignKey(Tailor, on_delete=models.PROTECT, related_name='tailor_orders')
    date = models.DateField()
    quantity = models.PositiveIntegerField(default=0)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.date} | {self.tailor.code} | Qty:{self.quantity} | {self.amount}"

    class Meta:
        ordering = ['-date', '-created_at']


class MaterialIssue(models.Model):
    tailor = models.ForeignKey(Tailor, on_delete=models.PROTECT, related_name='material_issues')
    date = models.DateField()
    description = models.CharField(max_length=200, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.date} | {self.tailor.code} | {self.amount}"

    class Meta:
        ordering = ['-date', '-created_at']


class Payment(models.Model):
    job_invoice = models.ForeignKey(
        JobInvoice, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='payments'
    )
    tailor = models.ForeignKey(Tailor, on_delete=models.PROTECT, related_name='payments')
    date = models.DateField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.date} | {self.tailor.code} | {self.amount}"

    class Meta:
        ordering = ['-date', '-created_at']


