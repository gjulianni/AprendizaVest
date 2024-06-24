document.addEventListener("DOMContentLoaded", function() {
    var scrollLinks = document.querySelectorAll('.smooth-scroll');

    scrollLinks.forEach(function(scrollLink) {
        scrollLink.addEventListener('click', function(event) {
            event.preventDefault();
            var targetId = this.getAttribute('href');
            var targetPosition = document.querySelector(targetId).offsetTop - document.querySelector('.sub-topnav').offsetHeight;
            var startPosition = window.scrollY;
            var distance = targetPosition - startPosition;
            var duration = 1200; // Tempo em milissegundos

            var start = null;
            window.requestAnimationFrame(step);

            function step(timestamp) {
                if (!start) start = timestamp;
                var progress = timestamp - start;
                window.scrollTo(0, easeInOutCubic(progress, startPosition, distance, duration));
                if (progress < duration) window.requestAnimationFrame(step);
            }

            function easeInOutCubic(t, b, c, d) {
                t /= d / 2;
                if (t < 1) return c / 2 * t * t * t + b;
                t -= 2;
                return c / 2 * (t * t * t + 2) + b;
            }
        });
    });
});