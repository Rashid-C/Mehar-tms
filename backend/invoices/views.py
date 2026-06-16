from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Sum, Max, Q
import re
from .models import Tailor, Invoice, RateSheet, ShopStitching, OrderReadymade, TailorOrder, Payment, JobInvoice
from .serializers import (
    TailorSerializer, InvoiceSerializer, RateSheetSerializer,
    ShopStitchingSerializer, OrderReadymadeSerializer,
    TailorOrderSerializer, PaymentSerializer, JobInvoiceSerializer,
)


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


class JobInvoicePagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 1000


class JobInvoiceViewSet(viewsets.ModelViewSet):
    queryset = JobInvoice.objects.select_related('tailor').all()
    serializer_class = JobInvoiceSerializer
    pagination_class = JobInvoicePagination
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['inv_no', 'date', 'amount']

    def get_queryset(self):
        queryset = JobInvoice.objects.select_related('tailor').all()

        search = self.request.query_params.get('search', '').strip()
        if search:
            q = (
                Q(inv_no__icontains=search) |
                Q(model_no__icontains=search) |
                Q(tailor__code__icontains=search) |
                Q(tailor__name__icontains=search)
            )
            if re.match(r'^\d{4}-\d{2}-\d{2}$', search):
                q |= Q(date=search)
            elif re.match(r'^\d{4}-\d{2}$', search):
                y, m = search.split('-')
                q |= Q(date__year=int(y), date__month=int(m))
            queryset = queryset.filter(q)

        tailor = self.request.query_params.get('tailor')
        month = self.request.query_params.get('month')
        if tailor:
            queryset = queryset.filter(tailor__code=tailor)
        if month:
            queryset = queryset.filter(date__month=month)
        return queryset

    @action(detail=False, methods=['get'])
    def next_inv_no(self, request):
        existing = JobInvoice.objects.filter(
            inv_no__startswith='MP'
        ).values_list('inv_no', flat=True)
        max_num = 0
        for inv in existing:
            m = re.match(r'^MP(\d+)$', inv)
            if m:
                max_num = max(max_num, int(m.group(1)))
        return Response({'next_inv_no': f"MP{max_num + 1:03d}"})

    @action(detail=False, methods=['get'])
    def tailor_summary(self, request):
        month = request.query_params.get('month')

        job_qs = JobInvoice.objects.select_related('tailor').all()
        order_qs = TailorOrder.objects.select_related('tailor').all()

        if month:
            job_qs = job_qs.filter(date__month=month)
            order_qs = order_qs.filter(date__month=month)

        by_tailor: dict = {}
        for j in job_qs:
            tid = j.tailor.id
            if tid not in by_tailor:
                by_tailor[tid] = {
                    'tailor_id': tid,
                    'tailor_code': j.tailor.code,
                    'tailor_name': j.tailor.name,
                    'shop_amount': 0.0,
                    'order_amount': 0.0,
                }
            by_tailor[tid]['shop_amount'] += float(j.amount)

        for o in order_qs:
            tid = o.tailor.id
            if tid not in by_tailor:
                by_tailor[tid] = {
                    'tailor_id': tid,
                    'tailor_code': o.tailor.code,
                    'tailor_name': o.tailor.name,
                    'shop_amount': 0.0,
                    'order_amount': 0.0,
                }
            by_tailor[tid]['order_amount'] += float(o.amount)

        result = []
        for data in by_tailor.values():
            data['total_amount'] = data['shop_amount'] + data['order_amount']
            result.append(data)

        return Response(sorted(result, key=lambda x: x['tailor_code']))


class TailorOrderViewSet(viewsets.ModelViewSet):
    queryset = TailorOrder.objects.select_related('tailor').all()
    serializer_class = TailorOrderSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['tailor__code', 'tailor__name']
    ordering_fields = ['date', 'amount']

    def get_queryset(self):
        queryset = TailorOrder.objects.select_related('tailor').all()
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
        total_qty = queryset.aggregate(Sum('quantity'))['quantity__sum'] or 0
        total_amount = queryset.aggregate(Sum('amount'))['amount__sum'] or 0
        return Response({
            'total_orders': queryset.count(),
            'total_qty': total_qty,
            'total_amount': total_amount,
        })


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related('tailor').all()
    serializer_class = PaymentSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['tailor__code', 'tailor__name']
    ordering_fields = ['date', 'amount']

    def get_queryset(self):
        queryset = Payment.objects.select_related('tailor').all()
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
        total_amount = queryset.aggregate(Sum('amount'))['amount__sum'] or 0
        return Response({
            'total_payments': queryset.count(),
            'total_amount': total_amount,
        })

