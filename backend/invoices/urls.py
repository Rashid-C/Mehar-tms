from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TailorViewSet, InvoiceViewSet, RateSheetViewSet

router = DefaultRouter()
router.register(r'tailors', TailorViewSet)
router.register(r'invoices', InvoiceViewSet)
router.register(r'ratesheets', RateSheetViewSet)

urlpatterns = [
    path('', include(router.urls)),
]