import json

from django.conf import settings
from django.http import HttpResponse, Http404
from django.views.decorators.csrf import csrf_exempt
from django.core.paginator import Paginator, EmptyPage

from webgis.storage import forms
from webgis.storage.models import Ball, Drawing


def _get_file_extension(mime_type):
	mime_type = mime_type.split(";")[0].strip()
	return settings.FILE_EXTENSIONS_TABLE.get(mime_type, "txt")


@csrf_exempt
def ball(request):
	if request.method == "POST":
		form = forms.BallDataForm({
			'user': request.user.username,
			'data': request.body,
			'mime_type': request.environ['CONTENT_TYPE']
		})
		if form.is_valid():
			ball = form.save()
			return HttpResponse(ball.id)
	else:
		form = forms.GetBallForm(request.GET)
		if form.is_valid():
			ball = form.cleaned_data["ID"]
			response = HttpResponse(ball.data, content_type=ball.mime_type)
			response['Content-Disposition'] = 'attachment; filename={0}.{1}'.format(ball.id, _get_file_extension(ball.mime_type))
			return response
	raise Http404


@csrf_exempt
def drawing(request):
	if request.method == "POST":
		form = forms.DrawingRecordForm(request.POST)
		if form.is_valid():
			form.save()
			return HttpResponse("")
	else:
		form = forms.DrawingHistoryForm(request.GET)
		if form.is_valid():
			user = form.cleaned_data["USER"]
			project = form.cleaned_data["PROJECT"]
			start = form.cleaned_data["START"] or 0
			limit = form.cleaned_data["LIMIT"] or 20
			page = int(start/limit)+1
			if project:
				query = Drawing.objects.filter(user=user, project=project)
			else:
				query = Drawing.objects.filter(user=user)
			paginator = Paginator(query , limit)
			try:
				drawings = paginator.page(page)
			except EmptyPage:
				page = paginator.num_pages
				drawings = paginator.page(page)
			drawings_data = []
			for drawing in drawings:
				drawings_data .append({
					'title': drawing.title,
					'project': drawing.project,
					'time': int(drawing.timestamp.strftime("%s")), #print time.mktime(drawing.timestamp.timetuple())
					'drawing': drawing.ball_id,
					'permalink': drawing.permalink,
					'statistics': drawing.statistics
				})
			data = {
				'drawings': drawings_data,
				'count': paginator.count,
			}
			return HttpResponse(json.dumps(data), content_type='application/json')
	raise Http404
