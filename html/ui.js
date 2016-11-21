//===== Collection of small utilities
/*
 * Bind/Unbind events
 *
 * Usage:
 *   var el = document.getElementyById('#container');
 *   bnd(el, 'click', function() {
 *     console.log('clicked');
 *   });
 */
var bnd = function bnd(
  d, // a DOM element
  e, // an event name such as "click"
  f // a handler function
) {
  d.addEventListener(e, f, false);
};

/*
 * Create DOM element
 *
 * Usage:
 *   var el = m('<h1>Hello</h1>');
 *   document.body.appendChild(el);
 *
 * Copyright (C) 2011 Jed Schmidt <http://jed.is> - WTFPL
 * More: https://gist.github.com/966233
 */

var m = function createDomEl(
  a, // an HTML string
  b, // placeholder
  c // placeholder
) {
  b = document; // get the document,
  c = b.createElement("p"); // create a container element,
  c.innerHTML = a; // write the HTML to it, and
  a = b.createDocumentFragment(); // create a fragment.

  while (b = c.firstChild) // While the container element has a first child
    a.appendChild(b); // append the child to the fragment,

  return a; // and then return the fragment.
};

/*
 * DOM selector
 *
 * Usage:
 *   $('div');
 *   $('#name');
 *   $('.name');
 *
 * Copyright (C) 2011 Jed Schmidt <http://jed.is> - WTFPL
 * More: https://gist.github.com/991057
 */

var $ = function (
  a, // take a simple selector like "name", "#name", or ".name", and
  b // an optional context, and
) {
  a = a.match(/^(\W)?(.*)/); // split the selector into name and symbol.
  return ( // return an element or list, from within the scope of
    b // the passed context
    || document // or document,
  )[
    "getElement" + ( // obtained by the appropriate method calculated by
      a[1] ? a[1] == "#" ? "ById" // the node by ID,
      : "sByClassName" // the nodes by class name, or
      : "sByTagName" // the nodes by tag name,
    )
    ](
    a[2] // called with the name.
  )
};

/*
 * Get cross browser xhr object
 *
 * Copyright (C) 2011 Jed Schmidt <http://jed.is>
 * More: https://gist.github.com/993585
 */

var j = function (
  a // cursor placeholder
) {
  for ( // for all a
    a = 0; // from 0
    a < 4; // to 4,
    a++ // incrementing
  ) try { // try
    return a // returning
      ? new ActiveXObject( // a new ActiveXObject
        [ // reflecting
        , // (elided)
          "Msxml2", // the various
          "Msxml3", // working
          "Microsoft" // options
        ][a] + // for Microsoft implementations, and
        ".XMLHTTP" // the appropriate suffix,
      ) // but make sure to
      : new XMLHttpRequest // try the w3c standard first, and
  }
  catch (e) {} // ignore when it fails.
};

// dom element iterator: domForEach($(".some-class"), function(el) { ... });
function domForEach(els, fun) {
  return Array.prototype.forEach.call(els, fun);
}

// createElement short-hand

var e = function (a) {
  return document.createElement(a);
};

// chain onload handlers

function onLoad(f) {
  var old = window.onload;
  if (typeof old != 'function') {
    window.onload = f;
  }
  else {
    window.onload = function () {
      old();
      f();
    }
  }
}

//===== helpers to add/remove/toggle HTML element classes

function addClass(el, cl) {
  if (el.className !== undefined) {
    el.className += ' ' + cl;
  }
  else {
    el.className = cl; //No space infront of class name if object contains no class. Not necessary, but it keeps the code prettier.
  }
}

function removeClass(el, cl) {
  var cls = el.className.split(/\s+/),
    l = cls.length;
  for (var i = 0; i < l; i++) {
    if (cls[i] === cl) cls.splice(i, 1);
  }
  el.className = cls.join(' ');
  return cls.length != l
}

function toggleClass(el, cl) {
  if (!removeClass(el, cl)) addClass(el, cl);
}

