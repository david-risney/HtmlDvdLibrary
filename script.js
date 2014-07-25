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
			videoElement.addEventListener("ended", videoComplete);
		}
		else {
			applyStateToPosters();
			applyRecentlyWatched();
		}

		if (document.scripts[document.scripts.length - 1].getAttribute("data-context") === "forceUpdateRecentlyWatched") {
			updateRecentlyWatched();
		}
	}

	function videoComplete() {
		document.location = document.querySelector(".nextPage").href;
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
			localStorage[getStateStorageName()] = JSON.stringify({
				currentTime: videoElement.currentTime,
				duration: videoElement.duration,
				paused: videoElement.paused,
				volume: videoElement.volume,
				muted: videoElement.muted
			});
		}
	}

	function restoreState() {
		var state;
		if (localStorage.hasOwnProperty(getStateStorageName())) {
			state = JSON.parse(localStorage[getStateStorageName()]);
			videoElement.currentTime = Math.min(state.currentTime, state.duration - 2);
			videoElement.volume = state.volume;
			videoElement.muted = state.muted;

			if (state.paused || state.duration - state.currentTime < 3) {
				videoElement.pause();
			}
			else {
				videoElement.play();
			}
		}

		stateLoaded = true;
	}

	function getLastPathSegment(pathname) {
		var pathSegments,
			lastPathSegment;
		pathSegments = pathname.split("/").filter(function(pathSegment) {
			return !!pathSegment.length;
		});
		return pathSegments[pathSegments.length - 1];
	}

	function getAllButFinalPathSegment(pathname) {
		var pathSegments,
			lastPathSegment;
		pathSegments = pathname.split("/").filter(function(pathSegment) {
			return !!pathSegment.length;
		});
		return "/" + pathSegments.slice(0, pathSegments.length - 1).join("/") + "/";
	}

	function updateRecentlyWatched() {
		var recentlyWatched = getRecentlyWatched(getRecentlyWatched.video),
			lastPathSegment = getLastPathSegment(document.location.pathname);

		if (!recentlyWatched.length || recentlyWatched[0] !== document.location) {
			if (recentlyWatched.indexOf(lastPathSegment) >= 0) {
				recentlyWatched.splice(recentlyWatched.indexOf(lastPathSegment), 1);
			}

			recentlyWatched = ([lastPathSegment].concat(recentlyWatched)).slice(0, 4);
			localStorage[getRecentlyWatchedStorageName(getRecentlyWatched.video)] = JSON.stringify(recentlyWatched);
		}
	}

	function applyRecentlyWatched() {
		var recentlyWatchedElement = document.getElementById("recentlyWatched");

		getRecentlyWatched(getRecentlyWatched.index).forEach(function(watchedUri) {
			var original = document.querySelector("a[href='" + watchedUri + "']") ||
				document.querySelector("a[href='" + watchedUri + "/']"),
				clone = original && original.parentNode.cloneNode(true);
			if (clone) {
				recentlyWatchedElement.appendChild(clone);
			}
		});
	}

	function applyStateToPosters() {
		var links = document.querySelectorAll("a[class~='smallPoster']"),
			link,
			idx = 0,
			state,
			completionBar;

		for (; idx < links.length; ++idx) {
			link = links[idx];
			state = localStorage[getStateStorageName(link.href)]
			if (state) {
				state = JSON.parse(state);
				completionBar = link.querySelector(".completionBar");
				completionBar.style.width = ((state.currentTime / state.duration) * 100) + "%";
				completionBar.parentNode.classList.add("visibleCompletion");
			}
		}
	}

	function getId() {
		return document.location.pathname;
	}
	function getParentId() {
		return getAllButFinalPathSegment(document.location.pathname);
	}

	function getStateStorageName(absoluteUri) {
		return (absoluteUri || ("" + document.location)) + "#state";
	}

	function getRecentlyWatchedStorageName(requestContext) {
		var pathContext = (requestContext === getRecentlyWatched.video) ? 
				getParentId() : getId();
		return pathContext + "#recentlyWatched";
	}

	function getRecentlyWatched(requestContext) {
		var recentlyWatched = localStorage[getRecentlyWatchedStorageName(requestContext)];
		return (recentlyWatched && JSON.parse(recentlyWatched)) || [];
	}
	getRecentlyWatched.index = "index";
	getRecentlyWatched.video = "video";


	document.addEventListener("DOMContentLoaded", initialize);
})();
