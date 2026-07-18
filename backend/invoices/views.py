from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Sum, Max, Q
from django.db import transaction
import re
from .models import Tailor, Invoice, RateSheet, TailorOrder, Payment, JobInvoice, MaterialIssue, Item, StitchingReference, AllocationMaterial, StitchingWorkLine
from .serializers import (
    TailorSerializer, InvoiceSerializer, RateSheetSerializer,
    TailorOrderSerializer, PaymentSerializer, JobInvoiceSerializer,
    MaterialIssueSerializer, ItemSerializer,
    StitchingReferenceSerializer, AllocationMaterialSerializer, StitchingWorkLineSerializer,
)


class TailorPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 1000


class TailorViewSet(viewsets.ModelViewSet):
    queryset = Tailor.objects.all().order_by('code')
    serializer_class = TailorSerializer
    pagination_class = TailorPagination
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
        ji_qs = JobInvoice.objects.all()

        total_pieces = (queryset.aggregate(Sum('pc_count'))['pc_count__sum'] or 0) + \
                       (ji_qs.aggregate(Sum('pc_count'))['pc_count__sum'] or 0)
        total_amount = (queryset.aggregate(Sum('amount'))['amount__sum'] or 0) + \
                       (ji_qs.aggregate(Sum('amount'))['amount__sum'] or 0)
        total_invoices = queryset.count() + ji_qs.count()

        return Response({
            'total_pieces': total_pieces,
            'total_amount': total_amount,
            'total_invoices': total_invoices,
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

        # Priority 2 — Last JobInvoice with this model number
        last_job_invoice = JobInvoice.objects.select_related('tailor').filter(
            model_no=md_no
        ).order_by('-created_at').first()

        if last_job_invoice:
            return Response({
                'md_no': last_job_invoice.model_no,
                'tailor_id': last_job_invoice.tailor.id,
                'tailor_code': last_job_invoice.tailor.code,
                'tailor_name': last_job_invoice.tailor.name,
                'rate': last_job_invoice.rate,
                'work_type': 'regular',
                'inv_no': last_job_invoice.inv_no,
                'source': 'job_invoice_history',
            })

        # Priority 3 — Last old Invoice with this MD number
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
        date = request.query_params.get('date')
        month = request.query_params.get('month')
        period = bool(date or month)

        job_qs  = JobInvoice.objects.select_related('tailor').all()
        order_qs = TailorOrder.objects.select_related('tailor').all()
        prod_qs  = StitchingWorkLine.objects.select_related('tailor').all()
        mat_qs   = MaterialIssue.objects.select_related('tailor').all()
        pay_qs   = Payment.objects.select_related('tailor').all()

        if date:
            job_qs   = job_qs.filter(date=date)
            order_qs = order_qs.filter(date=date)
            prod_qs  = prod_qs.filter(date=date)
            mat_qs   = mat_qs.filter(date=date)
            pay_qs   = pay_qs.filter(date=date)
        elif month:
            job_qs   = job_qs.filter(date__month=month)
            order_qs = order_qs.filter(date__month=month)
            prod_qs  = prod_qs.filter(date__month=month)
            mat_qs   = mat_qs.filter(date__month=month)
            pay_qs   = pay_qs.filter(date__month=month)

        # Opening balance is a one-time carry-forward, not a per-period figure —
        # only include it in the all-time view, never in a date/month-filtered one.
        def _new(tailor):
            return {
                'tailor_id': tailor.id, 'tailor_code': tailor.code, 'tailor_name': tailor.name,
                'opening_balance': 0.0 if period else float(tailor.opening_balance),
                'shop_amount': 0.0, 'shop_qty': 0,
                'order_amount': 0.0, 'order_qty': 0,
                'production_amount': 0.0, 'production_qty': 0,
                'mat_issue_amount': 0.0,
                'paid_amount': 0.0,
            }

        by_tailor: dict = {}

        if not period:
            for t in Tailor.objects.filter(opening_balance__gt=0):
                by_tailor[t.id] = _new(t)

        for j in job_qs:
            tid = j.tailor.id
            if tid not in by_tailor: by_tailor[tid] = _new(j.tailor)
            by_tailor[tid]['shop_amount'] += float(j.amount)
            by_tailor[tid]['shop_qty']    += j.pc_count

        for o in order_qs:
            tid = o.tailor.id
            if tid not in by_tailor: by_tailor[tid] = _new(o.tailor)
            by_tailor[tid]['order_amount'] += float(o.amount)
            by_tailor[tid]['order_qty']    += o.quantity

        for s in prod_qs:
            tid = s.tailor.id
            if tid not in by_tailor: by_tailor[tid] = _new(s.tailor)
            by_tailor[tid]['production_amount'] += float(s.rate)
            by_tailor[tid]['production_qty']    += 1

        for m in mat_qs:
            tid = m.tailor.id
            if tid not in by_tailor: by_tailor[tid] = _new(m.tailor)
            by_tailor[tid]['mat_issue_amount'] += float(m.amount)

        for p in pay_qs:
            tid = p.tailor.id
            if tid in by_tailor:
                by_tailor[tid]['paid_amount'] += float(p.amount)

        result = []
        for data in by_tailor.values():
            data['total_amount'] = data['shop_amount'] + data['order_amount'] + data['production_amount']
            data['balance']      = (data['opening_balance'] + data['total_amount']
                                     - data['mat_issue_amount'] - data['paid_amount'])
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
    def next_inv_no(self, request):
        existing = TailorOrder.objects.filter(
            inv_no__startswith='OD'
        ).values_list('inv_no', flat=True)
        max_num = 0
        for inv in existing:
            m = re.match(r'^OD(\d+)$', inv)
            if m:
                max_num = max(max_num, int(m.group(1)))
        return Response({'next_inv_no': f"OD{max_num + 1:03d}"})

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


class MaterialIssueViewSet(viewsets.ModelViewSet):
    queryset = MaterialIssue.objects.select_related('tailor').all()
    serializer_class = MaterialIssueSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['tailor__code', 'tailor__name', 'description']
    ordering_fields = ['date', 'amount']

    def get_queryset(self):
        queryset = MaterialIssue.objects.select_related('tailor').all()
        tailor = self.request.query_params.get('tailor')
        date   = self.request.query_params.get('date')
        if tailor:
            queryset = queryset.filter(tailor__code=tailor)
        if date:
            queryset = queryset.filter(date=date)
        return queryset


class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code', 'category']
    ordering_fields = ['name', 'code', 'selling_price', 'created_at']

    def get_queryset(self):
        queryset = Item.objects.all()
        category = self.request.query_params.get('category')
        item_type = self.request.query_params.get('item_type')
        if category:
            queryset = queryset.filter(category=category)
        if item_type:
            queryset = queryset.filter(item_type=item_type)
        return queryset


class StitchingReferenceViewSet(viewsets.ModelViewSet):
    queryset = StitchingReference.objects.select_related('tailor').prefetch_related('materials', 'work_lines__tailor').all()
    serializer_class = StitchingReferenceSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['ref_no', 'md_no', 'inv_no', 'tailor__code']
    ordering_fields = ['ref_no', 'created_at']

    def get_queryset(self):
        queryset = StitchingReference.objects.select_related('tailor').prefetch_related('materials', 'work_lines__tailor').all()
        tailor = self.request.query_params.get('tailor')
        month = self.request.query_params.get('month')
        date = self.request.query_params.get('date')
        if tailor:
            queryset = queryset.filter(Q(tailor__code=tailor) | Q(work_lines__tailor__code=tailor))
        if month:
            queryset = queryset.filter(work_lines__date__month=month)
        if date:
            queryset = queryset.filter(work_lines__date=date)
        if tailor or month or date:
            queryset = queryset.distinct()
        return queryset

    def create(self, request, *args, **kwargs):
        data = request.data
        materials = data.get('materials') or []
        work_lines = data.get('work_lines') or []

        with transaction.atomic():
            ref_serializer = self.get_serializer(data={k: v for k, v in data.items() if k not in ('materials', 'work_lines')})
            ref_serializer.is_valid(raise_exception=True)
            reference = ref_serializer.save()

            for m in materials:
                if not m.get('name'):
                    continue
                mat_serializer = AllocationMaterialSerializer(data={'reference': reference.id, 'name': m.get('name'), 'qty': m.get('qty') or 0, 'price': m.get('price') or 0})
                mat_serializer.is_valid(raise_exception=True)
                mat_serializer.save()

            for w in work_lines:
                if not (w.get('tailor') and w.get('rate') and w.get('date')):
                    continue
                line_serializer = StitchingWorkLineSerializer(data={
                    'reference': reference.id, 'tailor': w.get('tailor'), 'work_type': w.get('work_type') or 'Stitching',
                    'rate': w.get('rate'), 'date': w.get('date'),
                })
                line_serializer.is_valid(raise_exception=True)
                line_serializer.save()

        return Response(self.get_serializer(reference).data, status=201)

    @action(detail=False, methods=['get'])
    def next_ref_no(self, request):
        existing = StitchingReference.objects.filter(
            ref_no__startswith='ST'
        ).values_list('ref_no', flat=True)
        max_num = 0
        for ref in existing:
            m = re.match(r'^ST(\d+)$', ref or '')
            if m:
                max_num = max(max_num, int(m.group(1)))
        return Response({'next_ref_no': f"ST{max_num + 1:03d}"})

    @action(detail=False, methods=['get'])
    def summary(self, request):
        references = self.get_queryset()
        work_lines = StitchingWorkLine.objects.filter(reference__in=references)
        month = request.query_params.get('month')
        date = request.query_params.get('date')
        if date:
            work_lines = work_lines.filter(date=date)
        elif month:
            work_lines = work_lines.filter(date__month=month)
        total_amount = work_lines.aggregate(Sum('rate'))['rate__sum'] or 0
        return Response({
            'total_amount': total_amount,
            'total_records': references.count(),
        })


class AllocationMaterialViewSet(viewsets.ModelViewSet):
    queryset = AllocationMaterial.objects.select_related('reference').all()
    serializer_class = AllocationMaterialSerializer
    filter_backends = [filters.OrderingFilter]

    def get_queryset(self):
        queryset = AllocationMaterial.objects.select_related('reference').all()
        reference = self.request.query_params.get('reference')
        if reference:
            queryset = queryset.filter(reference_id=reference)
        return queryset


class StitchingWorkLineViewSet(viewsets.ModelViewSet):
    queryset = StitchingWorkLine.objects.select_related('tailor', 'reference').all()
    serializer_class = StitchingWorkLineSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['tailor__code', 'tailor__name', 'reference__ref_no']
    ordering_fields = ['date', 'rate']

    def get_queryset(self):
        queryset = StitchingWorkLine.objects.select_related('tailor', 'reference').all()
        reference = self.request.query_params.get('reference')
        tailor = self.request.query_params.get('tailor')
        if reference:
            queryset = queryset.filter(reference_id=reference)
        if tailor:
            queryset = queryset.filter(tailor__code=tailor)
        return queryset