function hideClass(cl) {
  $(cl).setAttribute("hidden", "");
}

function showClass(cl) {
  $(cl).removeAttribute("hidden", "");
}

function hideSpinnerShow(klass, nameHide, nameShow) {
  hideClass("#" + klass + "-" + nameHide);
  showClass("#" + klass + "-" + nameShow);
}

//===== AJAX

function ajaxReq(method, url, ok_cb, err_cb, data) {
  var xhr = j(); //This should allow requests to be made from any browser. FIXME: Use more intuative function name?
  xhr.open(method, url, true);
  var timeout = setTimeout(function () {
    xhr.abort();
    console.log("XHR abort:", method, url);
    xhr.status = 599;
    xhr.responseText = "request time-out";
  }, 9000); //After 9 seconds we print method&url in console, & return error code.
  xhr.onreadystatechange = function () {
      if (xhr.readyState != 4) {
        return;
      }
      clearTimeout(timeout);
      if (xhr.status >= 200 && xhr.status < 300) {
        //      console.log("XHR done:", method, url, "->", xhr.status);
        ok_cb(xhr.responseText);
      }
      else {
        console.log("XHR ERR :", method, url, "->", xhr.status, xhr.responseText,
          xhr);
        err_cb(xhr.status, xhr.responseText);
      }
    }
    //  console.log("XHR send:", method, url);
  try {
    xhr.send(data);
  }
  catch (err) {
    console.log("XHR EXC :", method, url, "->", err);
    err_cb(599, err);
  }
}

function dispatchJson(resp, ok_cb, err_cb) {
  var j;
  try {
    j = JSON.parse(resp);
  }
  catch (err) {
    console.log("JSON parse error: " + err + ". In: " + resp);
    err_cb(500, "JSON parse error: " + err);
    return;
  }
  ok_cb(j);
}

function ajaxJson(method, url, ok_cb, err_cb) {
  ajaxReq(method, url, function (resp) {
    dispatchJson(resp, ok_cb, err_cb);
  }, err_cb);
}

function ajaxSpin(method, url, ok_cb, err_cb) {
  showClass("#spinner");
  ajaxReq(method, url, function (resp) {
    hideClass("#spinner");
    ok_cb(resp);
  }, function (status, statusText) {
    hideClass("#spinner");
    //showWarning("Error: " + statusText);
    err_cb(status, statusText);
  });
}

function ajaxJsonSpin(method, url, ok_cb, err_cb) {
  ajaxSpin(method, url, function (resp) {
    dispatchJson(resp, ok_cb, err_cb);
  }, err_cb);
}

//===== main menu, header spinner and notification boxes

function hidePopup(el) {
  addClass(el, "popup-hidden");
  addClass(el.parentNode, "popup-target");
}

onLoad(function () {
  var l = $("#layout");
  var o = l.childNodes[0];
  // spinner
  l.insertBefore(m(
    '<div id="spinner" class="spinner" hidden></div>'), o);
  // notification boxes
  l.insertBefore(m(
    '<div id="messages"><div id="warning" hidden></div><div id="notification" hidden></div></div>'
  ), o);
  // menu hamburger button
  l.insertBefore(m(
    '<a href="#menu" id="menuLink" class="menu-link"><span></span></a>'
  ), o);
  // menu left-pane
  var mm = m(
    '<div id="menu">\
      <div class="pure-menu">\
        <a class="pure-menu-heading" href="https://github.com/jeelabs/esp-link">\
        <img src="/favicon.ico" height="32">&nbsp;esp-link</a>\
        <div class="pure-menu-heading system-name" style="padding: 0px 0.6em"></div>\
        <ul id="menu-list" class="pure-menu-list"></ul>\
      </div>\
    </div>\
    '
  );
  l.insertBefore(mm, o);

  // make hamburger button pull out menu
  var ml = $('#menuLink'),
    mm = $('#menu');
  bnd(ml, 'click', function (e) {
    //    console.log("hamburger time");
    var active = 'active';
    e.preventDefault();
    toggleClass(l, active);
    toggleClass(mm, active);
    toggleClass(ml, active);
  });

  // hide pop-ups
  domForEach($(".popup"), function (el) {
    hidePopup(el);
  });

  // populate menu via ajax call
  var getMenu = function () {
    ajaxJson("GET", "/menu", function (data) {
      var html = "",
        path = window.location.pathname;
      for (var i = 0; i < data.menu.length; i += 2) {
        var href = data.menu[i + 1];
        html = html.concat(" <li class=\"pure-menu-item" +
          (path === href ? " pure-menu-selected" : "") +
          "\">" +
          "<a href=\"" + href +
          "\" class=\"pure-menu-link\">" +
          data.menu[i] + "</a></li>");
      }
      $("#menu-list").innerHTML = html;

      var v = $("#version");
      if (v !== null) {
        v.innerHTML = data.version;
      }

      $('title')[0].innerHTML = data.name;
      setEditToClick("system-name", data.name);
    }, function () {
      setTimeout(getMenu, 1000);
    });
  };
  getMenu();
});

