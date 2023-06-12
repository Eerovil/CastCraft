//@ts-nocheck

(function() {
	var vendors = ['webkit', 'moz', 'ms', 'o'], vp = null;
	for (var x = 0; x < vendors.length && !window.requestAnimationFrame && !window.cancelAnimationFrame; x++)
	{
		vp = vendors[x];
		window.requestAnimationFrame = window.requestAnimationFrame || window[vp + 'RequestAnimationFrame'];
		window.cancelAnimationFrame = window.cancelAnimationFrame || window[vp + 'CancelAnimationFrame'] || window[vp + 'CancelRequestAnimationFrame'];
	}
	if (/iP(ad|hone|od).*OS 6/.test(window.navigator.userAgent) || !window.requestAnimationFrame || !window.cancelAnimationFrame) //iOS6 is buggy.
	{
		var lastTime = 0;
		window.requestAnimationFrame = function(callback, element)
		{
			var now = window.performance.now();
			var nextTime = Math.max(lastTime + 16, now);
			return setTimeout(function() { callback(lastTime = nextTime); }, nextTime - now);
		};
		window.cancelAnimationFrame = clearTimeout;
	}
}());
