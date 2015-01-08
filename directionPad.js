(function () {
    "use strict";

    function isElementFocusable(element) {
        return element.tagName === "A";
    }

    function getCurrentlyFocusedElement() {
        var activeElement = document.activeElement;
        if (!isElementFocusable(activeElement)) {
            activeElement = null;
        }
        return activeElement;
    }

    function arrayFrom(arrayLike) {
        var array = [],
            idx = 0;

        for (idx = 0; idx < arrayLike.length; ++idx) {
            array.push(arrayLike[idx]);
        }

        return array;
    }

    function convertRect(rectIn) {
        var rectOut = { 
                left: rectIn.left, 
                right: rectIn.left + rectIn.width, 
                top: rectIn.top, 
                bottom: rectIn.top + rectIn.height
            },
            swap;

        if (rectOut.left > rectOut.right) {
            swap = rectOut.left;
            rectOut.left = rectOut.right;
            rectOut.right = swap;
        }
        if (rectOut.top > rectOut.bottom) {
            swap = rectOut.top;
            rectOut.top = rectOut.bottom;
            rectOut.bottom = swap;
        }

        if (isNaN(rectOut.top)) {
            rectOut.top = 0;
        }
        if (isNaN(rectOut.bottom)) {
            rectOut.bottom = 0;
        }
        if (isNaN(rectOut.left)) {
            rectOut.left = 0;
        }
        if (isNaN(rectOut.right)) {
            rectOut.right = 0;
        }

        return rectOut;
    }

    function getElementCenter(element) {
        var rect = getElementRect(element);
        return { 
            x: rect.left + (rect.right - rect.left) / 2, 
            y: rect.top + (rect.bottom - rect.top) / 2, 
        };
    }

    function getElementRect(element) {
        return element ? convertRect(element.getBoundingClientRect()) : { top: 0, bottom: 0, left: 0, right: 0 };
    }

    function rectContainsPointInclusive(rect, point) {
        return point.x >= rect.left && 
            point.x <= rect.right &&
            point.y >= rect.top && 
            point.y <= rect.bottom;
    }

    function pointDistance(left, right) {
        return Math.sqrt(Math.pow(left.x - right.x, 2) + Math.pow(left.y - right.y, 2));
    }

    function normalizeForCmp(left, right) {
        return left == right ? 0 : (left < right ? -1 : 1);
    }

    function getFocusableElements() {
        return arrayFrom(document.querySelectorAll("a"));
    }

    function changeFocusedElement(filterRange, currentCenter) {
        var bestElement,
            bestElementRect,
            sortedFilteredElements = getFocusableElements().filter(function (element) {
                return rectContainsPointInclusive(filterRange, getElementCenter(element));
            }).sort(function (left, right) {
                return normalizeForCmp(pointDistance(getElementCenter(left), currentCenter), pointDistance(getElementCenter(right), currentCenter));
            });

        if (sortedFilteredElements.length) {
            bestElement = sortedFilteredElements[0];
            bestElement.focus();
            bestElementRect = getElementRect(bestElement);
            if (bestElementRect.top < 0 || 
             bestElementRect.left < 0 ||
             bestElementRect.bottom > innerHeight || 
             bestElementRect.right > innerWidth) {
                bestElement.scrollIntoView();
            }
        }
        return sortedFilteredElements.length != 0;
    }

    function changeFocusedElementLeft() {
        var focusedRect = getElementRect(getCurrentlyFocusedElement()),
            focusedCenter = getElementCenter(getCurrentlyFocusedElement());
        return changeFocusedElement({ left: -Infinity, top: -Infinity, bottom: Infinity, right: focusedRect.left }, focusedCenter);
    }

    function changeFocusedElementRight() {
        var focusedRect = getElementRect(getCurrentlyFocusedElement()),
            focusedCenter = getElementCenter(getCurrentlyFocusedElement());
        return changeFocusedElement({ left: focusedRect.right, top: -Infinity, bottom: Infinity, right: Infinity }, focusedCenter);
    }

    function changeFocusedElementUp() {
        var focusedRect = getElementRect(getCurrentlyFocusedElement()),
            focusedCenter = getElementCenter(getCurrentlyFocusedElement());
        return changeFocusedElement({ left: -Infinity, top: -Infinity, bottom: focusedRect.top, right: Infinity }, focusedCenter);
    }

    function changeFocusedElementDown() {
        var focusedRect = getElementRect(getCurrentlyFocusedElement()),
            focusedCenter = getElementCenter(getCurrentlyFocusedElement());
        return changeFocusedElement({ left: -Infinity, top: focusedRect.bottom, bottom: Infinity, right: Infinity }, focusedCenter);
    }

    function initialize() {
        changeFocusedElement({ left: -Infinity, top: -Infinity, right: Infinity, bottom: Infinity }, { x: 0, y: 0 });
        document.addEventListener("keydown", function keyDownEventHandler(keyEvent) {
            var handled = false;
            switch (keyEvent.keyCode) {
            case 37: // left
                handled = changeFocusedElementLeft();
                break;
            case 38: // up
                handled = changeFocusedElementUp();
                break;
            case 39: // right
                handled = changeFocusedElementRight();
                break;
            case 40: // down
                handled = changeFocusedElementDown();
                break;
            }
            if (handled) {
                keyEvent.stopPropagation();
                keyEvent.preventDefault();
            }
        });
    }

    document.addEventListener("DOMContentLoaded", initialize);
})();