//===== Wifi info

function showWifiInfo(data) {
  Object.keys(data).forEach(function (v) {
    var el = $("#wifi-" + v);
    if (el !== null) {
      if (el.nodeName === "INPUT") el.value = data[v];
      else el.innerHTML = data[v];
    }
  });
  var dhcp = $('#dhcp-r' + data.dhcp);
  if (dhcp) dhcp.click();
  hideSpinnerShow("wifi", "spinner", "table");
  currAp = data.ssid;
}

function getWifiInfo() {
  ajaxJson('GET', "/wifi/info", showWifiInfo,
    function () {
      window.setTimeout(getWifiInfo, 1000);
    });
}

//===== Telnet info

function showTelnetInfo(data) {
  Object.keys(data).forEach(function (v) {
    setEditToClick("telnet-" + v, data[v]);
  });
  hideSpinnerShow("telnet", "spinner", "table");
  //currAp = data.ssid;  //Thought this was needed based on showSystemInfo & getWifiInfo, but after a closer look it appears uneeded.
}

function getTelnetInfo() {
  ajaxJson('GET', "/telnet", showTelnetInfo,
    function () {
      window.setTimeout(getTelnetInfo, 1000);
    });
}

//===== System info

function showSystemInfo(data) {
  Object.keys(data).forEach(function (v) {
    setEditToClick("system-" + v, data[v]);
  });
  hideSpinnerShow("system", "spinner", "table");
  currAp = data.ssid;
}

function getSystemInfo() {
  ajaxJson('GET', "/system/info", showSystemInfo,
    function () {
      window.setTimeout(getSystemInfo, 1000);
    });
}

function makeAjaxInput(klass, field) {
  domForEach($("." + klass + "-" + field), function (div) {
    var eon = $(".edit-on", div);
    var eoff = $(".edit-off", div)[0];
    var url = "/" + klass + "/update?" + field;
    //Dirty fix to avoid to seperate name spaces to GET or PUT telnet ports
    if (klass == "telnet") {
      url = "/" + klass + "?" + field;
    }

    if (eoff === undefined || eon === undefined) return;

    var enableEditToClick = function () {
      eoff.setAttribute('hidden', '');
      domForEach(eon, function (el) {
        el.removeAttribute('hidden');
      });
      console.log(eon[0]);
      eon[0].select(); //This fails for 'select' HTML tags becuase there is no internal select()
      return false;
    };

    var submitEditToClick = function (v) {
      //      console.log("Submit POST "+url+"="+v);
      ajaxSpin("POST", url + "=" + v, function () {
        domForEach(eon, function (el) {
          el.setAttribute('hidden', '');
        });
        eoff.removeAttribute('hidden');
        setEditToClick(klass + "-" + field, v);
        showNotification(field + " changed to " + v);
      }, function () {
        showWarning(field + " change failed");
      });
      return false;
    };

    bnd(eoff, "click", function () {
      return enableEditToClick();
    });
    bnd(eon[0], "blur", function () {
      return submitEditToClick(eon[0].value);
    });
    bnd(eon[0], "keyup", function (ev) {
      if ((ev || window.event).keyCode == 13) return submitEditToClick(eon[0].value);
    });
  });
}

