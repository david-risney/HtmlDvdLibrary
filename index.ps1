$config = (Invoke-WebRequest -Uri "http://api.themoviedb.org/3/configuration?api_key=41d7473ac4fa3fb61a3eca0bd2ec47a9").Content | ConvertFrom-Json;
$indexEntries = "";

function resizeImageSmaller {
    param(
        [string] $imagePath,
        [Double] $width,
        [Double] $height);

    $image = New-Object -ComObject Wia.ImageFile        
    $image.LoadFile($imagePath);

    if ($image.width -gt $width -or $image.height -gt $height) {
        $filter = New-Object -ComObject Wia.ImageProcess
        $scaleIdx = $filter.Filters.Count + 1;
        $scaleId = $filter.FilterInfos.Item("Scale").FilterId;

        $filter.Filters.Add($scaleId);

        $filter.Filters.Item($scaleIdx).Properties.Item("PreserveAspectRatio") = $true;
        $filter.Filters.Item($scaleIdx).Properties.Item("MaximumWidth") = $width
        $filter.Filters.Item($scaleIdx).Properties.Item("MaximumHeight") = $height

        $image = $filter.Apply($image.PSObject.BaseObject);

        Remove-Item $imagePath;
        $image.SaveFile($imagePath);
    }
}

Get-ChildItem * -Directory | %{
	$folder = $_;
	$name = $folder.Name;
	$encName = [System.Uri]::EscapeDataString($name);
	$infoPath = (Join-Path $folder.FullName "info.json");
	$videos = @(@(dir $folder.FullName -fi *.m4v) + @(dir $folder.FullName -fi *.mp4) | sort -Descending Name);

	if (!(Test-Path $infoPath)) {
		(Invoke-WebRequest -Uri ("http://api.themoviedb.org/3/search/multi?api_key=41d7473ac4fa3fb61a3eca0bd2ec47a9&query=" + $encName) -OutFile $infoPath);
	}
	if (Test-Path $infoPath) {
		echo $infoPath;
		$info = (gc $infoPath | ConvertFrom-Json).results[0];
		$basePath = $config.images.base_url + "original";

		$backdropPath = (Join-Path $folder.FullName "backdrop.jpg");
		if ($info.backdrop_path -and !(Test-Path $backdropPath)) {
			Invoke-WebRequest ($basePath + $info.backdrop_path) -OutFile $backdropPath;
		}
        $backdropFullPath = (Join-Path $folder.FullName "backdrop.full.jpg");
		if ((Test-Path $backdropPath) -and !(Test-Path $backdropFullPath)) {
            cp $backdropPath $backdropFullPath;
            resizeImageSmaller $backdropPath 1376 768;
        }

		$posterPath = (Join-Path $folder.FullName "poster.jpg");
		if ($info.poster_path -and !(Test-Path $posterPath)) {
			Invoke-WebRequest ($basePath + $info.poster_path) -OutFile $posterPath;
		}
        $posterFullPath = (Join-Path $folder.FullName "poster.full.jpg");
		if ((Test-Path $posterPath) -and !(Test-Path $posterFullPath)) {
            cp $posterPath $posterFullPath;
            resizeImageSmaller $posterPath 256 384;
        }

		if ($videos.length -gt 0) {
			$indexEntries += ((Get-Content indexEntry.html.template | %{ 
				$_ -replace "{posterUri}",($encName + "/poster.jpg") #($basePath + $info.poster_path) 
			} | %{ 
				$_ -replace "{movieTitle}",$name 
			} | %{ 
				$_ -replace "{encMovieTitle}",$encName 
			}) -join "`n");

			if ($videos.length -eq 1) {
				$video = $videos[0];
				$encVideoName = [System.Uri]::EscapeDataString($video.Name);

				Get-Content movie.html.template | %{ 
					($_ -replace "{movieUri}",$encVideoName) -replace "{nextUri}","../"; 
				} | Out-File -FilePath (Join-Path $folder.FullName "index.html") -Encoding utf8;
			}
			else {
				$subIndexEntries = "";
				$previousEncVideoHtmlUri = "./";
				$videos | %{
					$video = $_;
					$videoName = $video.name.substring(0, $video.Name.lastIndexOf("."));
					$encVideoName = [System.Uri]::EscapeDataString($video.Name);
					$encVideoHtmlUri = $encVideoName + ".html";
	
					Get-Content movie.html.template | %{ 
						($_ -replace "{movieUri}",$encVideoName) -replace "{nextUri}",$previousEncVideoHtmlUri; 
					} | Out-File -FilePath (Join-Path $folder.FullName $encVideoHtmlUri) -Encoding utf8;
					$previousEncVideoHtmlUri = $encVideoHtmlUri;
	
					$subIndexEntries = @((Get-Content episodeIndexEntry.html.template | %{ 
						$_ -replace "{posterUri}","poster.jpg" # ($basePath + $info.poster_path) 
					} | %{ 
						$_ -replace "{movieTitle}",$videoName 
					} | %{ 
						$_ -replace "{encMovieTitle}",$encVideoName 
					}) -join "`n") + $subIndexEntries;
				}

				Get-Content episodeIndex.html.template | %{ $_ -replace "{moviesList}",($subIndexEntries -join "`n"); } | Out-File -FilePath (Join-Path $folder.FullName "index.html") -Encoding utf8
			}
		}
	}
	Get-Content index.html.template | %{ $_ -replace "{moviesList}",($indexEntries -join "`n"); } | Out-File -FilePath index.html -Encoding utf8
};
