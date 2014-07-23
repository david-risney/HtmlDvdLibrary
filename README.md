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
