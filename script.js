(function() {
	"use strict";
	
	var videoId,
		videoElement,
		stateLoaded;

	function initialize() {
		var videos = document.getElementsByTagName("video");

		if (videos.length > 0) {
			videoElement = videos[0];
			videoId = videoElement.src;

			videoElement.addEventListener("canplay", finishInitialize);
		}
		else {
			applyRecentlyWatched();
		}
	}

	function finishInitialize() {
		videoElement.removeEventListener("canplay", finishInitialize);
		updateRecentlyWatched();
		restoreState();
		window.addEventListener("beforeunload", saveState);
		setInterval(saveState, 30 * 1000); // Save state every 30s just in case of crash etc.
	}

	function saveState() {
		if (stateLoaded) {
			localStorage[videoId + "#state"] = JSON.stringify({
				currentTime: videoElement.currentTime,
				paused: videoElement.paused,
				volume: videoElement.volume,
				muted: videoElement.muted
			});
		}
	}

	function restoreState() {
		var state;
		if (localStorage.hasOwnProperty(videoId + "#state")) {
			state = JSON.parse(localStorage[videoId + "#state"]);
			videoElement.currentTime = state.currentTime;
			videoElement.volume = state.volume;
			videoElement.muted = state.muted;
			if (state.paused) {
				videoElement.pause();
			}
			else {
				videoElement.play();
			}
		}

		stateLoaded = true;
	}

	function updateRecentlyWatched() {
		var recentlyWatched = getRecentlyWatched(),
			pathSegments,
			lastPathSegment;

		if (!recentlyWatched.length || recentlyWatched[0] !== document.location) {
			pathSegments = document.location.pathname.split("/").filter(function(pathSegment) {
				return !!pathSegment.length;
			});
			lastPathSegment = pathSegments[pathSegments.length - 1] + "/";

			if (recentlyWatched.indexOf(lastPathSegment) >= 0) {
				recentlyWatched.splice(recentlyWatched.indexOf(lastPathSegment), 1);
			}

			recentlyWatched = ([lastPathSegment].concat(recentlyWatched)).slice(0, 4);
			localStorage["recentlyWatched"] = JSON.stringify(recentlyWatched);
		}
	}

	function applyRecentlyWatched() {
		var recentlyWatchedElement = document.getElementById("recentlyWatched");

		getRecentlyWatched().forEach(function(watchedUri) {
			var original = document.querySelector("a[href='" + watchedUri + "']"),
				clone = original && original.parentNode.cloneNode(true);
			if (clone) {
				recentlyWatchedElement.appendChild(clone);
			}
		});
	}

	function getRecentlyWatched() {
		var recentlyWatched = localStorage["recentlyWatched"];
		return (recentlyWatched && JSON.parse(recentlyWatched)) || [];
	}

	document.addEventListener("DOMContentLoaded", initialize);
})();
