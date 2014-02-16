<?php

$root_path = "/home/web/nuevaweb/uploads";

if ($_GET['action'] == 'init') {

	$files = (scandir($root_path));
	$returnfiles = array();
	$returnfolders = array();
	foreach ($files as $key => $value) {
		if ($value != '.' && $value != '..') {
			if (is_dir($root_path . '/' . $value)) {
				$returnfolders[] = array('name' => $value, 'details' => array('size' => filesize($root_path . '/' . $value), 'lastmod' => filemtime($root_path . '/' . $value), 'mime' => mime_content_type($root_path . '/' . $value)));
			} else {
				$returnfiles[] = array('name' => $value, 'details' => array('size' => filesize($root_path . '/' . $value), 'lastmod' => filemtime($root_path . '/' . $value), 'mime' => mime_content_type($root_path . '/' . $value)));
			}
		}
	}

	echo '{"init_folders" : [
		{
            "path": "/",
            "name": "/"
        },
        {
            "path": "/img",
            "name": "Fotos"
        },
        {
            "path": "/docs",
            "name": "Documentos"
        },
        {
            "path": "/cursos",
            "name": "Cursos"
        },
         {
            "path": "/proyects",
            "name": "Proyectos"
        }
    ],
	"content_folders" : ' . json_encode($returnfolders) . ',
	"content_files" : ' . json_encode($returnfiles) . '
}';
} elseif ($_POST['action'] == 'getfolder') {

	$path = realpath($root_path . $_POST['path']);
	if ((strpos($path, $root_path) !== 0)) {
		die('Invalid');
	}

	$files = (scandir($path));
	$returnfiles = array();
	$returnfolders = array();
	foreach ($files as $key => $value) {
		if ($value != '.' && ($value != '..' || $path != $root_path)) {
			if (is_dir($path . '/' . $value)) {
				$returnfolders[] = array('name' => $value, 'details' => array('size' => filesize($path . '/' . $value), 'lastmod' => filemtime($path . '/' . $value), 'mime' => mime_content_type($path . '/' . $value)));
			} else {
				$returnfiles[] = array('name' => $value, 'details' => array('size' => filesize($path . '/' . $value), 'lastmod' => filemtime($path . '/' . $value), 'mime' => mime_content_type($path . '/' . $value)));
			}
		}
	}

	echo '{"content_folders" : ' . json_encode($returnfolders) . ',
	"content_files" : ' . json_encode($returnfiles) . '
}';

} elseif ($_POST['action'] == 'rename') {
	$path = realpath($root_path . '/' . $_POST['path']);

	if ((strpos($path, $root_path) !== 0)) {
		die('Invalid');
	}

	$patho = ($path . '/' . end(explode('/', $_POST['from'])));
	$pathd = ($path . '/' . end(explode('/', $_POST['to'])));

	if (!file_exists($pathd)) {
		if (rename($patho, $pathd)) {
			echo '{"status" : 1}';
		} else {
			echo '{"status" : 0}';
		}
	} else {
		echo '{"status" : 2}';
	}

} elseif ($_POST['action'] == 'mkdir') {
	$path = realpath($root_path . '/' . $_POST['path']);

	if ((strpos($path, $root_path) !== 0)) {
		die('Invalid');
	}

	$pathd = ($path . '/' . end(explode('/', $_POST['folder'])));

	if (!file_exists($pathd)) {
		if (mkdir($pathd, 0766)) {
			echo '{"status" : 1}';
		} else {
			echo '{"status" : 0}';
		}
	} else {
		echo '{"status" : 2}';
	}
} elseif ($_POST['action'] == 'unlink') {
	$path = realpath($root_path . '/' . $_POST['path']);

	if ((strpos($path, $root_path) !== 0)) {
		die('Invalid');
	}
	if($_POST['files'] == "" || $_POST['files'] == null) {
		die('Invalid');
	}
	$files = explode("/", $_POST['files']);

	$result = '{';

	foreach ($files as $key => $value) {
		if ($value != '.' && $value != '..') {
			if (file_exists($path . '/' . $value)) {
				if (is_dir($path . '/' . $value) ? delTree($path . '/' . $value) : unlink($path . '/' . $value)) {
					$result .= '"' . $value . '" : 1,';
				} else {
					$result .= '"' . $value . '" : 0,';
				}
			} else {
				$result .= '"' . $value . '" : 2,';
			}
		}
	}

	echo substr($result, 0, -1) . '}';

} elseif ($_GET['action'] == 'downloadZip') {
	$path = realpath($root_path . '/' . $_GET['path']);

	if ((strpos($path, $root_path) !== 0)) {
		die('Invalid');
	}

	$files = explode("/", $_GET['files']);
	// Prepare File
	$file = tempnam("tmp", "zip");
	$zip = new ZipArchive();
	$zip -> open($file, ZipArchive::OVERWRITE);

	$result = '{';

	foreach ($files as $key => $value) {
		if ($value !== '.' && $value !== '..') {
			if (file_exists($path . '/' . $value)) {
				// echo $path . '/' . $value;
				if (is_dir($path . '/' . $value))
					addFolderToZip(($path . '/' . $value), $zip, '', $root_path);
				else
					$zip -> addFile($path . '/' . $value, $value);
			}
		}
	}

	$zip -> close();
	header('Content-Type: application/zip');
	header('Content-Length: ' . filesize($file));
	header('Content-Disposition: attachment; filename="download.zip"');
	readfile($file);
	unlink($file);

} elseif ($_GET['action'] == 'download') {
	$path = realpath($root_path . '/' . $_GET['path']);

	if ((strpos($path, $root_path) !== 0) || preg_match('[/\\\\]',$_GET['file']) == 1) {
		die('Invalid');
	}

	$file = $path . '/' . end(explode("/", $_GET['file']));
	header('Content-Type: ' + mime_content_type($file));
	header('Content-Length: ' . filesize($file));
	header('Content-Disposition: attachment; filename="' . $_GET['file'] . '"');
	readfile($file);

} elseif ($_POST['action'] == 'uploadfile') {
	$path = realpath($root_path . '/' . $_POST['path']);

	if ((strpos($path, $root_path) !== 0)) {
		die('Invalid');
	}
	$uploads_dir = $path;
	foreach ($_FILES as $key => $val) {
		$num = 0;
		if ($_FILES[$key]["error"] == UPLOAD_ERR_OK) {

			$nname = $_FILES[$key]["name"];

			while (file_exists($uploads_dir . '/' . $nname)) {
				$num++;
				$name = $_FILES[$key]["name"];
				$ext = pathinfo($name, PATHINFO_EXTENSION);
				$nname = str_replace('.' . $ext, "", $name) . '(' . $num . ').' . $ext;
			}

			$name = $nname;
			
			 if(preg_match('[/\\\\]',$name) == 1) {
			 	die('Invalid');
			 }

			$tmp_name = $_FILES[$key]["tmp_name"];
			if (move_uploaded_file($tmp_name, $uploads_dir . '/' . $name)) {
				$pics[] = $name;
			} else {
			}
		}
	}
}

