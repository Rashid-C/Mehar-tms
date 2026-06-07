from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum
from .models import Tailor, Invoice, RateSheet, ShopStitching, OrderReadymade
from .serializers import TailorSerializer, InvoiceSerializer, RateSheetSerializer, ShopStitchingSerializer, OrderReadymadeSerializer


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


class RateSheetViewSet(viewsets.ModelViewSet):
    queryset = RateSheet.objects.select_related('tailor').all()
    serializer_class = RateSheetSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['md_no', 'tailor__code']

    @action(detail=False, methods=['get'])
    def lookup(self, request):
        md_no = request.query_params.get('md_no')
        if not md_no:
            return Response({'error': 'md_no is required'}, status=400)

        # Priority 1 — Rate Sheet
        try:
            rate_sheet = RateSheet.objects.select_related('tailor').get(
                md_no=md_no,
                is_active=True
            )
            return Response({
                'md_no': rate_sheet.md_no,
                'tailor_id': rate_sheet.tailor.id,
                'tailor_code': rate_sheet.tailor.code,
                'tailor_name': rate_sheet.tailor.name,
                'rate': rate_sheet.rate,
                'work_type': rate_sheet.work_type,
                'inv_no': '',
                'source': 'rate_sheet',
            })
        except RateSheet.DoesNotExist:
            pass

        # Priority 2 — Last invoice with this MD number
        last_invoice = Invoice.objects.select_related('tailor').filter(
            md_no=md_no
        ).order_by('-created_at').first()

        if last_invoice:
            return Response({
                'md_no': last_invoice.md_no,
                'tailor_id': last_invoice.tailor.id,
                'tailor_code': last_invoice.tailor.code,
                'tailor_name': last_invoice.tailor.name,
                'rate': last_invoice.rate,
                'work_type': 'regular',
                'inv_no': str(last_invoice.inv_no),
                'source': 'invoice_history',
            })

        return Response({'error': 'MD number not found'}, status=404)


class ShopStitchingViewSet(viewsets.ModelViewSet):
    queryset = ShopStitching.objects.select_related('tailor').all()
    serializer_class = ShopStitchingSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['md_no', 'tailor__code', 'inv_no']
    ordering_fields = ['date', 'total']

    def get_queryset(self):
        queryset = ShopStitching.objects.select_related('tailor').all()
        tailor = self.request.query_params.get('tailor')
        month = self.request.query_params.get('month')
        date = self.request.query_params.get('date')
        if tailor:
            queryset = queryset.filter(tailor__code=tailor)
        if month:
            queryset = queryset.filter(date__month=month)
        if date:
            queryset = queryset.filter(date=date)
        return queryset

    @action(detail=False, methods=['get'])
    def summary(self, request):
        queryset = self.get_queryset()
        total_pieces = queryset.aggregate(Sum('pc_count'))['pc_count__sum'] or 0
        total_amount = queryset.aggregate(Sum('total'))['total__sum'] or 0
        return Response({
            'total_pieces': total_pieces,
            'total_amount': total_amount,
            'total_records': queryset.count(),
        })
    
class OrderReadymadeViewSet(viewsets.ModelViewSet):
    queryset = OrderReadymade.objects.all()
    serializer_class = OrderReadymadeSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['md_no', 'ord_no', 'barcode']
    ordering_fields = ['date', 'total_amount']

    def get_queryset(self):
        queryset = OrderReadymade.objects.all()
        month = self.request.query_params.get('month')
        status = self.request.query_params.get('status')
        date = self.request.query_params.get('date')
        if month:
            queryset = queryset.filter(date__month=month)
        if status:
            queryset = queryset.filter(status=status)
        if date:
            queryset = queryset.filter(date=date)
        return queryset

    @action(detail=False, methods=['get'])
    def summary(self, request):
        queryset = self.get_queryset()
        total_qty = queryset.aggregate(Sum('total_qty'))['total_qty__sum'] or 0
        total_amount = queryset.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        return Response({
            'total_orders': queryset.count(),
            'total_qty': total_qty,
            'total_amount': total_amount,
        })


