from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TailorViewSet,
    InvoiceViewSet, RateSheetViewSet, TailorOrderViewSet, PaymentViewSet,
    JobInvoiceViewSet, MaterialIssueViewSet, ItemViewSet,
    StitchingReferenceViewSet, AllocationMaterialViewSet, StitchingWorkLineViewSet,
)

router = DefaultRouter()
router.register(r'tailors', TailorViewSet)
router.register(r'invoices', InvoiceViewSet)
router.register(r'ratesheets', RateSheetViewSet)
router.register(r'tailor-orders', TailorOrderViewSet)
router.register(r'payments', PaymentViewSet)
router.register(r'job-invoices', JobInvoiceViewSet)
router.register(r'material-issues', MaterialIssueViewSet)
router.register(r'items', ItemViewSet)
router.register(r'stitching-references', StitchingReferenceViewSet)
router.register(r'stitching-materials', AllocationMaterialViewSet)
router.register(r'stitching-work-lines', StitchingWorkLineViewSet)


urlpatterns = [
    path('', include(router.urls)),
]