function delTree($dir) {
	$files = array_diff(scandir($dir), array('.', '..'));
	foreach ($files as $file) {
		(is_dir("$dir/$file")) ? delTree("$dir/$file") : unlink("$dir/$file");
	}
	return rmdir($dir);
}

function addFolderToZip($dir, $zipArchive, $zipdir = '', $root_path) {
	if (is_dir($dir)) {
		if ($dh = opendir($dir)) {
			//Add the directory
			$zipArchive -> addEmptyDir(str_ireplace($root_path, "", $dir));

			// Loop through all the files
			while (($file = readdir($dh)) !== false) {

				//If it's a folder, run the function again!
				if (!is_file($dir . $file)) {
					// Skip parent and root directories
					if (($file !== ".") && ($file !== "..")) {
						addFolderToZip($dir . $file . "/", $zipArchive, $zipdir . $file . "/", $root_path);
					}

				} else {
					// Add the files
					$zipArchive -> addFile($dir . $file, $zipdir . $file);

				}
			}
		}
	}
}

//
// $path = realpath($root_path . $_GET['path']);
// if ((strpos($path, $root_path) !== 0)) {
// die('Invalid');
// }
//
// $files = (scandir($path));
// $returnfiles = array();
// $returnfolders = array();
// foreach ($files as $key => $value) {
// if ($value != '.' && $value != '..') {
// if (is_dir($path . '/' . $value)) {
// $returnfolders[] = array('name' => $GET['path'] . '/' . $value, 'details' => array('size' => filesize($path . '/' . $value), 'lastmod' => filemtime($path . '/' . $value), 'mime' => mime_content_type($path . '/' . $value)));
// } else {
// $returnfiles[] = array('name' => $GET['path'] . '/' . $value, 'details' => array('size' => filesize($path . '/' . $value), 'lastmod' => filemtime($path . '/' . $value), 'mime' => mime_content_type($path . '/' . $value)));
// }
// }
// }
?>
