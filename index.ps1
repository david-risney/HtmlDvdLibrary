$config = (Invoke-WebRequest -Uri "http://api.themoviedb.org/3/configuration?api_key=41d7473ac4fa3fb61a3eca0bd2ec47a9").Content | ConvertFrom-Json;
$indexEntries = "";

Get-ChildItem * -Directory | %{
	$name = $_.Name;
	$encName = [System.Uri]::EscapeDataString($name);
	$infoPath = (Join-Path $_.FullName "info.json");
	if (!(Test-Path $infoPath)) {
		(Invoke-WebRequest -Uri ("http://api.themoviedb.org/3/search/movie?api_key=41d7473ac4fa3fb61a3eca0bd2ec47a9&query=" + $encName) -OutFile $infoPath);
	}
	if (Test-Path $infoPath) {
		$info = (gc $infoPath | ConvertFrom-Json).results[0];
		$basePath = $config.images.base_url + "original";

		$backdropPath = (Join-Path $_.FullName "backdrop.jpg");
		if ($info.backdrop_path -and !(Test-Path $backdropPath)) {
			Invoke-WebRequest ($basePath + $info.backdrop_path) -OutFile $backdropPath;
		}

		$posterPath = (Join-Path $_.FullName "poster.jpg");
		if ($info.poster_path -and !(Test-Path $posterPath)) {
			Invoke-WebRequest ($basePath + $info.poster_path) -OutFile $posterPath;
		}

		Get-Content movie.html.template | %{ $_ -replace "{movieUri}",$encName; } | Out-File -FilePath (Join-Path $_.FullName "index.html") -Encoding utf8;
		$indexEntries += ((Get-Content indexEntry.html.template | %{ 
			$_ -replace "{posterUri}",($basePath + $info.poster_path) 
		} | %{ 
			$_ -replace "{movieTitle}",$name 
		} | %{ 
			$_ -replace "{encMovieTitle}",$encName 
		}) -join "`n");
	}
	Get-Content index.html.template | %{ $_ -replace "{moviesList}",($indexEntries -join "`n"); } | Out-File -FilePath index.html -Encoding utf8
};
