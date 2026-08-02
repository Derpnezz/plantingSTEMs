// plantingSTEMs — shared site behavior (plain vanilla JS)

document.addEventListener("DOMContentLoaded", function () {
  loadPartials().then(function () {
    initNav();
    initReveal();
    initAccordions();
    initGallery();
    initStatCounters();
    initFakeForms();
  });
});

// Fetch and inject the shared header/footer markup so it only has to be
// written once (in partials/header.html and partials/footer.html)
// instead of being duplicated on every page.
function loadPartials() {
  var headerSlot = document.querySelector("[data-include='header']");
  var footerSlot = document.querySelector("[data-include='footer']");

  var headerRequest = headerSlot
    ? fetch("partials/header.html")
        .then(function (res) {
          return res.text();
        })
        .then(function (html) {
          headerSlot.outerHTML = html;
        })
        .catch(function (err) {
          console.error("Failed to load header partial:", err);
        })
    : Promise.resolve();

  var footerRequest = footerSlot
    ? fetch("partials/footer.html")
        .then(function (res) {
          return res.text();
        })
        .then(function (html) {
          footerSlot.outerHTML = html;
        })
        .catch(function (err) {
          console.error("Failed to load footer partial:", err);
        })
    : Promise.resolve();

  return Promise.all([headerRequest, footerRequest]);
}

// Mobile nav toggle
function initNav() {
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (!toggle || !links) return;

  toggle.addEventListener("click", function () {
    links.classList.toggle("open");
  });

  links.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      links.classList.remove("open");
    });
  });

  // Highlight active page in nav
  var current = window.location.pathname.split("/").pop() || "index.html";
  links.querySelectorAll("a").forEach(function (link) {
    var href = link.getAttribute("href");
    if (href === current || (current === "" && href === "index.html")) {
      link.classList.add("active");
    }
  });
}

// Scroll reveal animation
function initReveal() {
  var items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  if (!("IntersectionObserver" in window)) {
    items.forEach(function (el) {
      el.classList.add("in-view");
    });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 },
  );

  items.forEach(function (el) {
    observer.observe(el);
  });
}

// Accordion (used on Chapters / Volunteer pages)
function initAccordions() {
  var triggers = document.querySelectorAll(".accordion-trigger");
  triggers.forEach(function (trigger) {
    trigger.addEventListener("click", function () {
      var item = trigger.closest(".accordion-item");
      var panel = item.querySelector(".accordion-panel");
      var isOpen = item.classList.contains("open");

      // Close others in the same group
      var group = item.parentElement;
      group.querySelectorAll(".accordion-item.open").forEach(function (openItem) {
        if (openItem !== item) {
          openItem.classList.remove("open");
          openItem.querySelector(".accordion-panel").style.maxHeight = null;
        }
      });

      if (isOpen) {
        item.classList.remove("open");
        panel.style.maxHeight = null;
      } else {
        item.classList.add("open");
        panel.style.maxHeight = panel.scrollHeight + "px";
      }
    });
  });
}

// Gallery filtering + lightbox
function initGallery() {
  var filterButtons = document.querySelectorAll(".filter-btn");
  var galleryItems = document.querySelectorAll(".gallery-item");

  filterButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filterButtons.forEach(function (b) {
        b.classList.remove("active");
      });
      btn.classList.add("active");

      var filter = btn.getAttribute("data-filter");
      galleryItems.forEach(function (item) {
        var category = item.getAttribute("data-category");
        if (filter === "all" || filter === category) {
          item.style.display = "";
        } else {
          item.style.display = "none";
        }
      });
    });
  });

  var lightbox = document.querySelector(".lightbox");
  if (!lightbox) return;
  var lightboxImg = lightbox.querySelector("img");
  var closeBtn = lightbox.querySelector(".lightbox-close");

  galleryItems.forEach(function (item) {
    item.addEventListener("click", function () {
      var img = item.querySelector("img");
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
      lightbox.classList.add("open");
    });
  });

  function closeLightbox() {
    lightbox.classList.remove("open");
    lightboxImg.src = "";
  }

  closeBtn.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeLightbox();
  });
}

// Animated stat counters on the homepage
function initStatCounters() {
  var counters = document.querySelectorAll(".stat-number[data-count]");
  if (!counters.length) return;

  function animate(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    var duration = 1400;
    var start = null;

    function step(timestamp) {
      if (!start) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = prefix + Math.floor(eased * target) + suffix;
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        el.textContent = prefix + target + suffix;
      }
    }

    window.requestAnimationFrame(step);
  }

  if (!("IntersectionObserver" in window)) {
    counters.forEach(animate);
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animate(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 },
  );

  counters.forEach(function (el) {
    observer.observe(el);
  });
}

// Contact form: no backend on a static GitHub Pages site, so we
// confirm the message was composed and hand off via mailto instead
// of silently pretending to submit it.
function initFakeForms() {
  var contactForm = document.querySelector("#contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = contactForm.querySelector("#name").value.trim();
      var email = contactForm.querySelector("#email").value.trim();
      var message = contactForm.querySelector("#message").value.trim();
      var status = contactForm.querySelector(".form-status");

      if (!name || !email || !message) {
        status.textContent = "Please fill out every field before sending.";
        status.classList.remove("success");
        status.classList.add("show");
        return;
      }

      var subject = encodeURIComponent("Message from " + name + " via plantingSTEMs.org");
      var body = encodeURIComponent(message + "\n\n— " + name + " (" + email + ")");
      window.location.href = "mailto:plantingstems@gmail.com?subject=" + subject + "&body=" + body;

      status.textContent = "Opening your email app to send this message…";
      status.classList.add("success", "show");
    });
  }
}
