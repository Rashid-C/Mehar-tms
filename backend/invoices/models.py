from django.db import models

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