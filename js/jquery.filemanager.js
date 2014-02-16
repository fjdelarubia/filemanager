( function() {

		var settings;
		$.fn.filemanager = function(options) {
			settings = $.extend({}, $.fn.filemanager.defaults, options);

			return this.each(function() {
				createStructure(this, settings);
				$.get("https://zion.ieeesb.etsit.upm.es/nuevaweb/api.php?action=init", init, "json");
				$('#file-footer h4').html(settings.path);
			});

		};

		var sidebaritemfunc = function(t) {
			settings.path = $(this).attr('path');
			update();
		};

		var contentfolderfunc = function(t) {
			// $('input:checkbox').prop('checked', '').change();
			if (settings.show == 'list') {
				var target = t.target;
				if (t.target.localName == 'span') {
					target = $(t.target).parent('a').get(0);
				}
				if ($.trim(target.text) == '..') {
					var arr = settings.path.split('/');
					arr.pop();
					settings.path = (arr.join('/'));
					if (settings.path.indexOf('/') != 0)
						settings.path = '/' + settings.path;
				} else {
					if (settings.path == '/') {
						settings.path += $.trim(target.text);
					} else {
						settings.path += '/' + $.trim(target.text);
					}
				}
			} else {
				var target = t.target;
				if (t.target.localName != 'li') {
					target = $(t.target).parents('li').find('.title');
				} else {
					target = $(t.target).find('.title');
				}
				if ($.trim(target.text()) == '..') {
					var arr = settings.path.split('/');
					arr.pop();
					settings.path = (arr.join('/'));
					if (settings.path.indexOf('/') != 0)
						settings.path = '/' + settings.path;
				} else {
					if (settings.path == '/') {
						settings.path += $.trim(target.text());
					} else {
						settings.path += '/' + $.trim(target.text());
					}
				}
			}

			update();
		};

		function update() {
			disableActions();
			$.post("https://zion.ieeesb.etsit.upm.es/nuevaweb/api.php", {
				"action" : "getfolder",
				"path" : settings.path
			}, function(data) {
				$('#panel-content table tbody').empty();
				$('#items').empty();
				showItemsContent(data.content_folders, data.content_files);
				$('#file-footer h4').html(settings.path);
			}, "json");
		}

		function getGlaphyIcon(mime) {
			if (mime == 'directory')
				return 'glyphicon-folder-open';
			else if (mime.indexOf('image') !== -1)
				return 'glyphicon-picture';
			return 'glyphicon-file';
		}

		var init = function(data) {
			for (var i = 0; i < data.init_folders.length; i++) {
				var item = $('<a></a>', {
					'class' : 'list-group-item no-radius no-border' + (i == 0 ? 's' : '-sides'),
					'path' : data.init_folders[i].path
				});
				item.text(data.init_folders[i].name).click(sidebaritemfunc);
				$('#panel-sidebar div').append(item);
			}
			showItemsContent(data.content_folders, data.content_files);
			addListeners();
		};

		function addListeners() {

			$('#listbut').click(function() {
				settings.show = 'list';
				$('#panel-content').empty();
				$('#panel-content').append('<table id="details" class="table table-striped table-hover"><thead><tr><th><input type="checkbox" id="selectallfiles" /></th><th>Archivo</th><th>TamaÃ±o</th><th>Tipo</th><th>Fecha</th></tr></thead><tbody></tbody></table>');
				update();
			});

			$('#galbut').click(function() {
				settings.show = 'min';
				$('#panel-content').empty();
				$('#panel-content').append('<ul id="items"></ul>');
				update();
			});

			$('tbody').disableSelection();

			$('#uploadbtn').click(function() {
				$('#uploadbox').fadeIn();
			});

			$('#uploadbox .dismiss').click(function() {
				$('#uploadbox').empty().append('<div class="panel-heading"><button type="button" class="close pull-right dismiss" aria-hidden="true">&times;</button><h3 class="panel-title">Subir archivos</h3></div><div class="panel-body scroll"><div id="uploadzone" class="scroll"><h4 class="no-margin">Arrastra aqui tus archivos</h4></div></div><div class="panel-footer"><a class="btn btn-primary btn-sm pull-right dismiss">Aceptar</a><div class="clearfix"></div></div>');
				enableDrag();
				$('#uploadbox').fadeOut();
				update();
			});

			$('#selectallfiles').change(function() {
				if ($(this).is(':checked')) {
					$('input:checkbox:not("#selectallfiles")').prop('checked', 'checked');
				} else {
					$('input:checkbox:not("#selectallfiles")').prop('checked', '');
				}
			});

			$('#rename').click(function(e) {
				if (settings.show == 'list') {
					var selected = $('tbody input:checkbox:checked');
					var text = $.trim(selected.parents('tr').find('a').text());
					$('#renamebox input:text').prop('placeholder', text);

					$('#renamebox').fadeIn(function(e) {
						$('#renamebox input:text').focus();
					});
				} else {
					var selected = $('#items input:checkbox:checked');
					var text = $.trim(selected.parents('li').attr('name'));
					$('#renamebox input:text').prop('placeholder', text);

					$('#renamebox').fadeIn(function(e) {
						$('#renamebox input:text').focus();
					});
				}
				disableActions();
			});

			$('#renamebox .btn-success').click(function(e) {
				$.post("https://zion.ieeesb.etsit.upm.es/nuevaweb/api.php", {
					"action" : "rename",
					"path" : settings.path,
					"from" : $('#renamebox input:text').prop('placeholder'),
					"to" : $('#renamebox input:text').val()
				}, function(data) {
					$('#renamebox').fadeOut();
					$('#renamebox input:text').val('');
					if (data.status == 1) {
						update();
					} else {
						alert('Ha ocurrido un error');
					}
				}, "json");
			});

			$('#mkdir .btn-success').click(function(e) {
				mkdir(settings.path, $('#mkdir input:text').val());
			});

			$('#delete').click(function(e) {
				var files = "";
				if (settings.show == 'list')
					$('tbody input:checkbox:checked').each(function() {
						files += $.trim($(this).parents('tr').find('a').text()) + '/';
					});
				else
					$('#items input:checkbox:checked').each(function() {
						files += $.trim($(this).parents('li').attr('name')) + '/';
					});

				unlink(settings.path, files);

			});

			$('#downloadzip').click(function(e) {
				var files = "";
				$('tbody input:checkbox:checked').each(function() {
					files += $.trim($(this).parents('tr').find('a').text()) + '/';
				});

				downloadZip(settings.path, files);

			});

			$('#download').click(function(e) {
				var file = "";
				$('tbody input:checkbox:checked').each(function() {
					file = $.trim($(this).parents('tr').find('a').text());
				});

				download(settings.path, file);

			});

			$('.dialog input:text').bind("keypress", function(e) {
				var code = e.keyCode || e.which;
				if (code == 13) {
					e.preventDefault();

					return false;
				}
			});

			$('.dialog input:text').bind("keyup", function(e) {
				var code = e.keyCode || e.which;
				if (code == 13) {
					e.preventDefault();
					$(this).closest('.dialog').find('.btn-success').click();
					return false;
				} else if (code < 37 || code > 40) {
					var start = this.selectionStart, end = this.selectionEnd;
					$(this).val($(this).val().replace('/', '-'));
					this.setSelectionRange(start, end);
				}
			});

			$('#filter').bind("keyup", function(e) {
				var code = e.keyCode || e.which;
				if (code == 13) {
					e.preventDefault();
					return false;
				}

				$('tbody tr').each(function(e) {
					if ($(this).find('a').text().indexOf($('#filter').val()) === -1) {
						$(this).fadeOut();
					} else {
						$(this).fadeIn();
					}
				});
			});

			$('.dismiss').click(function(e) {
				$(this).closest('.panel').fadeOut();
			});

			$('#newfolder').click(function(e) {
				$('#mkdir').fadeIn(function(e) {
					$('#mkdir input:text').focus();
				});
				e.preventDefault();
				return false;
			});

		}

		function unlink(path, files) {
			$.post("https://zion.ieeesb.etsit.upm.es/nuevaweb/api.php", {
				"action" : "unlink",
				"path" : settings.path,
				"files" : files.slice(0, -1)
			}, function(data) {
				update();
				if (data.status == 1) {

				} else {
					//TODO Tratar error en funcion de que archivos no se han borrado
				}
			}, "json");
		}

		function mkdir(path, folder) {
			$.post("https://zion.ieeesb.etsit.upm.es/nuevaweb/api.php", {
				"action" : "mkdir",
				"path" : settings.path,
				"folder" : folder
			}, function(data) {
				$('#mkdir').fadeOut();
				$('#mkdir input:text').val('');
				if (data.status == 1) {
					update();
				} else {
					alert('Ha ocurrido un error');
				}
			}, "json");
		}

		function download(path, file) {
			window.location = 'https://zion.ieeesb.etsit.upm.es/nuevaweb/api.php?action=download&path=' + settings.path + '&file=' + file;
		}

		function downloadZip(path, files) {
			window.location = 'https://zion.ieeesb.etsit.upm.es/nuevaweb/api.php?action=downloadZip&path=' + settings.path + '&files=' + files.slice(0, -1);
		}

		function showItemsContent(folders, files) {//items
			if (settings.show == 'list') {
			}
			for (var i = 0; i < folders.length; i++) {
				if (settings.show == 'list')
					$('#panel-content table tbody').append('<tr><td><input type="checkbox"/></td><td><a class="folder"><span class="glyphicon ' + getGlaphyIcon(folders[i].details.mime) + '"></span> ' + folders[i].name + '</a></td><td class="size">' + getReadableFileSizeString(folders[i].details.size) + '</td><td class="type">' + folders[i].details.mime + '</td><td>' + (new Date(folders[i].details.lastmod * 1000)).toLocaleString() + '</td></tr>');
				else
					$('#items').append('<li class="folder img-thumbnail" mime="' + folders[i].details.mime + '" size="' + getReadableFileSizeString(folders[i].details.size) + '" name="' + folders[i].name + '"><span class="icon glyphicon glyphicon-folder-open"></span><span class="title">' + folders[i].name + '<input class="pull-right" type="checkbox"/></span></li>');
			};

			for (var i = 0; i < files.length; i++) {
				if (settings.show == 'list')
					$('#panel-content table tbody').append('<tr><td><input type="checkbox"/></td><td><a class="file"><span class="glyphicon ' + getGlaphyIcon(files[i].details.mime) + '"></span> ' + files[i].name + '</a></td><td class="size">' + getReadableFileSizeString(files[i].details.size) + '</td><td class="type">' + files[i].details.mime + '</td><td>' + (new Date(files[i].details.lastmod * 1000)).toLocaleString() + '</td></tr>');
				else {
					if (getGlaphyIcon(files[i].details.mime) == 'glyphicon-picture') {
						$('#items').append('<li class="file img-thumbnail" mime="' + files[i].details.mime + '" size="' + getReadableFileSizeString(files[i].details.size) + '" name="' + files[i].name + '"><img src="' + settings.baseurl + '/' + settings.path + '/' + files[i].name + '"><span class="title">' + shortName(files[i].name, 15) + '<input class="pull-right" type="checkbox"/></span></li>');
					} else {
						$('#items').append('<li class="file img-thumbnail" mime="' + files[i].details.mime + '" size="' + getReadableFileSizeString(files[i].details.size) + '" name="' + files[i].name + '"><span class="icon glyphicon ' + getGlaphyIcon(files[i].details.mime) + '"></span><span class="title">' + shortName(files[i].name, 15) + '<input class="pull-right" type="checkbox"/></span></li>');
					}
				}
			};

			$('table input:checkbox, #items li .title input:checkbox').click(function(e) {
				if (e.shiftKey) {
					if (settings.show == 'list') {
						if ($(clicked).index() < $(e.target).closest('tr').index())
							$(clicked).nextUntil($(e.target).closest('tr'), 'tr').click();
						else if ($(clicked).index() > $(e.target).closest('tr').index())
							$(clicked).prevUntil($(e.target).closest('tr'), 'tr').click();

					} else {
						console.log(clicked);
						console.log(e.target);
						if ($(clicked).index() < $(e.target).parents('li').index())
							$(clicked).nextUntil($(e.target).parents('li'), 'li').find('input:checkbox').click();
						else if ($(clicked).index() > $(e.target).parents('li').index())
							$(clicked).prevUntil($(e.target).parents('li'), 'li').find('input:checkbox').click();

					}
				}

				if (settings.show == 'list')
					clicked = $(e.target).closest('tr');
				else
					clicked = $(e.target).closest('li');

				e.stopPropagation();
			});
			$('table input:checkbox, #items li .title input').change(function(e) {
				if ($('input:checkbox:checked').length > 0) {
					enableActions();
				} else {
					disableActions();
				}

				if ($('tbody input:checkbox:checked, #items li .title input:checked').length == 1) {
					if ($('tbody input:checkbox:checked').parents('tr').find('.glyphicon-folder-open').length > 0) {
						$('#downloadzip').closest('li').removeClass('disabled');
						$('#download').closest('li').addClass('disabled');
					} else {
						$('#downloadzip').closest('li').addClass('disabled');
						$('#download').closest('li').removeClass('disabled');
					}
					$('#rename').closest('li').removeClass('disabled');
				} else {
					$('#rename').closest('li').addClass('disabled');
					$('#download').closest('li').addClass('disabled');
				}
				if ($('tbody input:checkbox:checked, #items li .title input:checked').length > 1) {
					$('#downloadzip').closest('li').removeClass('disabled');
				}
			});

			var clicked;

			$('tbody tr').click(function(e) {
				if (e.shiftKey) {
					if ($(clicked).index() < $(e.target).closest('tr').index())
						$(clicked).nextUntil($(e.target).closest('tr'), 'tr').click();
					else if ($(clicked).index() > $(e.target).closest('tr').index())
						$(clicked).prevUntil($(e.target).closest('tr'), 'tr').click();
				}

				clicked = $(e.target).closest('tr');

				if (!$(this).find('input:checkbox').is(':checked')) {
					$(this).find('input:checkbox').prop('checked', 'checked');
				} else {
					$(this).find('input:checkbox').prop('checked', '');
				}
				$(this).find('input:checkbox').change();
			});

			$('a.folder, #items li.folder').click(contentfolderfunc);
			$('a.file, #items li.file').click(function(t) {
				if (settings.show == 'list') {
					var target = $(t.target);
					if (t.target.localName == 'span') {
						target = $(t.target).parents('a').get(0);
					}
					var file = {
						'name' : $.trim(target.text()),
						'type' : $(target).parents('tr').find('.type').html(),
						'size' : $(target).parents('tr').find('.size').html()
					};
				} else {
					var target = $(t.target);
					if (t.target.localName != 'li') {
						target = $(t.target).parents('li');
					}
					var file = {
						'name' : target.attr('name'),
						'type' : target.attr('mime'),
						'size' : target.attr('size'),
					};
				}
				settings.click(file);
			});
		}

		function getReadableFileSizeString(fileSizeInBytes) {

			var i = -1;
			var byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];
			do {
				fileSizeInBytes = fileSizeInBytes / 1024;
				i++;
			} while (fileSizeInBytes > 1024);

			return Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i];
		};

		function createStructure(t, settings) {
			$(t).addClass('panel panel-default');
			var header = $('<div/>', {
				'class' : 'panel-heading'
			}).html('<button type="button" class="dismiss close pull-right" aria-hidden="true">&times;</button><h3 class="panel-title">' + settings.title + '</h3>');
			var navbar = $('<nav/>', {
				'class' : 'navbar navbar-default navbar-static-top no-margin',
				'role' : 'navigation'
			}).append('<div class="collapse navbar-collapse"><ul class="nav navbar-nav"><li class="dropdown"><a href="#" class="dropdown-toggle" data-toggle="dropdown">' + settings.create + ' <b class="caret"></b></a><ul class="dropdown-menu"><li><a id="newfile" href="#">' + settings.file + '</a></li><li><a id="newfolder" href="#">' + settings.folder + '</a></li></ul></li><li><a id="uploadbtn" href="#"><span class="glyphicon glyphicon-cloud-upload"></span> ' + settings.upload + '</a></li><li class="dropdown disabled"><a id="actions" href="#" class="dropdown-toggle" data-toggle=""><span class="glyphicon glyphicon-cog disabled"></span> ' + settings.actions + ' <span class="caret" style="display:none;"></b></a><ul class="dropdown-menu"><li><a id="copy" href="#">' + settings.copy + '</a></li><li><a id="cut" href="#">' + settings.cut + '</a></li><li><a id="paste" href="#">' + settings.paste + '</a></li><li class="divider"></li><li><a id="rename" href="#">' + settings.rename + '</a></li><li class="divider"></li><li><a id="delete" href="#">' + settings.del + '</a></li><li class="divider"></li><li><a id="download" href="#">' + settings.download + '</a></li><li><a id="downloadzip" href="#">' + settings.downloadzip + '</a></li></ul></li></ul><div class="navbar-form navbar-right"><input id="filter" type="text" class="form-control" placeholder="' + settings.filter + '"></div><ul class="nav navbar-nav navbar-right"><li><a id="listbut" href="#"><span class="glyphicon glyphicon-list"></span></a></li><li><a id="galbut" href="#"><span class="glyphicon glyphicon-th"></span></a></li></ul></div>');

			var body = $('<div/>', {
				'class' : 'panel-body no-padding',
				'id' : 'file-body'
			});

			var footer = $('<div/>', {
				'class' : 'panel-footer',
				'id' : 'file-footer'
			}).append('<h4 class="no-margin"></h4>');

			var sidebar = $('<div/>', {
				'id' : 'panel-sidebar',
				'class' : 'col-md-3 no-padding'
			}).append('<div class="list-group no-radius no-borders no-margin scroll"></div>');

			var content = $('<div/>', {
				'id' : 'panel-content',
				'class' : 'col-md-9 no-padding scroll'
			});

			var rename = $('<div/>', {
				'id' : 'renamebox',
				'class' : 'dialog panel panel-default'
			}).append('<div class="panel-heading"><button type="button" class="close pull-right dismiss" aria-hidden="true">&times;</button><h3 class="panel-title">Renombrar</h3></div><div class="panel-body"><form class="form-inline no-margin" role="form"><div class="form-group"><label for="filename">Nombre</label><input type="text" class="form-control" id="filename" placeholder=""></div></form></div><div class="panel-footer"><a class="btn btn-danger btn-sm pull-right dismiss">Cancelar</a><a class="btn btn-success btn-sm pull-right">Aceptar</a><div class="clearfix"></div></div>');
			//TODO traducir

			var mkdir = $('<div/>', {
				'id' : 'mkdir',
				'class' : 'dialog panel panel-default'
			}).append('<div class="panel-heading"><button type="button" class="close pull-right dismiss" aria-hidden="true">&times;</button><h3 class="panel-title">Crear carpeta</h3></div><div class="panel-body"><form class="form-inline no-margin" role="form"><div class="form-group"><label for="filename">Nombre</label><input type="text" class="form-control" id="filename" placeholder=""></div></form></div><div class="panel-footer"><a class="btn btn-danger btn-sm pull-right dismiss">Cancelar</a><a class="btn btn-success btn-sm pull-right">Aceptar</a><div class="clearfix"></div></div>');
			//TODO traducir

			var uploadbox = $('<div/>', {
				'id' : 'uploadbox',
				'class' : 'panel panel-default'
			}).append('<div class="panel-heading"><button type="button" class="close pull-right dismiss" aria-hidden="true">&times;</button><h3 class="panel-title">Subir archivos</h3></div><div class="panel-body scroll"><div id="uploadzone" class="scroll"><h4 class="no-margin">Arrastra aqui tus archivos</h4></div></div><div class="panel-footer"><a class="btn btn-primary btn-sm pull-right dismiss">Aceptar</a><div class="clearfix"></div></div>');

			if (settings.show == 'list')
				content.append('<table id="details" class="table table-striped table-hover"><thead><tr><th><input type="checkbox" id="selectallfiles" /></th><th>Archivo</th><th>TamaÃ±o</th><th>Tipo</th><th>Fecha</th></tr></thead><tbody></tbody></table>');
			else
				content.append('<ul id="items"></ul>');
			body.append(sidebar).append(content);

			$(t).append(header);
			$(t).append(navbar);
			$(t).append(body);
			$(t).append(footer);
			$(t).append(rename);
			$(t).append(mkdir);
			$(t).append(uploadbox);

			enableDrag();
		}

		function disableActions() {
			$('#actions').attr('data-toggle', '');
			$('#actions').closest('li').addClass('disabled');
			$('#actions .caret').css('display', 'none');
		}

		function enableActions() {
			$('#actions').attr('data-toggle', 'dropdown');
			$('#actions').closest('li').removeClass('disabled');
			$('#actions .caret').css('display', 'inline-block');
		}

		function enableDrag() {

			$('#uploadbox .dismiss').click(function() {
				$('#uploadbox').empty().append('<div class="panel-heading"><button type="button" class="close pull-right dismiss" aria-hidden="true">&times;</button><h3 class="panel-title">Subir archivos</h3></div><div class="panel-body scroll"><div id="uploadzone" class="scroll"><h4 class="no-margin">Arrastra aqui tus archivos</h4></div></div><div class="panel-footer"><a class="btn btn-primary btn-sm pull-right dismiss">Aceptar</a><div class="clearfix"></div></div>');
				enableDrag();
				$('#uploadbox').fadeOut();
				update();
			});

			var doc = $("#uploadzone");
			var dndSupported = function() {
				var div = document.createElement('div');
				return ('draggable' in div) || ('ondragstart' in div && 'ondrop' in div);
			};

			if (!dndSupported()) {
				// take alternative route
			} else {

				doc.on("dragend", function() {
					$(this).removeClass('hover');
					return false;
				});

				doc.on("dragover", function() {
					$(this).addClass('hover');
					return false;
				});

				doc.on("drop", function(event) {
					$('#uploadzone').empty();
					$('#uploadzone').css('border', '0px');
					$('#uploadzone').parents('.panel-body').css('padding', '0px').css('height', '209px');
					$('#uploadzone').append('<table class="table table-striped"><thead><tr><th>Archivo</th><th>TamaÃ±o</th><th><span class="pull-right">%</span></th></tr></thead><tbody></tbody></table>');
					$('.bar').width('0%');
					event.preventDefault && event.preventDefault();
					this.className = '';
					var files = event.originalEvent.dataTransfer.files;

					for (var i = 0; i < files.length; i++) {
						var formData = new FormData();
						$('#uploadzone table tbody').append('<tr><td class="cname">' + files[i].name + '</td><td class="csize">' + getReadableFileSizeString(files[i].size) + '</td><td class="cprogress"><div class="progress progress-striped"><div class="progress-bar progress-bar-success" role="progressbar" aria-valuenow="40" aria-valuemin="0" aria-valuemax="100" style="width: 0%"></div></div></td></tr>');
						formData.append('file', files[i]);
						formData.append('path', settings.path);
						formData.append('action', 'uploadfile');

						var xhr = new XMLHttpRequest();

						xhr.open('POST', 'https://zion.ieeesb.etsit.upm.es/nuevaweb/api.php');
						xhr.id = "434";
						xhr.onload = function() {
							// var response = JSON.parse(this.responseText);
							// if (xhr.status === 200) {
							// update();
							// } else {
							// // console.log('Something went terribly wrong...');
							// }
						};
						xhr.upload.onloadstart = function(e) {
							// generate unique id for progress bars. This is important because we'll use it on progress event for modifications
							this.progressId = "progress_" + Math.floor((Math.random() * 100000));

							// append progress elements to somewhere you want
							$("#uploadzone table tr:last-child .cprogress .progress").prop('id', this.progressId);
						};

						xhr.upload.onprogress = function(event) {
							if (event.lengthComputable) {
								var complete = (event.loaded / event.total * 100 | 0);
								$('#' + this.progressId + ' div').css('width', complete + '%');
							}
						};

						xhr.send(formData);
					};

					return false;
				});

				doc.on("dragleave", function() {
					$(this).removeClass('hover');
					return false;
				});
			}
		}


		$.fn.filemanager.defaults = {
			'baseurl' : 'https://zion.ieeesb.etsit.upm.es/nuevaweb/uploads',
			'apiurl' : 'https://zion.ieeesb.etsit.upm.es/nuevaweb/api.php',
			'title' : 'FileManager',
			'path' : '/',
			'create' : 'Nuevo',
			'file' : 'Archivo',
			'folder' : 'Carpeta',
			'upload' : 'Subir',
			'filter' : 'Filtrar',
			'show' : 'min',
			'actions' : 'Acciones',
			'copy' : 'Copiar',
			'cut' : 'Cortar',
			'paste' : 'Pegar',
			'rename' : 'Renombrar',
			'del' : 'Borrar',
			'download' : 'Descargar',
			'downloadzip' : 'Descargar en ZIP',
			'click' : function(f) {
				console.log(f);
			}
		};

		$.fn.disableSelection = function() {
			return this.attr('unselectable', 'on').css('user-select', 'none').on('selectstart', false);
		};

		function shortName(name, max) {
			if (name.length > max)
				return name.substring(0, Math.ceil(max / 2)) + '...' + name.substring(name.length - Math.ceil(max / 2), name.lenght);
			else
				return name;
		}

	}(jQuery));
