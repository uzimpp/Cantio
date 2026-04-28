from django.shortcuts import render
from django.http import JsonResponse


def api_docs(request):
    return render(request, 'api/index.html')


def health(request):
    return JsonResponse({"status": "ok"})