function setEditToClick(klass, value) {
  domForEach($("." + klass), function (div) {
    if (div.children.length > 0) {
      domForEach(div.children, function (el) {
        if (el.nodeName === "INPUT") el.value = value;
        else if (el.nodeName !== "DIV") el.innerHTML = value;
      });
    }
    else {
      div.innerHTML = value;
    }
  });
}

//===== Notifications

function showWarning(text) {
  var el = $("#warning");
  el.innerHTML = text;
  el.removeAttribute('hidden');
  window.scrollTo(0, 0); //comment this line to prevent window scroll up notifications
}

function hideWarning() {
  // $("#warning").setAttribute('hidden', ''); //Why are we setting el = to an object here?
  hideClass("#warning");
}

var notifTimeout = null;

function showNotification(text) {
  var el = $("#notification");
  el.innerHTML = text;
  el.removeAttribute('hidden');
  window.scrollTo(0, 0); //comment this line to prevent window scroll up notifications
  if (notifTimeout !== null) clearTimeout(notifTimeout); //typos?
  var notifTimeout = setTimeout(function () {
    el.setAttribute('hidden', '');
    notifTimeout = null;
  }, 4000);
}

//===== GPIO Pin mux card

var pinPresets = {
  // array: reset, isp, conn, ser, swap, rxpup
  "esp-01": [0, -1, 2, -1, 0, 1],
  "esp-12": [12, 14, 0, 2, 0, 1],
  "esp-12 swap": [1, 3, 0, 2, 1, 1],
  "esp-bridge": [12, 13, 0, 14, 0, 0],
  "wifi-link-12": [1, 3, 0, 2, 1, 0],
};

function createPresets(sel) {
  for (var p in pinPresets) {
    var opt = m('<option value="' + p + '">' + p + '</option>');
    sel.appendChild(opt);
  }

  function applyPreset(v) {
    var pp = pinPresets[v];
    if (pp === undefined) return pp;
    //    console.log("apply preset:", v, pp);
    function setPP(k, v) {
      $("#pin-" + k).value = v;
    }
    setPP("reset", pp[0]);
    setPP("isp", pp[1]);
    setPP("conn", pp[2]);
    setPP("ser", pp[3]);
    setPP("swap", pp[4]);
    $("#pin-rxpup").checked = !!pp[5];
    sel.value = 0;
  }

  bnd(sel, "change", function (ev) {
    ev.preventDefault();
    applyPreset(sel.value);
  });
}

function displayPins(resp) {
  function createSelectForPin(name, v) {
    var sel = $("#pin-" + name);
    addClass(sel, "pure-button");
    sel.innerHTML = "";
		[-1, 0, 1, 2, 3, 4, 5, 12, 13, 14, 15].forEach(function (i) {
      var opt = document.createElement("option");
      opt.value = i;
      if (i >= 0) opt.innerHTML = "gpio" + i;
      else opt.innerHTML = "disabled";
      if (i === 1) opt.innerHTML += "/TX0";
      if (i === 2) opt.innerHTML += "/TX1";
      if (i === 3) opt.innerHTML += "/RX0";
      if (i == v) opt.selected = true;
      sel.appendChild(opt);
    });
    var pup = $(".popup", sel.parentNode);
    if (pup >= 1) hidePopup(pup[0]); // pup will still return an empty object, so !== undefined will not work
  }

  createSelectForPin("reset", resp["reset"]);
  createSelectForPin("isp", resp["isp"]);
  createSelectForPin("conn", resp["conn"]);
  createSelectForPin("ser", resp["ser"]);
  $("#pin-swap").value = resp["swap"];
  $("#pin-rxpup").checked = !!resp["rxpup"];
  createPresets($("#pin-preset"));

  hideClass("#pin-spinner");
  showClass("#pin-table");
}

