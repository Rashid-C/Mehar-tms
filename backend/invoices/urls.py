from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    OrderReadymadeViewSet, ShopStitchingViewSet, TailorViewSet,
    InvoiceViewSet, RateSheetViewSet, TailorOrderViewSet, PaymentViewSet,
)

router = DefaultRouter()
router.register(r'tailors', TailorViewSet)
router.register(r'invoices', InvoiceViewSet)
router.register(r'ratesheets', RateSheetViewSet)
router.register(r'stitching', ShopStitchingViewSet)
router.register(r'orders', OrderReadymadeViewSet)
router.register(r'tailor-orders', TailorOrderViewSet)
router.register(r'payments', PaymentViewSet)


urlpatterns = [
    path('', include(router.urls)),
]