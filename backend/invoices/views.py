from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum
from .models import Tailor, Invoice
from .serializers import TailorSerializer, InvoiceSerializer

class TailorViewSet(viewsets.ModelViewSet):
    queryset = Tailor.objects.all()
    serializer_class = TailorSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['code', 'name']

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['inv_no', 'tailor__code', 'md_no']
    ordering_fields = ['inv_no', 'rcv_date', 'amount']

    def get_queryset(self):
        queryset = Invoice.objects.select_related('tailor').all()
        tailor = self.request.query_params.get('tailor')
        date = self.request.query_params.get('date')
        month = self.request.query_params.get('month')
        if tailor:
            queryset = queryset.filter(tailor__code=tailor)
        if date:
            queryset = queryset.filter(rcv_date=date)
        if month:
            queryset = queryset.filter(rcv_date__month=month)
        return queryset

    @action(detail=False, methods=['get'])
    def summary(self, request):
        queryset = self.get_queryset()
        total_pieces = queryset.aggregate(Sum('pc_count'))['pc_count__sum'] or 0
        total_amount = queryset.aggregate(Sum('amount'))['amount__sum'] or 0
        return Response({
            'total_pieces': total_pieces,
            'total_amount': total_amount,
            'total_invoices': queryset.count(),
        })