function fetchPins() {
  ajaxJson("GET", "/pins", displayPins, function () {
    window.setTimeout(fetchPins, 1000);
  });
}

function setPins(ev) {
  ev.preventDefault();
  var url = "/pins";
  var sep = "?";
	["reset", "isp", "conn", "ser", "swap"].forEach(function (p) {
    url += sep + p + "=" + $("#pin-" + p).value;
    sep = "&";
  });
  url += "&rxpup=" + ($("#pin-rxpup").checked ? "1" : "0");
  //  console.log("set pins: " + url);
  ajaxSpin("POST", url, function () {
    showNotification("Pin assignment changed");
  }, function (status, errMsg) {
    showWarning(errMsg);
    window.setTimeout(fetchPins, 100);
  });
}

function populateAjaxSelect(klass, field, opts, val) {
  var sel = $("#" + klass + "-" + field);
  // console.dir(sel);
  // console.log("sel : " + sel);
  addClass(sel, "pure-button");
  sel.innerHTML = "";
  var arrOpts = opts.split(',');
  arrOpts.forEach(function (i) {
    var opt = document.createElement("option");
    opt.value = i;
    opt.innerHTML = i;
    if (i == val) opt.selected = true;
    sel.appendChild(opt);
  });

  //No popup on some fields
  var pup = $(".popup", sel.parentNode);
  if (pup.size >= 1) hidePopup(pup[0]);

  hideSpinnerShow(klass, "spinner", "table");
}

function setTelnet() {
  var url = "/telnet";
  var sep = "?";
  //["port0mode", "port0pass", "port1mode", "port1pass"].forEach(function(p) {
	["port0mode", "port1mode"].forEach(function (p) {
    if ($("#telnet-" + p).length) {
      url += sep + p + "=" + $("#telnet-" + p).value;
      sep = "&";
    }
  });
  ajaxSpin("POST", url, function () {
    showNotification("Telnet options changed");
  }, function (status, errMsg) {
    showWarning(errMsg);
    window.setTimeout(showTelnetInfo, 100);
  });
}

// Helper function to increase readability of code. FIXME @tve Keep or delete?
function delayedCall(func, timeout) {
  window.setTimeout(func, timeout);
}

function getAjaxInfo(klass) {
  var data = ajaxJson('GET', "/" + klass, showAjaxInfo, function () {
    window.setTimeout(getAjaxInfo, 1000);
  });
}

function showAjaxInfo(data) {
  Object.keys(data).forEach(function (v) {
    console.log("telnet" + "-" + v, data[v]);
  });
  ajaxSelectInit(data);
}

var ajaxSelectPresets = {
  // array: Sets ajax select options
  "telnet-port0mode": ['open', 'disabled', 'secure', 'password'],
  "telnet-port1mode": ['open', 'disabled', 'secure', 'password'],
};
 
function ajaxSelectInit(data) {
  Object.keys(ajaxSelectPresets).forEach(function (name) {
    var sel = this[name];
    addClass(sel, "pure-button");
    sel.innerHTML = "";
    var lookupVal = name.split("-");
    lookupVal = lookupVal[1];
    var flashCfgSelect = data[lookupVal];
    ajaxSelectPresets[name].forEach(function (newSelPreset) {
      var opt = document.createElement("option");
      opt.value = newSelPreset;
      opt.innerHTML = newSelPreset;
      if (newSelPreset == flashCfgSelect) { opt.selected = true; console.log("This matches our current flashConfig value: ", flashCfgSelect); console.dir(opt); }
      sel.appendChild(opt);
    });

    hideSpinnerShow("telnet", "spinner", "table");

    var pup = $(".popup", sel.parentNode);
    if (pup.size >= 1) hidePopup(pup[0]);
  });
}