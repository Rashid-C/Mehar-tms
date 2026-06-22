from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ShopStitchingViewSet, TailorViewSet,
    InvoiceViewSet, RateSheetViewSet, TailorOrderViewSet, PaymentViewSet,
    JobInvoiceViewSet,
)

router = DefaultRouter()
router.register(r'tailors', TailorViewSet)
router.register(r'invoices', InvoiceViewSet)
router.register(r'ratesheets', RateSheetViewSet)
router.register(r'stitching', ShopStitchingViewSet)
router.register(r'tailor-orders', TailorOrderViewSet)
router.register(r'payments', PaymentViewSet)
router.register(r'job-invoices', JobInvoiceViewSet)


urlpatterns = [
    path('', include(router.urls)),
]