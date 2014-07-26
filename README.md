# HtmlDvdLibrary

A simple HTML based DVD library intended to be loadable on the browser on your Xbox One, Wii U or similar such large screen, limited interaction, large distance between user and screen scenarios.

## Usage

At a high level you run index.ps1 to index all of the movies and produce the appropriate HTML.

The index.ps1 script expects that all subdirectories are the name of a movie and contain a file with the same name as the containing directory but with the extension m4v.

    index.ps1
    Movie Name 1\Movie Name 1.m4v
    Movie Name 2\Movie Name 2.m4v

The script downloads DVD art and produces index.html files for the movie index and an index.html for each movie subdirectory. Host the whole thing on a web server that supports HTTP range requests.

## Ripping DVDs

I've ripped my DVD library by on one computer ripping the DVD with DVD Rip and on another transcoding the ripped DVD to MP4 using Handbrake.

* [DVD Rip](http://lifehacker.com/355281/dvd-rip-automates-one-click-dvd-ripping) for easy DVD ripping.
* [Handbrake](http://lifehacker.com/most-popular-video-converter-handbrake-1206787968) for converting from a ripped DVD to MP4.

### Episodic DVDs

Ripping DVDs of TV episodes I've found to be more difficult. In one case all the episodes where on one title and each had six chapters. I wrote the following in PowerShell to use the Handbrake CLI to rip the individual episodes. To reuse for another purpose will obviously require updating the script for the appropriate number of chapters per episode, etc.

    $epOffset = 0;
    $dvdPath = "E:\UserData\Public\Videos\Dvds\Cowboy Bebop (Disc 1)";
    $chaptersPerEp = 6;
    @(0..8) | %{ 
        $name = "S01E{0:00}.m4v" -f ($_ + 1 + $epOffset);
        $chs = "{0}-{1}" -f ($_ * $chaptersPerEp + 1),(($_ + 1) * $chaptersPerEp);
        if (!(test-path $name)) { 
            "Making $name from $chs"; 
            & 'C:\Program Files\Handbrake\HandBrakeCLI.exe' -t 2 -N English --native-dub -c $chs -i $dvdPath -o $name  
        }
    }

Other TV series DVD sets had a different title for each episode, making it much simpler to extract.

    $epOffset = 0;
    $dvdPath = "E:\UserData\Public\Videos\Dvds\Firefly - The Complete Series Disc 1";
    @(0..2) | %{
        $title = $_ + 1;
        $name = "S01E{0:00}.m4v" -f ($_ + 1 + $epOffset);
        if (!(test-path $name)) {
            "Making $name from $title";
            & 'C:\Program Files\Handbrake\HandBrakeCLI.exe' -t $title -N English --native-dub -i $dvdPath -o $name;
        }
    }

